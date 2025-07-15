import { create } from 'zustand';
import { getUserSettings, updateUserSettings } from '@/app/chat/settings/actions';

interface IUserSettingsStore {
  messageSendShortcut: 'enter' | 'ctrl_enter';
  loading: boolean;
  setMessageSendShortcut: (shortcut: 'enter' | 'ctrl_enter') => Promise<void>;
  loadUserSettings: () => Promise<void>;
}

const useUserSettingsStore = create<IUserSettingsStore>((set, get) => ({
  messageSendShortcut: 'enter',
  loading: false,
  
  setMessageSendShortcut: async (shortcut: 'enter' | 'ctrl_enter') => {
    set({ loading: true });
    try {
      const result = await updateUserSettings({ messageSendShortcut: shortcut });
      if (result.success) {
        set({ messageSendShortcut: shortcut });
      } else {
        console.error('Failed to update message send shortcut:', result.message);
      }
    } catch (error) {
      console.error('Error updating message send shortcut:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  loadUserSettings: async () => {
    set({ loading: true });
    try {
      const result = await getUserSettings();
      if (result.success && result.data) {
        set({ messageSendShortcut: result.data.messageSendShortcut });
      } else {
        console.error('Failed to load user settings:', result.message);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useUserSettingsStore;
