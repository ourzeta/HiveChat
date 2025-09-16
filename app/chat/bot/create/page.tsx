'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import { LeftOutlined } from '@ant-design/icons';
import { addBotInServer } from '@/app/chat/actions/bot';
import { useTranslations } from 'next-intl';
import BotForm, { BotFormValues } from '@/app/components/BotForm';

const CreateBot = () => {
  const t = useTranslations('Chat');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: BotFormValues) => {
    setIsPending(true);
    try {
      const result = await addBotInServer({
        title: values.title,
        avatar: values.avatar,
        desc: values.desc,
        prompt: values.prompt,
        avatarType: values.avatarType,
      });
      
      if (result.status === 'success') {
        router.push(`/chat/bot/${result.data?.id}`);
      } else {
        throw new Error('创建失败');
      }
    } catch (error) {
      console.error('Create bot error:', error);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto items-center flex flex-col p-4">
      <div className='w-full'>
        <Link href='/chat/bot/discover'>
          <Button type='link' size='small' icon={<LeftOutlined />}>{t('back')}</Button>
        </Link>
      </div>

      <BotForm
        mode="create"
        onSubmit={handleSubmit}
        loading={isPending}
      />
    </div>
  );
};

export default CreateBot;