'use client';
import React, { useEffect, useState } from 'react';
import { Card } from 'antd';
import useSvgPreviewSidebarStore from '@/app/store/svgPreviewSidebar';
import clsx from 'clsx';

interface SvgFileCardProps {
  svgContent: string;
  cardId: string;
}

const SvgFileCard: React.FC<SvgFileCardProps> = ({ svgContent, cardId }) => {
  const {
    setIsOpen,
    setSvgContent,
    setActiveTab,
    activeCardId,
    setActiveCardId
  } = useSvgPreviewSidebarStore();
  const [cleanedSvgContent, setCleanedSvgContent] = useState(svgContent);
  const isActive = activeCardId === cardId;

  // 清理 SVG 内容，确保它是有效的 SVG
  useEffect(() => {
    // 如果 SVG 内容包含在 HTML 标签中，提取出来
    let cleaned = svgContent;

    // 移除可能的 HTML 标签包装
    const svgRegex = /(<svg[\s\S]*?<\/svg>)/;
    const match = svgRegex.exec(cleaned);
    if (match) {
      cleaned = match[1];
    }

    setCleanedSvgContent(cleaned);
  }, [svgContent]);

  const handlePreviewClick = () => {
    setSvgContent(cleanedSvgContent);
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
              <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M4 12s1.5 1 4 1 5-2 8-2 4 1 4 1"></path>
              <path d="M4 18s1.5 1 4 1 5-2 8-2 4 1 4 1"></path>
              <line x1="4" y1="15" x2="4" y2="15"></line>
            </svg>
          </div>
          <div>
            <div className="font-medium">SVG 图像</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SvgFileCard;
