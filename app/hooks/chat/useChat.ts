import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Message, ResponseContent, ChatOptions, LLMApi, RequestMessage, MessageContent, MCPTool } from '@/types/llm';
import useChatStore from '@/app/store/chat';
import useChatListStore from '@/app/store/chatList';
import useMcpServerStore from '@/app/store/mcp';
import { generateTitle, getLLMInstance } from '@/app/utils';
import useModelListStore from '@/app/store/modelList';
import { getChatInfoInServer } from '@/app/chat/actions/chat';
import { addMessageInServer, getMessagesInServer, deleteMessageInServer, clearMessageInServer, updateMessageWebSearchInServer } from '@/app/chat/actions/message';
import useGlobalConfigStore from '@/app/store/globalConfig';
import { localDb } from '@/app/db/localDb';
import { getSearchResult } from '@/app/chat/actions/chat';
import { searchResultType, WebSearchResponse } from '@/types/search';
import { REFERENCE_PROMPT } from '@/app/config/prompts';
import useRouteState from '@/app/hooks/chat/useRouteState';
import { useRouter } from 'next/navigation'

const useChat = (chatId: string) => {
  const { currentModel, setCurrentModelExact } = useModelListStore();
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [responseStatus, setResponseStatus] = useState<"done" | "pending">("done");
  const [searchStatus, setSearchStatus] = useState<searchResultType>("none");
  const [chatBot, setChatBot] = useState<LLMApi | null>(null);
  const [responseMessage, setResponseMessage] = useState<ResponseContent>({ content: '', reasoningContent: '' });
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [input, setInput] = useState('');
  const [userSendCount, setUserSendCount] = useState(0);
  const { chat, initializeChat, setWebSearchEnabled, webSearchEnabled, historyType, historyCount } = useChatStore();
  const { setNewTitle } = useChatListStore();
  const { chatNamingModel } = useGlobalConfigStore();
  const { selectedTools } = useMcpServerStore();
  const isFromHome = useRouteState();
  const router = useRouter();

  useEffect(() => {
    const llmApi = getLLMInstance(currentModel.provider.id);
    setChatBot(llmApi);

    return () => {
      // 清理 chatBot
      if (llmApi) {
        llmApi.stopChat?.(() => { });
        setChatBot(null);
      }
    };
  }, [currentModel]);


  const handleInputChange = (e: any) => {
    setInput(e.target.value);
  };

  const chatNamingModelStable = useMemo(() => chatNamingModel, [chatNamingModel]);
  const shouldSetNewTitle = useCallback((messages: RequestMessage[]) => {
    if (userSendCount === 0 && !chat?.isWithBot) {
      if (chatNamingModelStable !== 'none') {
        let renameModel = currentModel.id;
        let renameProvider = currentModel.provider.id;
        if (chatNamingModelStable !== 'current') {
          const [providerId, modelId] = chatNamingModelStable.split('|');
          renameModel = modelId;
          renameProvider = providerId;
        }
        generateTitle(messages, renameModel, renameProvider, (message: string) => {
          setNewTitle(chatId, message);
        }, () => { })
      }
    }
  }, [
    chat,
    chatId,
    currentModel,
    userSendCount,
    chatNamingModelStable,
    setNewTitle,
  ]);

  const sendMessage = useCallback(async (
    messages: RequestMessage[],
    searchResultStatus?: searchResultType,
    searchResponse?: WebSearchResponse,
    mcpTools?: MCPTool[]
  ) => {
    setResponseStatus("pending");
    const options: ChatOptions = {
      messages: messages,
      config: { model: currentModel.id },
      chatId: chatId,
      mcpTools,
      onUpdate: (responseContent: ResponseContent) => {
        setResponseMessage(responseContent);
      },
      onFinish: async (responseContent: ResponseContent, shouldContinue?: boolean) => {
        const respMessage: Message = {
          id: responseContent.id,
          role: "assistant",
          chatId: chatId,
          content: responseContent.content,
          reasoninContent: responseContent.reasoningContent,
          searchStatus: searchResultStatus,
          inputTokens: responseContent.inputTokens,
          outputTokens: responseContent.outputTokens,
          totalTokens: responseContent.totalTokens,
          mcpTools: responseContent.mcpTools,
          providerId: currentModel.provider.id,
          model: currentModel.id,
          type: 'text',
          createdAt: new Date()
        };
        setMessageList(prevList => [...prevList, respMessage]);
        setSearchStatus('none');
        setResponseMessage({ content: '', reasoningContent: '', mcpTools: [] });
        if (!shouldContinue) {
          setResponseStatus("done");
        }
        // 将 searchResponse 同步到数据库的 message 表下， id= responseContent.id 的记录
        if (responseContent.id) {
          await updateMessageWebSearchInServer(
            responseContent.id,
            (searchResultStatus && searchResultStatus !== 'none') ? true : false,
            searchResultStatus || 'none',
            searchResponse);
        }
      },
      onError: async (error) => {
        const respMessage: Message = {
          role: "assistant",
          chatId: chatId,
          content: error?.message || '',
          searchEnabled: (searchResultStatus && searchResultStatus !== 'none') ? true : false,
          searchStatus: searchResultStatus,
          webSearch: searchResponse,
          providerId: currentModel.provider.id,
          model: currentModel.id,
          type: 'error',
          errorType: error?.name || 'unknown error',
          errorMessage: error?.message || '',
          createdAt: new Date()
        };
        setMessageList((m) => ([...m, respMessage]));
        setResponseStatus("done");
        setSearchStatus('none');
        setResponseMessage({ content: '', reasoningContent: '' });
      }
    }
    chatBot?.chat(options);
  }, [
    chatBot,
    chatId,
    currentModel,
  ]);

  const stopChat = () => {
    setResponseStatus("done");
    chatBot?.stopChat((responseContent: ResponseContent) => {
      if (responseContent.content || responseContent.reasoningContent) {
        const respMessage: Message = {
          role: "assistant",
          chatId: chatId,
          content: responseContent.content,
          searchStatus: searchStatus,
          mcpTools: responseContent.mcpTools,
          reasoninContent: responseContent.reasoningContent,
          inputTokens: responseContent.inputTokens,
          outputTokens: responseContent.outputTokens,
          totalTokens: responseContent.totalTokens,
          providerId: currentModel.provider.id,
          model: currentModel.id,
          type: 'text',
          createdAt: new Date()
        };
        setMessageList((m) => ([...m, respMessage]));
        addMessageInServer(respMessage);
      }
      setSearchStatus('none');
      setResponseMessage({ content: '', reasoningContent: '' });
    });
  }

  const deleteMessage = (index: number) => {
    deleteMessageInServer(messageList[index].id as number);
    setMessageList(messageList.filter((_, i) => i !== index));
  }

  const clearHistory = () => {
    clearMessageInServer(chatId).then(() => {
      setMessageList([])
    });
  }

  const addBreak = async () => {
    if (messageList.length > 0 && messageList.at(-1)?.type === 'break') {
      return;
    }
    const toAddMessage = {
      role: "system",
      chatId: chatId,
      content: '上下文已清除',
      providerId: currentModel.provider.id,
      model: currentModel.id,
      type: 'break' as 'break',
      createdAt: new Date()
    };
    addMessageInServer(toAddMessage);
    setMessageList((m) => ([...m, toAddMessage]));
  }

  const prepareMessage = useCallback((newMessage: RequestMessage): RequestMessage[] => {
    let messages: RequestMessage[] = [];
    let tmpMessages = [];

    const validMessageType = ['text', 'image'];
    const breakIndex = messageList.findLastIndex(item => item.type === 'break');

    if (breakIndex > -1) {
      tmpMessages = messageList.slice(breakIndex)
    } else {
      tmpMessages = messageList;
    }
    messages = tmpMessages.filter((item) => validMessageType.includes(item.type))
      .map(({ content, role }) => ({ content, role: role as 'assistant' | 'user' | 'system' }));

    if (historyType === 'all') {
      messages = messages;
    }
    if (historyType === 'none') {
      messages = [];
    }
    if (historyType === 'count') {
      if (historyCount > messages.length) {
        messages = messages;
      } else {
        messages = messages.slice(-historyCount);
      }
    }
    messages.push(newMessage);
    if (chat?.prompt) {
      messages.unshift({ role: 'system', content: chat?.prompt })
    }
    return messages;
  }, [
    chat,
    historyCount,
    historyType,
    messageList
  ]);

  const handleWebSearch = useCallback(async (message: MessageContent) => {
    let realSendMessage = message;
    let searchStatus: searchResultType = 'none';
    let searchResponse: WebSearchResponse | undefined;

    setSearchStatus("searching");
    const textContent = typeof message === 'string' ? message : '';
    if (textContent) {
      const searchResult = await getSearchResult(textContent);
      if (searchResult.status === 'success') {
        searchResponse = searchResult.data || undefined;
        const referenceContent = `\`\`\`json\n${JSON.stringify(searchResult, null, 2)}\n\`\`\``;
        realSendMessage = REFERENCE_PROMPT.replace('{question}', textContent).replace('{references}', referenceContent);
        setSearchStatus("done");
        searchStatus = 'done'
      } else {
        setSearchStatus("error");
        searchStatus = 'error';
      }
    }

    return {
      realSendMessage,
      searchStatus,
      searchResponse
    };
  }, [
    // webSearchEnabled
  ]);

  const handleSubmit = useCallback(async (message: MessageContent) => {
    if (responseStatus === 'pending') {
      return;
    }
    setResponseStatus("pending");
    setIsUserScrolling(false);

    const currentMessage = {
      role: "user",
      chatId: chatId,
      content: message,
      searchEnabled: webSearchEnabled,
      providerId: currentModel.provider.id,
      model: currentModel.id,
      type: 'text' as const,
      createdAt: new Date()
    };

    setInput('');
    setMessageList((m) => ([...m, currentMessage]));
    addMessageInServer(currentMessage);
    setUserSendCount(userSendCount + 1);

    let realSendMessage = message;
    let searchStatus: searchResultType = 'none';
    let searchResponse: WebSearchResponse | undefined = undefined;
    if (webSearchEnabled) {
      const result = await handleWebSearch(message);
      realSendMessage = result.realSendMessage;
      searchStatus = result.searchStatus;
      searchResponse = result.searchResponse;
    }
    const messages = prepareMessage({
      role: "user",
      content: realSendMessage,
    })
    sendMessage(messages, searchStatus, searchResponse, selectedTools);
  }, [
    chatId,
    responseStatus,
    currentModel,
    userSendCount,
    selectedTools,
    webSearchEnabled,
    prepareMessage,
    sendMessage,
    handleWebSearch,
  ]);

  const prepareMessageFromIndex = (index: number): RequestMessage[] => {
    let messages: RequestMessage[] = [];
    if (historyType === 'all') {
      messages = messageList
        .slice(0, index)
        .filter((item) => item.type !== 'error')
        .map(({ content, role }) => ({ content, role: role as 'assistant' | 'user' | 'system' }));
    }
    if (historyType === 'none') {
      // 从 index 向前寻找一天正常的用户发送的消息。
      const tmpMessage = messageList.slice(index, index + 1);
      if (tmpMessage[0]?.type === 'error') {
        messages = messageList
          .slice(index - 1, index)
          .map(({ content, role }) => ({ content, role: role as 'assistant' | 'user' | 'system' }));
      } else {
        messages = tmpMessage
          .map(({ content, role }) => ({ content, role: role as 'assistant' | 'user' | 'system' }));
      }
    }
    if (historyType === 'count') {
      if (historyCount > messageList.length) {
        messages = messageList
          .slice(0, index)
          .filter((item) => item.type !== 'error')
          .map(({ content, role }) => ({ content, role: role as 'assistant' | 'user' | 'system' }));
      } else {
        messages = messageList
          .slice(0, index)
          .filter((item) => item.type !== 'error')
          .slice(-historyCount)
          .map(({ content, role }) => ({ content, role: role as 'assistant' | 'user' | 'system' }));
      }
    }
    return messages;
  }
  const retryMessage = (index: number, addNew: boolean = true) => {
    if (addNew) {
      const message = messageList[index];
      handleSubmit(message.content);
    } else {
      // 单独处理重试的逻辑
      setResponseStatus("pending");
      setIsUserScrolling(false);
      setInput('');
      const messages: RequestMessage[] = prepareMessageFromIndex(index);
      sendMessage(messages);
      shouldSetNewTitle(messages)
    }
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        let messageList: Message[] = [];
        const result = await getMessagesInServer(chatId);
        if (result.status === 'success') {
          messageList = result.data as Message[]
        }
        setMessageList(messageList);
        let tmpUserSendCount = 0;
        messageList.forEach((item) => {
          if (item.role === "user") {
            tmpUserSendCount = tmpUserSendCount + 1;
          }
        });
        setUserSendCount(tmpUserSendCount);
      } catch (error) {
        console.error('Error fetching items from database:', error);
      }
    };

    const fetchLocalMessages = async () => {
      const localMessage = await localDb.messages.where({ 'chatId': chatId }).toArray();
      if (localMessage[0].searchEnabled) {
        setWebSearchEnabled(localMessage[0].searchEnabled);
      }
      setMessageList(localMessage);
      setUserSendCount(1);
      await localDb.messages.clear();
    };

    const fetchChatInfo = async () => {
      const { status, data } = await getChatInfoInServer(chatId);
      if (status === 'success') {
        initializeChat(data!);
        if (data?.defaultProvider && data?.defaultModel) {
          setCurrentModelExact(data.defaultProvider, data.defaultModel);
        }
      }
    };

    const initializeChatData = async () => {
      try {
        if (localStorage.getItem('f') === 'home') {
          fetchLocalMessages();
          localStorage.removeItem('f');
        } else {
          setIsPending(true);
          try {
            await Promise.all([
              fetchMessages(),
              fetchChatInfo()
            ]);
          } catch (error) {
            console.error('Error initializing chat data:', error);
          } finally {
            setIsPending(false);
          }
        }
      } catch (error) {
        console.error('Error in chat initialization:', error);
        setIsPending(false);
      }
    };

    initializeChatData();
  }, [chatId, setWebSearchEnabled, initializeChat, setCurrentModelExact]);

  const shouldSetNewTitleRef = useRef(shouldSetNewTitle);

  useEffect(() => {
    const handleHomeEntry = async () => {
      if (!isFromHome) return;

      try {
        let existMessages: Message[] = [];
        const result = await getMessagesInServer(chatId);
        if (result.status === 'success') {
          existMessages = result.data as Message[];
        }
        if (existMessages.length === 1 && existMessages[0]['role'] === 'user') {
          const _searchEnabled = existMessages[0].searchEnabled || false
          const question = existMessages[0]['content'];
          let realSendMessage = question;
          let searchStatus: searchResultType = 'none';
          let searchResponse: WebSearchResponse | undefined = undefined;
          if (_searchEnabled) {
            setResponseStatus('pending');
            const result = await handleWebSearch(question);
            realSendMessage = result.realSendMessage;
            searchStatus = result.searchStatus;
            searchResponse = result.searchResponse;
          }
          const messages = [{
            role: 'user' as const,
            content: realSendMessage
          }];
          await sendMessage(messages, searchStatus, searchResponse, selectedTools);
          shouldSetNewTitleRef.current([{
            role: 'user' as const,
            content: question
          }]);
          router.replace(`/chat/${chatId}`);
        }
      } catch (error) {
        console.error('Error handling home entry:', error);
      }
    };

    handleHomeEntry();
  }, [isFromHome, chatId, selectedTools, router, sendMessage, handleWebSearch]);

  return {
    input,
    chat,
    messageList,
    searchStatus,
    responseStatus,
    responseMessage,
    historyType,
    historyCount,
    isUserScrolling,
    currentModel,
    isPending,
    handleInputChange,
    handleSubmit,
    sendMessage,
    shouldSetNewTitle,
    deleteMessage,
    clearHistory,
    stopChat,
    retryMessage,
    addBreak,
    setIsUserScrolling,
  };
};

export default useChat;