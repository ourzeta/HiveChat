'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Segmented, Button, message } from 'antd';
import { CloseOutlined, CodeOutlined, EyeOutlined, DownloadOutlined, CopyOutlined } from '@ant-design/icons';
import usePreviewSidebarStore from '@/app/store/previewSidebar';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import clsx from 'clsx';

const PreviewSidebar: React.FC = () => {
  const {
    isOpen,
    content,
    contentType,
    activeTab,
    width,
    setIsOpen,
    setActiveTab,
    setWidth,
    resetActiveCard
  } = usePreviewSidebarStore();
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [messageApi, contextHolder] = message.useMessage();
  const [isDragging, setIsDragging] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragStartXRef = useRef<number>(0);
  const dragStartWidthRef = useRef<number>(0);

  // 添加自适应 iframe 高度的函数，使用 useCallback 避免不必要的重新创建
  const resizeIframeToContent = useCallback(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow || contentType !== 'html') return;

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
  }, [contentType]);

  useEffect(() => {
    // 当 content 变化时，更新渲染的内容
    if (content) {
      setRenderedContent(content);

      // 当内容更新时，如果当前是预览模式且侧边栏打开，确保在下一个渲染周期后调整 iframe 大小
      if (activeTab === 'preview' && isOpen && contentType === 'html') {
        // 使用两层 setTimeout 确保 DOM 完全更新后再调整大小
        setTimeout(() => {
          setTimeout(resizeIframeToContent, 50);
        }, 0);
      }
    }
  }, [content, activeTab, isOpen, contentType, resizeIframeToContent]);

  // 监听窗口大小变化，重新调整 iframe 大小
  useEffect(() => {
    if (!isOpen || activeTab !== 'preview' || contentType !== 'html') return;

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
  }, [isOpen, activeTab, contentType, resizeIframeToContent]);

  // 当切换到预览标签时，调整 iframe 大小
  useEffect(() => {
    if (activeTab === 'preview' && isOpen && contentType === 'html') {
      // 延迟执行以确保 DOM 已更新
      setTimeout(resizeIframeToContent, 100);
    }
  }, [activeTab, isOpen, contentType, resizeIframeToContent]);

  // 监听 iframe 发送的消息，确保内容加载完成后调整大小
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data === 'iframe-loaded' && activeTab === 'preview' && isOpen && contentType === 'html') {
        // 确保在 iframe 内容完全加载后调整大小
        setTimeout(resizeIframeToContent, 50);
      }
    };

    window.addEventListener('message', handleIframeMessage);

    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [activeTab, isOpen, contentType, resizeIframeToContent]);

  const handleClose = () => {
    setIsOpen(false);
    resetActiveCard(); // 关闭侧边栏时清除高亮状态
  };

  const handleDownload = () => {
    if (!content) return;
    
    const fileType = contentType === 'svg' ? 'image/svg+xml' : 'text/html';
    const fileExt = contentType === 'svg' ? 'svg' : 'html';
    
    const blob = new Blob([content], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `download.${fileExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    messageApi.success(`${contentType?.toUpperCase()} 已下载`);
  };

  const handleCopy = async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      messageApi.success(`${contentType?.toUpperCase()} 代码已复制到剪贴板`);
    } catch (err) {
      messageApi.error('复制失败，请重试');
      console.error('复制失败:', err);
    }
  };

  // 拖拽处理函数
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = width;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = dragStartXRef.current - e.clientX; // 向左拖拽为正值
      const newWidth = dragStartWidthRef.current + deltaX;
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      // 移除全局事件监听器
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 恢复默认样式
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    
    // 添加全局鼠标事件监听器
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 防止文本选择
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [width, setWidth]);

  // 根据内容类型确定语言
  const getLanguage = () => {
    return contentType === 'svg' ? 'xml' : 'html';
  };

  return (
    <>
      {contextHolder}
      <div
        className={clsx(
          'fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-lg z-40 flex',
          {
            'opacity-0 pointer-events-none translate-x-full': !isOpen,
            'opacity-100 translate-x-0': isOpen,
          }
        )}
        style={{
          width: isOpen ? `${width}px` : '0',
          transition: isDragging ? 'none' : 'all 0.3s ease-in-out',
        }}
      >
        {/* 拖拽手柄 */}
        {isOpen && (
          <div
            className={clsx(
              'absolute left-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors duration-200',
              'flex items-center justify-center group',
              {
                'bg-blue-500': isDragging,
              }
            )}
            onMouseDown={handleMouseDown}
            style={{ left: '-2px' }}
          >
            <div className="w-0.5 h-8 bg-gray-400 group-hover:bg-white transition-colors duration-200" />
          </div>
        )}
        <div className="h-full flex flex-col flex-1">
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
                aria-label={`下载 ${contentType?.toUpperCase()}`}
              >下载</Button>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                aria-label={`复制 ${contentType?.toUpperCase()} 代码`}
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
                {renderedContent && contentType === 'svg' && (
                  <div
                    className="w-full h-full flex justify-center items-center p-4"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                  />
                )}
                {renderedContent && contentType === 'html' && (
                  <iframe
                    ref={iframeRef}
                    className="w-full h-full border-0"
                    title="HTML Preview"
                    sandbox="allow-same-origin allow-scripts"
                    srcDoc={renderedContent}
                    onLoad={resizeIframeToContent}
                  />
                )}
              </div>
            ) : (
              <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-4">
                  <SyntaxHighlighter 
                    language={getLanguage()} 
                    style={tomorrow} 
                    customStyle={{ backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}
                    showLineNumbers={true}
                  >
                    {content || ''}
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

export default PreviewSidebar;
