'use client';
import React, { useEffect } from 'react'
import useModelListStore from '@/app/store/modelList';
import useGlobalConfigStore from '@/app/store/globalConfig';
import { fetchAppSettings } from '@/app/admin/system/actions';
import { fetchAvailableLlmModels, fetchAllProviders } from '@/app/adapter/actions';

const AppPrepare = () => {
  const { initModelList, setCurrentModel, setIsPending, initAllProviderList } = useModelListStore();
  const { setChatNamingModel } = useGlobalConfigStore();

  useEffect(() => {
    const initializeModelList = async () => {
      try {
        const remoteModelList = await fetchAvailableLlmModels();
        const modelNames = remoteModelList.map(model => model.name);
        await initModelList(remoteModelList);
        const allProviderSettings = await fetchAllProviders();
        const processedList = allProviderSettings.map(item => ({
          id: item.provider,
          providerName: item.providerName,
          providerLogo: item.logo || '',
          status: item.isActive || false,
        }));
        initAllProviderList(processedList)
        const lastSelectedModel = localStorage.getItem('lastSelectedModel');
        if (lastSelectedModel && modelNames.includes(lastSelectedModel)) {
          setCurrentModel(lastSelectedModel);
        }
        else {
          if (remoteModelList.length > 0) {
            setCurrentModel(remoteModelList[0].name);
          }
        }
        setIsPending(false);
      } catch (error) {
        console.error('Error initializing model list:', error);
      }
    };

    initializeModelList();
  }, [initModelList, setCurrentModel, setIsPending, initAllProviderList]);

  useEffect(() => {
    const initializeAppSettings = async () => {
      const result = await fetchAppSettings('chatNamingModel');
      if (result) {
        setChatNamingModel(result)
      } else {
        setChatNamingModel('current')
      }
    }
    initializeAppSettings();
  }, [setChatNamingModel]);
  return (
    <></>
  )
}

export default AppPrepare