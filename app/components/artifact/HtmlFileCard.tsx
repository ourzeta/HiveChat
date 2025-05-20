'use client';
import React, { useEffect, useState } from 'react';
import { Card } from 'antd';
import useHtmlPreviewSidebarStore from '@/app/store/htmlPreviewSidebar';
import clsx from 'clsx';

interface HtmlFileCardProps {
  htmlContent: string;
  cardId: string;
}

const HtmlFileCard: React.FC<HtmlFileCardProps> = ({ htmlContent, cardId }) => {
  const {
    setIsOpen,
    setHtmlContent,
    setActiveTab,
    activeCardId,
    setActiveCardId
  } = useHtmlPreviewSidebarStore();
  const [cleanedHtmlContent, setCleanedHtmlContent] = useState(htmlContent);
  const isActive = activeCardId === cardId;

  // 清理 HTML 内容
  useEffect(() => {
    // 确保 HTML 内容是有效的
    let cleaned = htmlContent;
    setCleanedHtmlContent(cleaned);
  }, [htmlContent]);

  const handlePreviewClick = () => {
    setHtmlContent(cleanedHtmlContent);
    setActiveTab('preview');
    setIsOpen(true);
    setActiveCardId(cardId);
  };

  return (
    <Card
      className={clsx(
        "my-4 border",
        isActive
          ? "!border-blue-300"
          : "border-gray-200 hover:border-blue-300"
      )}
      styles={{ body: { padding: '12px' } }}
    >
      <div className="flex items-center justify-between cursor-pointer pointer-events-auto" onClick={handlePreviewClick}>
        <div className="flex items-center">
          <div className={clsx(
            "w-8 h-8 rounded-md flex items-center justify-center mr-3 transition-colors",
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          </div>
          <div>
            <div className="font-medium">HTML 代码</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default HtmlFileCard;
