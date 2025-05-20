import { create } from 'zustand';

interface ISvgPreviewSidebarStore {
  isOpen: boolean;
  svgContent: string;
  activeTab: 'code' | 'preview';
  activeCardId: string | null;
  setIsOpen: (value: boolean) => void;
  setSvgContent: (content: string) => void;
  setActiveTab: (tab: 'code' | 'preview') => void;
  setActiveCardId: (id: string | null) => void;
  toggleSidebar: () => void;
  resetActiveCard: () => void;
}

const useSvgPreviewSidebarStore = create<ISvgPreviewSidebarStore>((set) => ({
  isOpen: false,
  svgContent: '',
  activeTab: 'preview',
  activeCardId: null,
  setIsOpen: (value: boolean) => {
    set({ isOpen: value });
    // 如果侧边栏关闭，清除活动卡片
    if (!value) {
      set({ activeCardId: null });
    }
  },
  setSvgContent: (content: string) => {
    set({ svgContent: content });
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

export default useSvgPreviewSidebarStore;
