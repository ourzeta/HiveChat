'use client'
import React from 'react';
import { useTranslations } from 'next-intl';
import MarkdownRender from '@/app/components/Markdown';

const PromptSection = React.memo(({ prompt }: { prompt: string }) => {
  const t = useTranslations('Chat');
  
  return (
    <div className="flex container mx-auto max-w-screen-md mb-4 w-full flex-col justify-center items-center">
      <div className='flex max-w-3xl text-justify w-full my-0 pt-0 pb-1 flex-col pr-4 pl-4'>
        <div className='flex flex-row items-center mb-2'>
          <span className='text-2xl leading-8'>✨</span>
          <span className='text-sm leading-8 ml-1 font-medium'>{t('prompt')}</span>
        </div>
        <div className='w-fit p-6 markdown-body !min-w-4 !bg-gray-100 text-base rounded-xl ml-10'>
          <MarkdownRender content={prompt} />
        </div>
      </div>
    </div>
  );
});

PromptSection.displayName = 'PromptSection';

export default PromptSection; 