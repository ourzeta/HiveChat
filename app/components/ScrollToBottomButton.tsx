'use client'
import React from 'react';
import { Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import usePreviewSidebarStore from '@/app/store/previewSidebar';

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ visible, onClick }) => {
  const { isOpen } = usePreviewSidebarStore();

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
        left: isOpen ? 'calc(25% - 18px)' : '50%',
        transform: 'translateX(-50%)'
      }}
    />
  );
};

export default ScrollToBottomButton;