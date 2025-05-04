'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Tooltip, Modal, Popover, Skeleton, message } from "antd";
import { PictureOutlined, ClearOutlined, FieldTimeOutlined, GlobalOutlined } from '@ant-design/icons';
import Eraser from '@/app/images/eraser.svg';
import NewChatIcon from '@/app/images/newChat.svg';
import McpIcon from "@/app/images/mcp.svg";
import { useRouter } from 'next/navigation';
import ChatHeader from '@/app/components/ChatHeader';
import ResponsingMessage from '@/app/components/ResponsingMessage';
import HistorySettings from '@/app/components/HistorySettings';
import McpServerSelect from '@/app/components/McpServerSelect';
import MessageItem from '@/app/components/MessageItem';
import MarkdownRender from '@/app/components/Markdown';
import useChat from '@/app/hooks/chat/useChat';
import useImageUpload from '@/app/hooks/chat/useImageUpload';
import useMcpServerStore from '@/app/store/mcp';
import useGlobalConfigStore from '@/app/store/globalConfig';
import { fileToBase64 } from '@/app/utils';
import { throttle } from 'lodash';
import useChatStore from '@/app/store/chat';
import ImagePreviewArea from '@/app/components/ImagePreviewArea';
import ScrollToBottomButton from '@/app/components/ScrollToBottomButton';
import { useTranslations } from 'next-intl';
import ChatInput from '@/app/components/ChatInput';

export const MessageList = (props: { chat_id: string }) => {
  const t = useTranslations('Chat');
  const [modal, contextHolder] = Modal.useModal();
  const messageListRef = useRef<HTMLDivElement>(null);
  const [historySettingOpen, SetHistorySettingOpen] = useState(false);
  const [mcpServerSelectOpen, SetMcpServerSelectOpen] = useState(false);
  const [stableShowScrollButton, setStableShowScrollButton] = useState(false);
  const {
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
    clearHistory,
    handleSubmit,
    deleteMessage,
    addBreak,
    retryMessage,
    stopChat,
    setIsUserScrolling,
  } = useChat(props.chat_id);

  const { hasUseMcp, hasMcpSelected, clearAllSelect } = useMcpServerStore();
  const { searchEnable: remoteSearchEnable } = useGlobalConfigStore();
  const { webSearchEnabled, setWebSearchEnabled } = useChatStore();
  const { uploadedImages, maxImages, handleImageUpload, removeImage, setUploadedImages } = useImageUpload();
  const router = useRouter();

  const handleHistorySettingOpenChange = (open: boolean) => {
    SetHistorySettingOpen(open);
  };

  const handleClearHistory = (): void => {
    modal.confirm({
      title: t('confirmClearHistoryMessage'),
      content: t('clearHistoryMessageNotice'),
      okText: t('confirm'),
      cancelText: t('cancel'),
      onOk() {
        clearHistory();
      },
      onCancel() { },
    });
  }

  useEffect(() => {
    if (!isUserScrolling) {
      const scrollToBottom = () => {
        if (messageListRef.current) {
          try {
            messageListRef.current.scrollTo({
              top: messageListRef.current.scrollHeight
            });
          } catch (error) {
            console.error('Scroll error:', error);
          }
        }
      };

      requestAnimationFrame(scrollToBottom);
    }
  }, [
    responseMessage.content,
    responseMessage.reasoningContent,
    responseMessage.mcpTools?.length,
    isUserScrolling,
    messageList.length
  ]);

  const handleScroll = useCallback(() => {
    const chatElement = messageListRef.current;
    if (!chatElement) return;

    try {
      const isNearBottom = chatElement.scrollHeight - chatElement.scrollTop <= chatElement.clientHeight + 20;
      setIsUserScrolling(!isNearBottom);
      if (responseStatus !== 'pending' || isUserScrolling) {
        setStableShowScrollButton(!isNearBottom && chatElement.scrollHeight > chatElement.clientHeight + 50);
      }
    } catch (error) {
      console.error('Scroll calculation error:', error);
    }
  }, [setIsUserScrolling, responseStatus, isUserScrolling]);

  const throttledHandleScroll = useMemo(
    () => throttle(handleScroll, 100, { leading: true, trailing: true }),
    [handleScroll]
  );
  useEffect(() => {
    return () => {
      throttledHandleScroll.cancel();
    };
  }, [throttledHandleScroll]);

  // 添加一个useEffect来初始化滚动按钮状态
  useEffect(() => {
    // 组件挂载后或消息列表变化时检查滚动状态
    const checkInitialScrollState = () => {
      const chatElement = messageListRef.current;
      if (!chatElement) return;
      try {
        setTimeout(() => {
          if (!messageListRef.current) return;
          const isNearBottom = chatElement.scrollHeight - chatElement.scrollTop <= chatElement.clientHeight + 20;
          // 当消息刚发送时，假设我们总是在底部，不显示按钮
          const shouldShowButton = !isNearBottom &&
            chatElement.scrollHeight > chatElement.clientHeight + 50 &&
            responseStatus !== 'pending';
          setStableShowScrollButton(shouldShowButton);
        }, 100);
      } catch (error) {
        console.error('Initial scroll check error:', error);
      }
    };
    requestAnimationFrame(checkInitialScrollState);
  }, [messageList, responseStatus]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromHome = urlParams.get('f') === 'home';
    if (!fromHome) {
      setWebSearchEnabled(false)
    }
  }, [props.chat_id, setWebSearchEnabled]);

  useEffect(() => {
    if (!currentModel.supportTool) {
      clearAllSelect();
    }
  }, [currentModel, clearAllSelect]);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // WebSearchButton component
  const WebSearchButton = () => {
    if (!remoteSearchEnable) return null;

    if (webSearchEnabled) {
      return (
        <Button
          type="text"
          size="small"
          className="mx-1"
          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          color="primary"
          variant="filled"
        >
          <GlobalOutlined style={{ width: '12px', height: '12px' }} />
          <span className="text-xs -ml-1">{t('webSearch')}</span>
        </Button>
      );
    } else {
      return (
        <Button
          type="text"
          size="small"
          className="mx-1"
          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
        >
          <GlobalOutlined style={{ color: 'gray', width: '12px', height: '12px' }} />
          <span className="text-xs -ml-1 text-gray-500">{t('webSearch')}</span>
        </Button>
      );
    }
  };

  const handleSubmitMessage = useCallback(async (message: string) => {
    let messageContent;
    if (uploadedImages.length > 0) {
      const imageMessages = await Promise.all(uploadedImages
        .filter(img => img.file)
        .map(async (img) => ({
          type: 'image' as const,
          mimeType: img.file!.type,
          data: await fileToBase64(img.file!)
        })));

      messageContent = [
        { type: 'text' as const, text: message },
        ...imageMessages
      ];
    } else {
      messageContent = message;
    }

    setTimeout(() => {
      if (messageListRef.current) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }
    }, 10);
    handleSubmit(messageContent).then(() => {
      setUploadedImages([]);
    });
  }, [uploadedImages, handleSubmit, setUploadedImages]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();

      const files = Array.from(e.clipboardData.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        if (!currentModel.supportVision) {
          message.warning(t('notSupportVision'));
          return;
        }
        if (uploadedImages.length + imageFiles.length > maxImages) {
          message.warning(t('maxImageCount', { maxImages: maxImages }));
          return;
        }

        for (const file of imageFiles) {
          const url = URL.createObjectURL(file);
          handleImageUpload(file, url);
        }
      }
    }
  };

  const handleClearMemory = () => {
    addBreak();
    setTimeout(() => {
      if (messageListRef.current) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }
    }, 10);
  };

  // 使用 useMemo 优化消息列表渲染
  const renderedMessageList = useMemo(() => {
    return messageList.map((item, index) => {
      let showLine = false;
      if (index < messageList.length - 1 && item.role === 'assistant' && messageList[index + 1]?.role === 'assistant') {
        showLine = true;
      }
      if (index === messageList.length - 1 && item.role === 'assistant' && responseStatus === 'pending') {
        showLine = true;
      }
      return (
        <MessageItem
          key={index}
          isConsecutive={showLine}
          role={item.role as 'assistant' | 'user' | 'system'}
          item={item}
          index={index}
          retryMessage={retryMessage}
          deleteMessage={deleteMessage}
        />
      );
    });
  }, [messageList, responseStatus, retryMessage, deleteMessage]);

  return (
    <>
      {contextHolder}
      <ChatHeader />
      <ScrollToBottomButton
        visible={stableShowScrollButton}
        onClick={scrollToBottom}
      />
      <div onScroll={throttledHandleScroll} ref={messageListRef} className='flex w-full flex-col h-0 px-2 grow py-6 relative overflow-y-auto leading-7 chat-list text-sm'>
        {!isPending && chat?.prompt && <div className="flex container mx-auto max-w-screen-md mb-4 w-full flex-col justify-center items-center">
          <div className='flex max-w-3xl text-justify w-full my-0 pt-0 pb-1 flex-col pr-4 pl-4'>
            <div className='flex flex-row items-center mb-2'>
              <span className='text-2xl leading-8'>✨</span>
              <span className='text-sm leading-8 ml-1 font-medium'>{t('prompt')}</span>
            </div>
            <div className='w-fit p-6 markdown-body !min-w-4 !bg-gray-100 text-base rounded-xl ml-10'>
              <MarkdownRender content={chat.prompt} />
            </div>
          </div>
        </div>}
        {isPending ?
          <div className="flex container px-4 mx-auto max-w-screen-md w-full flex-col justify-center items-center" >
            <div className='items-start mb-8 flex max-w-3xl w-full flex-row-reverse pl-4'>
              <div className='flex ml-10 flex-col mt-4 items-end'>
                <Skeleton active title={false} paragraph={{ rows: 2, width: 400 }} />
              </div>
            </div>
            <Skeleton avatar={{ size: 'default' }} active title={false} paragraph={{ rows: 4, width: ['60%', '60%', '100%', '100%'] }} />
          </div> :
          renderedMessageList
        }
        <ResponsingMessage
          searchStatus={searchStatus}
          responseStatus={responseStatus}
          responseMessage={responseMessage}
          currentProvider={currentModel.provider.id}
        />
        {responseStatus === 'done' && !isPending &&
          <div className='md:hidden flex justify-center items-center mt-2'>
            <div
              onClick={() => { router.push('/chat') }}
              className='flex flex-row px-3 py-2 items-center cursor-pointer justify-center border border-gray-300 text-gray-500 text-xs rounded-2xl hover:bg-gray-100 transition-colors duration-200'
            >
              <NewChatIcon />
              <span className='ml-1'>{t('startNewChat')}</span>
            </div>
          </div>
        }
      </div>
      <ImagePreviewArea
        uploadedImages={uploadedImages}
        removeImage={removeImage}
      />
      <div className="h-32 flex flex-col bg-white border-t justify-center items-center pt-0 p-4">
        <div className='flex flex-row justify-between h-10 max-w-3xl w-full relative p-2'>
          <div className='flex flex-row'>
            {currentModel.supportVision && (
              <Tooltip title={t('image')} placement='bottom' arrow={false}>
                <Button type="text" size='small' onClick={() => handleImageUpload()}>
                  <PictureOutlined style={{ color: 'gray' }} />
                  <span className='text-xs -ml-1 text-gray-500'>{t('image')}</span>
                </Button>
              </Tooltip>
            )}

            {!currentModel.supportVision && (
              <Tooltip title={t('unsupportImage')} placement='bottom' arrow={false}>
                <Button type="text" size='small' disabled>
                  <PictureOutlined style={{ color: '#ddd' }} />
                  <span className='text-xs -ml-1 text-gray-300'>{t('image')}</span>
                </Button>
              </Tooltip>
            )}

            <WebSearchButton />

            {hasUseMcp && currentModel.supportTool && (
              <Popover
                content={<McpServerSelect chat_id={props.chat_id} />}
                trigger="click"
                open={mcpServerSelectOpen}
                onOpenChange={(open) => { SetMcpServerSelectOpen(open) }}
              >
                <Tooltip title={t('mcpServer')} placement='bottom' arrow={false} >
                  {hasMcpSelected ? (
                    <Button type="text" size='small' color="primary" variant="filled">
                      <McpIcon style={{ width: '13px', height: '13px' }} />
                      <span className='text-xs -ml-1'>{t('mcpTool')}</span>
                    </Button>
                  ) : (
                    <Button type="text" size='small' >
                      <McpIcon style={{ width: '13px', height: '13px' }} />
                      <span className='text-xs -ml-1 text-gray-500'>{t('mcpTool')}</span>
                    </Button>
                  )}
                </Tooltip>
              </Popover>
            )}

            <Popover
              content={<HistorySettings chat_id={props.chat_id} changeVisible={handleHistorySettingOpenChange} />}
              title={t('historyMessageCount')}
              trigger="click"
              open={historySettingOpen}
              onOpenChange={handleHistorySettingOpenChange}
            >
              <Tooltip title={t('historyMessageCount')} placement='bottom' arrow={false}>
                <Button className='mx-1' type="text" size='small'>
                  <FieldTimeOutlined style={{ color: 'gray' }} />
                  <span className='text-xs -ml-1 text-gray-500'>
                    {historyType === 'all' && <>{t('historyMessageCountAllShot')}</>}
                    {historyType === 'none' && <>{t('historyMessageCountNone')}</>}
                    {historyType === 'count' && <>{historyCount} {t('piece')}</>}
                  </span>
                </Button>
              </Tooltip>
            </Popover>

            <Button type="text" size='small' onClick={handleClearMemory}>
              <Eraser alt="Eraser" width="15" height="15" />
              <span className='text-xs -ml-1 text-gray-500'>{t('clearMemory')}</span>
            </Button>
          </div>

          <div className='flex flex-row'>
            <Tooltip title={t('clearHistoryMessage')}>
              <Button onClick={handleClearHistory} className='ml-2' type="text" size='small'>
                <ClearOutlined style={{ color: 'gray' }} />
              </Button>
            </Tooltip>
          </div>
        </div>

        <ChatInput
          responseStatus={responseStatus}
          onPaste={handlePaste}
          onSubmit={handleSubmitMessage}
          onStop={stopChat}
        />
      </div>
    </>
  );
}
