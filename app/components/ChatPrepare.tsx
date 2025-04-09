'use client';
import React, { useEffect } from 'react'
import useMcpServerStore from '@/app/store/mcp';
import useGlobalConfigStore from '@/app/store/globalConfig';
import { fetchSettingsByKeys, getMcpServersAndAvailableTools } from '@/app/chat/actions/chat';
import useModelListStore from '@/app/store/modelList';
import { fetchAvailableLlmModels, fetchAllProviders } from '@/app/admin/llm/actions';

const AppPrepare = () => {
  const { setHasUseMcp, setMcpServers, setAllTools } = useMcpServerStore();
  const { setChatNamingModel, setSearchEnable } = useGlobalConfigStore();
  useEffect(() => {
    const initializeMcpInfo = async () => {
      const { mcpServers, tools } = await getMcpServersAndAvailableTools();
      if (mcpServers.length > 0) {
        setHasUseMcp(true);
        setMcpServers(mcpServers.map(server => ({
          ...server,
          description: server.description ?? undefined,
        })));
        setAllTools(tools.map(tool => ({
          id: tool.name,
          name: tool.name,
          serverName: tool.serverName,
          description: tool.description || undefined,
          inputSchema: JSON.parse(tool.inputSchema),
        })))
      } else {
        setHasUseMcp(false);
        setMcpServers([]);
        setAllTools([]);
      }
    }
    initializeMcpInfo();
  }, [setHasUseMcp, setMcpServers, setAllTools]);

  const { initModelList, setCurrentModel, setIsPending, initAllProviderList } = useModelListStore();
  useEffect(() => {
    const initializeModelList = async () => {
      try {
        const remoteModelList: any = await fetchAvailableLlmModels();
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
  
  useEffect(() => {
    const initializeAppSettings = async () => {
      const results = await fetchSettingsByKeys(['chatNamingModel', 'searchEnable']);
      if (results.chatNamingModel) {
        setChatNamingModel(results.chatNamingModel)
      } else {
        setChatNamingModel('current')
      }
      if (results.searchEnable) {
        setSearchEnable(results.searchEnable === 'true')
      }
    }
    initializeAppSettings();
  }, [setChatNamingModel, setSearchEnable]);
  return (
    <></>
  )
}

export default AppPrepare