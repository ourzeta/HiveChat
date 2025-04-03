'use client'
import { fetchEventSource, EventStreamContentType, EventSourceMessage } from '@microsoft/fetch-event-source';
import { ChatOptions, LLMApi, LLMModel, LLMUsage, RequestMessage, ResponseContent, MCPToolResponse } from '@/app/adapter/interface';
import { prettyObject } from '@/app/utils';
import { InvalidAPIKeyError, OverQuotaError, TimeoutError } from '@/app/adapter/errorTypes';
import { FunctionCallPart, FunctionResponsePart } from '@google/generative-ai';
import { syncMcpTools } from '../actions';
import { callMCPTool } from '@/app/utils/mcpToolsServer';
import { mcpToolsToGeminiTools, geminiFunctionCallToMcpTool } from '@/app/utils/mcpToolsClient';

export default class GeminiApi implements LLMApi {
  private controller: AbortController | null = null;
  private answer = '';
  private reasoning_content = '';
  private finishReason = '';
  private inputTokens = 0;
  private outputTokens = 0;
  private totalTokens = 0;
  private mcpTools: MCPToolResponse[] = [];
  private fcallParts: FunctionCallPart[] = [];
  private finished = false;

  prepareMessage<Content>(messages: RequestMessage[]): Content[] {
    return messages.map(msg => {
      let newRoleName = 'user';
      if (msg.role === 'system') {
        newRoleName = 'model'
      }
      // 处理文本消息
      if (typeof msg.content === 'string') {
        return {
          role: newRoleName,
          parts: [{
            text: msg.content
          }]
        } as Content;
      }

      // 处理包含图像的消息
      if (Array.isArray(msg.content)) {
        const formattedContent = msg.content.map(item => {
          if (item.type === 'text') {
            return {
              text: item.text
            }
          };
          if (item.type === 'image') {
            return {
              inline_data: {
                mime_type: item.mimeType || 'image/jpeg',
                data: item.data.replace(/^data:image\/\w+;base64,/, '')
              }
            };
          }
        }).filter(Boolean);

        return {
          role: newRoleName,
          parts: formattedContent
        } as Content;
      }

      // 默认返回文本消息
      return {
        role: newRoleName,
        parts: ['']
      } as Content;
    });
  }
  async chat(options: ChatOptions) {
    this.answer = '';
    const clear = () => {
      if (!this.finished) {
        this.finished = true;
        if (this.controller) {
          this.controller.abort();
          this.controller = null;
        }
        this.answer = '';
      }
    };
    this.controller = new AbortController();

    const timeoutId = setTimeout(() => {
      this.controller?.abort('timeout');
      options.onError?.(new TimeoutError('Timeout'));
    }, 30000);

    const processOnMessage = async (event: EventSourceMessage) => {
      const text = event.data;
      try {
        const json = JSON.parse(text);

        // 是否结束，结束后 tools 调用
        if (json?.metadata && json?.metadata.isDone) {
          if (this.fcallParts.length > 0) {
            const fcRespParts: FunctionResponsePart[] = [];
            for (const fcallPart of this.fcallParts) {
              const mcpTool = geminiFunctionCallToMcpTool(options.mcpTools, fcallPart.functionCall);
              if (!mcpTool) {
                continue;
              }
              this.mcpTools.push({
                id: mcpTool.id,
                tool: mcpTool,
                status: 'invoking',
              });
              options.onUpdate({
                content: this.answer,
                reasoning_content: this.reasoning_content,
                mcpTools: this.mcpTools,
              });
              const _mcpTools = this.mcpTools;
              // fcallParts.push(fcallPart)
              const toolCallResponse = await callMCPTool(mcpTool);
              // 还需要更新工具执行状态
              const toolIndex = _mcpTools.findIndex(t => {
                return t.id === fcallPart.functionCall.name;
              });
              if (toolIndex !== -1) {
                _mcpTools[toolIndex] = {
                  ...this.mcpTools[toolIndex],
                  status: 'done',
                  response: toolCallResponse
                };
              }

              options.onUpdate({
                content: this.answer,
                reasoning_content: this.reasoning_content,
                mcpTools: _mcpTools,
              });

              fcRespParts.push({
                functionResponse: {
                  name: mcpTool.id,
                  response: toolCallResponse
                }
              })
            }

            messages.push({
              role: 'model',
              parts: this.fcallParts
            });
            messages.push({
              role: 'model',
              parts: fcRespParts
            });

            options.onFinish({
              id: json.metadata.messageId,
              content: this.answer,
              reasoning_content: this.reasoning_content,
              inputTokens: this.inputTokens,
              outputTokens: this.outputTokens,
              totalTokens: this.totalTokens,
              mcpTools: this.mcpTools,
            }, true);
            syncMcpTools(json.metadata.messageId, this.mcpTools);

            this.mcpTools = [];
            this.finishReason = '';
            this.fcallParts = [];
            if (!this.controller) {
              this.controller = new AbortController();
            }
            try {
              await fetchEventSource('/api/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Provider': 'gemini',
                  'X-Model': options.config.model,
                  'X-Chat-Id': options.chatId!,
                },
                body: JSON.stringify({
                  "contents": messages,
                  ...toolsParameter,
                }),
                signal: this.controller.signal,
                onopen: async (res) => {
                  clearTimeout(timeoutId);
                  this.finished = false;
                  if (
                    !res.ok ||
                    !res.headers.get("content-type")?.startsWith(EventStreamContentType) ||
                    res.status !== 200
                  ) {

                    let resTextRaw = '';
                    try {
                      const resTextJson = await res.clone().json();
                      resTextRaw = prettyObject(resTextJson);
                    } catch {
                      resTextRaw = await res.clone().text();
                    }
                    const responseTexts = [resTextRaw];
                    if (res.status >= 400 && res.status < 500) {
                      options.onError?.(new InvalidAPIKeyError('Invalid API Key'));
                    } else {
                      this.answer = responseTexts.join("\n\n");
                      options.onError?.(new Error(this.answer));
                    }
                    clear();
                  }
                },
                onmessage: processOnMessage,
                onclose: () => {
                  clear();
                },
                onerror: (err) => {
                  this.controller = null;
                  this.finished = true;
                  this.answer = '';
                  // 需要 throw，不然框架会自动重试
                  throw err;
                },
                openWhenHidden: true,
              });
            } catch (error) {
              if (error instanceof Error) {
                options.onError?.(new InvalidAPIKeyError('Invalid API Key'));
              } else {
                options.onError?.(new Error('An unknown error occurred'));
              }
              clear();
            } finally {
              clearTimeout(timeoutId);
            }
            return;
          } else {
            options.onFinish({
              content: this.answer,
              inputTokens: this.inputTokens,
              outputTokens: this.outputTokens,
              totalTokens: this.totalTokens,
            }, false);
            clear();
            return;
          }
        }
        //tool 调用 end

        const firstCandidate = json?.candidates[0];
        if (firstCandidate.content.parts) {
          const deltaContent = firstCandidate.content.parts[0]?.text;
          if (deltaContent) {
            this.answer += deltaContent;
            options.onUpdate({ content: this.answer });
          }

          const fcallParts: FunctionCallPart[] = firstCandidate.content.parts
            .filter((part: any) => 'functionCall' in part);
          this.fcallParts.push(...fcallParts);
        }
        const usage = json?.usageMetadata;
        if (firstCandidate.finishReason && usage) {
          this.inputTokens = usage.promptTokenCount;
          this.outputTokens = usage.candidatesTokenCount;
          this.totalTokens = usage.totalTokenCount;
        }
        if (firstCandidate.finishReason) {
          this.finishReason = firstCandidate.finishReason;
          return;
        }
      } catch (e) {
        console.error("[Request] parse error", text);
      }
    }

    const messages = this.prepareMessage(options.messages);

    let toolsParameter = {};
    if (options.mcpTools) {
      const tools = mcpToolsToGeminiTools(options.mcpTools);
      if (tools.length > 0) {
        toolsParameter = {
          tools: tools
        }
      }
    }
    try {
      await fetchEventSource('/api/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Provider': 'gemini',
          'X-Model': options.config.model,
          'X-Chat-Id': options.chatId!,
        },
        body: JSON.stringify({
          "contents": messages,
          ...toolsParameter,
        }),
        signal: this.controller.signal,
        onopen: async (res) => {
          clearTimeout(timeoutId);
          this.finished = false;
          if (
            !res.ok ||
            !res.headers.get("content-type")?.startsWith(EventStreamContentType) ||
            res.status !== 200
          ) {

            let resTextRaw = '';
            try {
              const resTextJson = await res.clone().json();
              resTextRaw = prettyObject(resTextJson);
            } catch {
              resTextRaw = await res.clone().text();
            }
            const responseTexts = [resTextRaw];
            if (res.status === 429) {
              options.onError?.(new OverQuotaError('Over Quota'));
            } else if (res.status >= 400 && res.status < 500) {
              options.onError?.(new InvalidAPIKeyError('Invalid API Key'));
            } else {
              this.answer = responseTexts.join("\n\n");
              options.onError?.(new Error(this.answer));
            }
            clear();
          }
        },
        onmessage: processOnMessage,
        onclose: () => {
          clear();
        },
        onerror: (err) => {
          this.controller = null;
          this.finished = true;
          this.answer = '';
          // 需要 throw，不然框架会自动重试
          throw err;
        },
        openWhenHidden: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        options.onError?.(new InvalidAPIKeyError('Invalid API Key'));
      } else {
        options.onError?.(new Error('An unknown error occurred'));
      }
      clear();
    } finally {
      clearTimeout(timeoutId);
    }
  }
  stopChat = (callback: (responseContent: ResponseContent) => void) => {
    this.finished = true;
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    callback({
      content: this.answer,
      reasoning_content: this.reasoning_content
    });
    this.answer = '';
  }

  // 实现一个 check() 方法，用来检查 api 是否可用，如果不可用，返回详细的错误信息
  async check(modelId: string, apikey: string, apiUrl: string): Promise<{ status: 'success' | 'error', message?: string }> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Provider': 'gemini',
      'X-Apikey': `${apikey}`,
      'X-Model': modelId
    };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch('/api/completions', {
        signal: controller.signal,
        method: 'POST',
        headers,
        body: JSON.stringify({
          "contents": [{
            "role": "user",
            "parts": [{ 'text': "ping" }]
          }],
        }),
      });
      if (!res.ok) {
        let resTextRaw = '';
        try {
          const resTextJson = await res.clone().json();
          resTextRaw = prettyObject(resTextJson);
        } catch {
          resTextRaw = await res.clone().text();
        }
        return {
          status: 'error',
          message: resTextRaw,
        }
      } else {
        clearTimeout(timeoutId);
        return {
          status: 'success'
        }
      }
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return {
          status: 'error',
          message: '网络连接超时',
        }
      }
      return {
        status: 'error',
        message: (error as Error)?.message || 'Unknown error occurred',
      }
    }
  }
  usage(): Promise<LLMUsage> {
    throw new Error('Method not implemented.');
  }

  models(): Promise<LLMModel[]> {
    throw new Error('Method not implemented.');
  }

}
