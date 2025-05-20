'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Segmented, Button, message } from 'antd';
import { CloseOutlined, CodeOutlined, EyeOutlined, DownloadOutlined, CopyOutlined } from '@ant-design/icons';
import useHtmlPreviewSidebarStore from '@/app/store/htmlPreviewSidebar';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import clsx from 'clsx';

const HtmlPreviewSidebar: React.FC = () => {
  const {
    isOpen,
    htmlContent,
    activeTab,
    setIsOpen,
    setActiveTab,
    resetActiveCard
  } = useHtmlPreviewSidebarStore();
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [messageApi, contextHolder] = message.useMessage();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 添加自适应 iframe 高度的函数，使用 useCallback 避免不必要的重新创建
  const resizeIframeToContent = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    try {
      // 获取 iframe 内容的高度
      const doc = iframeRef.current.contentWindow.document;

      // 确保文档已经完全加载
      if (!doc || !doc.body) {
        // 如果文档还没准备好，延迟再试
        setTimeout(() => resizeIframeToContent(), 50);
        return;
      }
    } catch (e) {
      console.error('调整 iframe 高度失败:', e);
      // 出错时设置一个默认高度，确保用户至少能看到一些内容
      if (iframeRef.current) {
        iframeRef.current.style.height = '300px';
      }
    }
  }, []);

  useEffect(() => {
    // 当 htmlContent 变化时，更新渲染的 HTML
    if (htmlContent) {
      setRenderedHtml(htmlContent);

      // 当内容更新时，如果当前是预览模式且侧边栏打开，确保在下一个渲染周期后调整 iframe 大小
      if (activeTab === 'preview' && isOpen) {
        // 使用两层 setTimeout 确保 DOM 完全更新后再调整大小
        setTimeout(() => {
          setTimeout(resizeIframeToContent, 50);
        }, 0);
      }
    }
  }, [htmlContent, activeTab, isOpen, resizeIframeToContent]);

  // 监听窗口大小变化，重新调整 iframe 大小
  useEffect(() => {
    if (!isOpen || activeTab !== 'preview') return;

    const handleResize = () => {
      // 延迟执行以确保 DOM 已更新
      setTimeout(resizeIframeToContent, 100);
    };

    window.addEventListener('resize', handleResize);

    // 初始调整
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, activeTab, resizeIframeToContent]);

  // 当切换到预览标签时，调整 iframe 大小
  useEffect(() => {
    if (activeTab === 'preview' && isOpen) {
      // 延迟执行以确保 DOM 已更新
      setTimeout(resizeIframeToContent, 100);
    }
  }, [activeTab, isOpen, resizeIframeToContent]);

  // 监听 iframe 发送的消息，确保内容加载完成后调整大小
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data === 'iframe-loaded' && activeTab === 'preview' && isOpen) {
        // 确保在 iframe 内容完全加载后调整大小
        setTimeout(resizeIframeToContent, 50);
      }
    };

    window.addEventListener('message', handleIframeMessage);

    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [activeTab, isOpen, resizeIframeToContent]);

  const handleClose = () => {
    setIsOpen(false);
    resetActiveCard(); // 关闭侧边栏时清除高亮状态
  };

  const handleDownload = () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    messageApi.success('HTML 已下载');
  };

  const handleCopy = async () => {
    if (!htmlContent) return;

    try {
      await navigator.clipboard.writeText(htmlContent);
      messageApi.success('HTML 代码已复制到剪贴板');
    } catch (err) {
      messageApi.error('复制失败，请重试');
      console.error('复制失败:', err);
    }
  };

  return (
    <>
      {contextHolder}
      <div
        className={clsx(
          'fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-lg z-40',
          'transition-all duration-500 ease-in-out', // 增加过渡动画时间
          {
            'w-0 opacity-0 pointer-events-none translate-x-full': !isOpen, // 添加平移动画
            'opacity-100 translate-x-0': isOpen, // 设置为主内容区域的 40%
          }
        )}
        style={{
          // 计算宽度为主内容区域的 40%
          width: isOpen ? 'calc(40% - 18px)' : '0',
          // 固定在右侧
          right: '0',
        }}
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center p-2 border-b">
            <div className="flex-grow">
              <Segmented
                value={activeTab}
                onChange={(value) => setActiveTab(value as 'code' | 'preview')}
                options={[
                  {
                    value: 'preview',
                    icon: <EyeOutlined />,
                    label: <span>预览</span>
                  },
                  {
                    value: 'code',
                    icon: <CodeOutlined />,
                    label: <span>代码</span>
                  }
                ]}
              />
            </div>
            <div className="flex items-center space-x-1">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                aria-label="下载 HTML"
              >下载</Button>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                aria-label="复制 HTML 代码"
              >复制</Button>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClose}
                aria-label="关闭预览"
              />
            </div>
          </div>
          <div className="flex-grow overflow-hidden">
            {activeTab === 'preview' ? (
              <div className="flex justify-center items-center h-full p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {renderedHtml && (
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0"
                    title="HTML Preview"
                    sandbox="allow-same-origin allow-scripts"
                    srcDoc={renderedHtml}
                    onLoad={resizeIframeToContent}
                  />
                )}
              </div>
            ) : (
              <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-4">
                  <SyntaxHighlighter
                    language="html"
                    style={tomorrow}
                    customStyle={{ backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}
                    showLineNumbers={true}
                  >
                    {htmlContent || ''}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HtmlPreviewSidebar;
