import { create } from 'zustand';

interface IHtmlPreviewSidebarStore {
  isOpen: boolean;
  htmlContent: string;
  activeTab: 'code' | 'preview';
  activeCardId: string | null;
  setIsOpen: (value: boolean) => void;
  setHtmlContent: (content: string) => void;
  setActiveTab: (tab: 'code' | 'preview') => void;
  setActiveCardId: (id: string | null) => void;
  toggleSidebar: () => void;
  resetActiveCard: () => void;
}

const useHtmlPreviewSidebarStore = create<IHtmlPreviewSidebarStore>((set) => ({
  isOpen: false,
  htmlContent: '',
  activeTab: 'preview',
  activeCardId: null,
  setIsOpen: (value: boolean) => {
    set({ isOpen: value });
    // 如果侧边栏关闭，清除活动卡片
    if (!value) {
      set({ activeCardId: null });
    }
  },
  setHtmlContent: (content: string) => {
    set({ htmlContent: content });
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

export default useHtmlPreviewSidebarStore;
