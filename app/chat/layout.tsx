'use client';
import React, { useEffect } from 'react'
import App from "@/app/components/App";
import useModelListStore from '@/app/store/modelList';
import { fetchAvailableLlmModels, fetchAllProviders } from '@/app/adapter/actions';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { initModelList, setCurrentModel, setIsPending, initAllProviderList } = useModelListStore();
  useEffect(() => {
    const initializeModelList = async () => {
      try {
        const remoteModelList = await fetchAvailableLlmModels();
        initModelList(remoteModelList);
        const allProviderSettings = await fetchAllProviders();
        const processedList = allProviderSettings.map(item => ({
          id: item.provider,
          providerName: item.providerName,
          providerLogo: item.logo || '',
          status: item.isActive || false,
        }));
        initAllProviderList(processedList)
        setIsPending(false);
      } catch (error) {
        console.error('Error initializing model list:', error);
      }
    };

    initializeModelList();
  }, [initModelList, setCurrentModel, setIsPending, initAllProviderList]);
  return (
    <div className="flex flex-col h-dvh">
      <App>{children}</App>
    </div>
  )
}