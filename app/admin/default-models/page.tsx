'use client';
import React, { useEffect } from 'react';
import useModelListStore from '@/app/store/modelList';
import { fetchAvailableLlmModels } from '@/app/adapter/actions';
import ChatNaming from '@/app/components/admin/ChatNaming';
import DefaultChatModel from '@/app/components/admin/DefaultChatModel';
import { useTranslations } from 'next-intl';

const Userpage = () => {
  const t = useTranslations('Admin.System');
  const { initModelList } = useModelListStore();
  useEffect(() => {
    const initializeModelList = async () => {
      try {
        const remoteModelList = await fetchAvailableLlmModels(false);
        initModelList(remoteModelList);
      } catch (error) {
        console.error("Error fetching model list:", error);
      }
    };
    initializeModelList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className='container max-w-3xl mb-6 px-4 md:px-0 pt-4 pb-8 h-auto'>
      <div className='h-4 w-full mb-10'>
        <h2 className="text-xl font-bold mb-4 mt-6">默认模型</h2>
      </div>
      <DefaultChatModel />
      <ChatNaming />
      <div className='h-6'></div>
    </div>
  )
}

export default Userpage