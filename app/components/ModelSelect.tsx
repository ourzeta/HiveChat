'use client'
import React, { useMemo } from 'react'
import { Select, ConfigProvider } from "antd";
import { Avatar } from "antd";
import useModelListStore from '@/app/store/modelList';
import { updateChatInServer } from '@/app/chat/actions/chat';
import { useTranslations } from 'next-intl';

const ModelSelect = ({ chatId }: { chatId: string | null }) => {
  const { modelList, currentModel, allProviderListByKey, providerList, isPending, setCurrentModelExact } = useModelListStore();
  const t = useTranslations('Chat');

  const selectOptions = useMemo(() => {
    return providerList.map((provider) => ({
      label: <span>{provider.providerName}</span>,
      title: provider.providerName,
      options: modelList.filter((model) => model.provider.id === provider.id && model.selected).map((model) => ({
        key: `${model.provider.id}|${model.id}`, // 添加唯一 key 避免重复渲染
        label: (<div className='flex flex-row items-center w-fit'>
          {allProviderListByKey && allProviderListByKey[provider.id]?.providerLogo ?
            <Avatar
              size={20}
              src={allProviderListByKey[provider.id].providerLogo}
            />
            :
            <Avatar
              size={20}
              style={{ backgroundColor: '#1c78fa' }}
            >{allProviderListByKey && allProviderListByKey[provider.id].providerName.charAt(0)}</Avatar>
          }

          <span className='ml-1'>{model.displayName}</span>
        </div>),
        value: `${model.provider.id}|${model.id}`,
      }))
    }));
  }, [providerList, modelList, allProviderListByKey]);

  const handleChangeModel = (value: string) => {
    localStorage.setItem('lastSelectedModel', value);
    const [providerId, modelId] = value.split('|');
    setCurrentModelExact(providerId, modelId);
    // 修改当前对话的默认模型
    if (chatId) {
      updateChatInServer(chatId, { defaultProvider: providerId, defaultModel: modelId })
    }
  };

  if (isPending) {
    return (
      <div className='ml-2 flex flex-row items-center'>
        <span className='ml-2 text-sm text-gray-500'>Loading</span>
      </div>
    );
  }

  if (providerList.length === 0) {
    return (
      <div className='ml-2 flex flex-row items-center'>
        <Avatar
          size={20}
          src='/images/providers/openai.svg'
        />
        <span className='ml-2 text-sm text-gray-500'>{t('modelNotConfigured')}</span>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Select: {
            selectorBg: 'transparent',
            activeBorderColor: 'transparent',
            activeOutlineColor: 'transparent',
            hoverBorderColor: 'transparent',
            colorBorder: 'transparent',
            multipleSelectorBgDisabled: 'transparent',
          },
        },
      }}
    >
      <Select
        value={`${currentModel.provider.id}|${currentModel.id}`}
        style={{ border: 'none', backgroundColor: 'transparent' }}
        popupMatchSelectWidth={false}
        popupClassName="model-select-dropdown"
        onChange={handleChangeModel}
        listHeight={320}
        options={selectOptions}
      />
    </ConfigProvider>
  );
}

export default ModelSelect