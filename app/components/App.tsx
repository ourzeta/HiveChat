'use client';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/app/components/Sidebar";
import { LoginModalProvider } from '@/app/contexts/loginModalContext';
import LoginModal from '@/app/components/loginModal';
import useSidebarCollapsedStore from '@/app/store/sidebarCollapsed';
import useSvgPreviewSidebarStore from '@/app/store/svgPreviewSidebar';
import SvgPreviewSidebar from '@/app/components/artifact/SvgPreviewSidebar';
import SpinLoading from '@/app/components/loading/SpinLoading';
import clsx from 'clsx';

const App: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasInstalled, setHasInstalled] = useState(false);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebarCollapsedStore();
  const { isOpen: isSvgSidebarOpen, setIsOpen, resetActiveCard } = useSvgPreviewSidebarStore();
  const pathname = usePathname();
  const [previousPath, setPreviousPath] = useState(pathname);

  // 监听路径变化，当对话切换时关闭SVG预览侧边栏
  useEffect(() => {
    // 检查是否是对话切换
    const currentChatId = pathname.split("/").pop() || '';
    const previousChatId = previousPath.split("/").pop() || '';

    // 如果对话ID变化且SVG侧边栏处于打开状态，则关闭侧边栏并清除高亮
    if (currentChatId !== previousChatId && isSvgSidebarOpen) {
      setIsOpen(false);
      resetActiveCard();
    }

    setPreviousPath(pathname);
  }, [pathname, previousPath, isSvgSidebarOpen, setIsOpen, resetActiveCard]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // 768 是常见的移动端断点宽度
        setIsSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setIsSidebarCollapsed]);

  useEffect(() => {
    async function initData() {
      localStorage.setItem('hive_chat_app_status', 'installed');
      localStorage.setItem('hive_chat_app_version', '1.0.0');
    }
    const status = localStorage.getItem('hive_chat_app_status');
    if (status !== 'installed') {
      initData().then(() => {
        setHasInstalled(true);
      });
    } else {
      setHasInstalled(true);
    }
  }, []);

  if (!hasInstalled) {
    return (
      <main className="h-full flex justify-center items-center">
        <SpinLoading />
        <span className='ml-2 text-gray-600'>Loading ...</span>
      </main>
    )
  }
  return (
    <LoginModalProvider>
      <div className="flex h-dvh w-screen overflow-hidden">
        <Sidebar />
        <div
          className={clsx(
            "h-full w-0 relative grow flex flex-col transition-all duration-300 ease-in-out overflow-y-auto",
            {
              "md:w-full md:-ml-72": isSidebarCollapsed,
              "w-full": isSidebarCollapsed,
            }
          )}
          style={{
            // 当 SVG 侧边栏打开时，主内容区域宽度减少为 40%
            width: '100%',
            // 当侧边栏打开时，设置右侧内边距为主内容区域的 40%
            paddingRight: isSvgSidebarOpen ? 'calc(40% - 18px)' : '0',
          }}
        >
          {children}
        </div>
        <SvgPreviewSidebar />
      </div>
      <LoginModal />
    </LoginModalProvider>
  )
}

export default App