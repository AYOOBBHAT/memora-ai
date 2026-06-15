import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PendingSharePayload {
  text: string;
  webUrl: string | null;
  metaTitle: string | null;
  receivedAt: string;
}

interface ShareState {
  pendingShare: PendingSharePayload | null;
  setPendingShare: (payload: PendingSharePayload) => void;
  clearPendingShare: () => void;
}

export const useShareStore = create<ShareState>()(
  persist(
    (set) => ({
      pendingShare: null,
      setPendingShare: (payload) => set({ pendingShare: payload }),
      clearPendingShare: () => set({ pendingShare: null }),
    }),
    {
      name: 'memora-pending-share',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
