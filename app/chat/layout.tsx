'use client';
import React, { useEffect } from 'react'
import App from "@/app/components/App";
import useModelListStore from '@/app/store/modelList';
import useMcpServerStore from '@/app/store/mcp';
import { getMcpServersAndAvailableTools } from '@/app/chat/actions/chat';
import { fetchAvailableLlmModels, fetchAllProviders } from '@/app/adapter/actions';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { initModelList, setCurrentModel, setIsPending, initAllProviderList } = useModelListStore();
  const { setHasUseMcp, setMcpServers, setAllTools } = useMcpServerStore();
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
  return (
    <div className="flex flex-col h-dvh">
      <App>{children}</App>
    </div>
  )
}