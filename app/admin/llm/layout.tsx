'use client';
import React, { useState, useEffect } from 'react'
import { fetchAllLlmSettings } from '@/app/adapter/actions';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { Skeleton } from "antd";
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import ProviderItem from '@/app/components/ProviderItem';
import Link from 'next/link';
import useModelListStore from '@/app/store/modelList';
import AddCustomProvider from '@/app/components/admin/AddCustomProvider';


export default function LLMLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {

  const t = useTranslations('Admin.Models');
  const [isPending, setIsPending] = useState(true);
  const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false);
  const pathname = usePathname();
  const providerId = pathname.split("/").pop() || '';
  const { allProviderList, initAllProviderList } = useModelListStore();
  useEffect(() => {
    const fetchLlmList = async (): Promise<void> => {
      const result = await fetchAllLlmSettings();
      const processedList = result.map(item => ({
        id: item.provider,
        providerName: item.providerName,
        providerLogo: item.logo || '',
        type: item.type,
        status: item.isActive || false,
      }));

      initAllProviderList(processedList)
      setIsPending(false);
    };
    fetchLlmList();
  }, [initAllProviderList]);
  return (
    <div className='w-full flex flex-row h-dvh'>
      <div className='w-72 bg-slate-50 p-4 border-l h-dvh overflow-y-auto'>
        {isPending ? <>
          <Skeleton.Node active style={{ width: 250, height: '3rem', marginTop: '0.5rem' }} />
          <Skeleton.Node active style={{ width: 250, height: '3rem', marginTop: '0.5rem' }} />
          <Skeleton.Node active style={{ width: 250, height: '3rem', marginTop: '0.5rem' }} />
          <Skeleton.Node active style={{ width: 250, height: '3rem', marginTop: '0.5rem' }} />
          <Skeleton.Node active style={{ width: 250, height: '3rem', marginTop: '0.5rem' }} />
          <Skeleton.Node active style={{ width: 250, height: '3rem', marginTop: '0.5rem' }} />
          <Skeleton.Node active style={{ width: 250, height: '3rem', marginTop: '0.5rem' }} />
          <Skeleton.Node active style={{ width: 250, height: '3rem', marginTop: '0.5rem' }} />
        </>
          : <>
            {
              allProviderList.map((i) => (
                <Link key={i.id} href={`/admin/llm/${i.id}`}>
                  <ProviderItem
                    className={clsx('mt-2', { 'bg-gray-200': providerId === i.id })}
                    data={{
                      id: i.id,
                      providerName: i.providerName,
                      status: i.status,
                    }}
                  />
                </Link>
              ))
            }
          </>
        }
        <div className="flex grow-0 mt-2 flex-row just items-center justify-center border h-10 text-sm px-2 hover:bg-gray-200 cursor-pointer rounded-md"
          onClick={() => {
            setIsAddProviderModalOpen(true)
          }}
        >
          <PlusCircleOutlined style={{ 'fontSize': '14px' }} />
          <span className='ml-2'>添加服务商</span>
        </div>
      </div>
      <div className='w-0 grow overflow-y-auto'>
        {
          isPending ? <>Loading</>
            :
            <div className='container mx-auto max-w-2xl p-6 h-dvh'>
              {children}
            </div>
        }

      </div>
      <AddCustomProvider
        isModalOpen={isAddProviderModalOpen}
        setIsModalOpen={setIsAddProviderModalOpen}
      />
    </div>
  )
}