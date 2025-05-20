'use client';
import React, { useEffect, useState } from 'react';
import { Segmented, Button, message } from 'antd';
import { CloseOutlined, CodeOutlined, EyeOutlined, DownloadOutlined, CopyOutlined } from '@ant-design/icons';
import useSvgPreviewSidebarStore from '@/app/store/svgPreviewSidebar';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import clsx from 'clsx';

const SvgPreviewSidebar: React.FC = () => {
  const {
    isOpen,
    svgContent,
    activeTab,
    setIsOpen,
    setActiveTab,
    resetActiveCard
  } = useSvgPreviewSidebarStore();
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    // 当 svgContent 变化时，更新渲染的 SVG
    if (svgContent) {
      setRenderedSvg(svgContent);
    }
  }, [svgContent]);

  const handleClose = () => {
    setIsOpen(false);
    resetActiveCard(); // 关闭侧边栏时清除高亮状态
  };

  const handleDownload = () => {
    if (!svgContent) return;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'download.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    messageApi.success('SVG 已下载');
  };

  const handleCopy = async () => {
    if (!svgContent) return;
    
    try {
      await navigator.clipboard.writeText(svgContent);
      messageApi.success('SVG 代码已复制到剪贴板');
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
                aria-label="下载 SVG"
              >下载</Button>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopy}
                aria-label="复制 SVG 代码"
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
                {renderedSvg && (
                  <div
                    className="w-full h-full flex justify-center items-center p-4"
                    dangerouslySetInnerHTML={{ __html: renderedSvg }}
                  />
                )}
              </div>
            ) : (
              <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="p-4">
                  <SyntaxHighlighter 
                    language="xml" 
                    style={tomorrow} 
                    customStyle={{ backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}
                    showLineNumbers={true}
                  >
                    {svgContent || ''}
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

export default SvgPreviewSidebar;
