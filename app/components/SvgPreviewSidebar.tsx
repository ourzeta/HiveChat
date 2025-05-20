'use client';
import React, { useEffect, useState } from 'react';
import { Segmented, Button } from 'antd';
import { CloseOutlined, CodeOutlined, EyeOutlined } from '@ant-design/icons';
import useSvgPreviewSidebarStore from '@/app/store/svgPreviewSidebar';
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

  return (
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
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={handleClose}
            aria-label="关闭预览"
          />
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
              <pre className="p-4 bg-gray-50 rounded-md text-sm">
                <code>{svgContent}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SvgPreviewSidebar;
