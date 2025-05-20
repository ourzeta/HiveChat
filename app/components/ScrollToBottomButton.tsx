'use client'
import React from 'react';
import { Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import useSvgPreviewSidebarStore from '@/app/store/svgPreviewSidebar';
import useHtmlPreviewSidebarStore from '@/app/store/htmlPreviewSidebar';

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ visible, onClick }) => {
  const { isOpen: isSvgSidebarOpen } = useSvgPreviewSidebarStore();
  const { isOpen: isHtmlSidebarOpen } = useHtmlPreviewSidebarStore();

  // 检查是否有任何侧边栏打开
  const isSidebarOpen = isSvgSidebarOpen || isHtmlSidebarOpen;

  if (!visible) return null;

  return (
    <Button
      shape="circle"
      icon={<DownOutlined />}
      onClick={onClick}
      style={{
        position: 'absolute',
        bottom: '150px',
        zIndex: '100',
        boxShadow: 'rgb(173 164 164 / 21%) 1px 1px 3px 3px',
        left: isSidebarOpen ? 'calc(25% - 18px)' : '50%',
        transform: 'translateX(-50%)'
      }}
    />
  );
};

export default ScrollToBottomButton;