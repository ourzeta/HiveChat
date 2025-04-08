import React from 'react';
import { Button, Input } from 'antd';
import Link from 'next/link';
import Image from "next/image";

interface TavilySettingsProps {
  apiKey: string | null;
  onApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApiKeyBlur: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TavilySettings: React.FC<TavilySettingsProps> = ({
  apiKey,
  onApiKeyChange,
  onApiKeyBlur,
}) => {
  return (
    <div className='flex flex-col items-start mt-6 p-6 border border-gray-200 rounded-md'>
      <h3 className='text-base font-medium border-b w-full mb-4 pb-2'>
        <Image src='/images/tavily.svg' height={32} width={64} alt='Tavily' />
      </h3>
      <span className='text-sm font-medium'>API 密钥</span>
      <div className='flex items-center my-2 w-full'>
        <Input
          name='apikey'
          value={apiKey || ''}
          onChange={onApiKeyChange}
          onBlur={onApiKeyBlur}
          placeholder="请输入 API 密钥"
        />
        <Button className='ml-2'>检查</Button>
      </div>
      <Link href="https://app.tavily.com/home" target='_blank'>
        <Button type='link' size='small' style={{ padding: 0 }}>获取密钥</Button>
      </Link>
    </div>
  );
};

export default TavilySettings; 