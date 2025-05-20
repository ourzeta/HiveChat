import { create } from 'zustand';

// 定义内容类型
export type ContentType = 'svg' | 'html';

// 通用预览侧边栏状态接口
interface IPreviewSidebarStore {
  isOpen: boolean;
  contentType: ContentType | null;
  content: string;
  activeTab: 'code' | 'preview';
  activeCardId: string | null;
  setIsOpen: (value: boolean) => void;
  setContent: (content: string, type: ContentType) => void;
  setActiveTab: (tab: 'code' | 'preview') => void;
  setActiveCardId: (id: string | null) => void;
  toggleSidebar: () => void;
  resetActiveCard: () => void;
}

// 创建通用预览侧边栏状态管理
const usePreviewSidebarStore = create<IPreviewSidebarStore>((set) => ({
  isOpen: false,
  contentType: null,
  content: '',
  activeTab: 'preview',
  activeCardId: null,
  
  setIsOpen: (value: boolean) => {
    set({ isOpen: value });
    // 如果侧边栏关闭，清除活动卡片
    if (!value) {
      set({ activeCardId: null });
    }
  },
  
  setContent: (content: string, type: ContentType) => {
    set({ 
      content: content,
      contentType: type
    });
  },
  
  setActiveTab: (tab: 'code' | 'preview') => {
    set({ activeTab: tab });
  },
  
  setActiveCardId: (id: string | null) => {
    set({ activeCardId: id });
  },
  
  toggleSidebar: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },
  
  resetActiveCard: () => {
    set({ activeCardId: null });
  },
}));

export default usePreviewSidebarStore;
