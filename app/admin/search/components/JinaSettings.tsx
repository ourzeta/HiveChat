import React from 'react';
import { Button, Input } from 'antd';
import Link from 'next/link';
import Image from "next/image";

interface JinaSettingsProps {
  apiKey: string | null;
  onApiKeyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApiKeyBlur: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const JinaSettings: React.FC<JinaSettingsProps> = ({
  apiKey,
  onApiKeyChange,
  onApiKeyBlur,
}) => {
  return (
    <div className='flex flex-col items-start mt-6 p-6 border border-gray-200 rounded-md'>
      <div className='flex flex-row text-base font-medium border-b items-center w-full mb-4 pb-2'>
        <Image src='/images/jina.png' height={20} width={20} style={{ width: '20px', height: '20px' }} alt='Jina' />
        <h3 className='ml-2'>Jina</h3>
      </div>
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
      <Link href="https://jina.ai/" target='_blank'>
        <Button type='link' size='small' style={{ padding: 0 }}>获取密钥</Button>
      </Link>
    </div>
  );
};

export default JinaSettings; 