'use client';
import React, { useEffect } from 'react'
import useGlobalConfigStore from '@/app/store/globalConfig';
import { fetchAppSettings } from '@/app/admin/system/actions';

const AppPrepare = () => {
  const { setChatNamingModel } = useGlobalConfigStore();
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