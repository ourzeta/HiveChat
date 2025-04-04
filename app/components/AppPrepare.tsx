'use client';
import React, { useEffect } from 'react'
import useGlobalConfigStore from '@/app/store/globalConfig';
import { fetchAppSettings } from '@/app/admin/system/actions';
import useMcpServerStore from '@/app/store/mcp';
import { getMcpServersAndAvailableTools } from '@/app/chat/actions/chat';

const AppPrepare = () => {
  const { setChatNamingModel } = useGlobalConfigStore();
  const { setHasUseMcp, setMcpServers, setAllTools } = useMcpServerStore();
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
    <></>
  )
}

export default AppPrepare