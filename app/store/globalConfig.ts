import { create } from 'zustand';

interface IGlobalConfigStoreStore {
  chatNamingModel: string;
  setChatNamingModel: (newChatNamingModel: string) => void;
}

const useGlobalConfigStore = create<IGlobalConfigStoreStore>((set) => ({
  chatNamingModel: 'current',
  setChatNamingModel: (value: string) => {
    set({ chatNamingModel: value });
  },

}))

export default useGlobalConfigStore
