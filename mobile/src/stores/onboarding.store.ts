import { create } from 'zustand';

interface OnboardingLaunchState {
  pendingChatMessage: string | null;
  openChatOnLaunch: boolean;
  setPendingChatLaunch: (message: string | null) => void;
  consumePendingChatLaunch: () => string | null;
}

export const useOnboardingLaunchStore = create<OnboardingLaunchState>((set, get) => ({
  pendingChatMessage: null,
  openChatOnLaunch: false,
  setPendingChatLaunch: (message) =>
    set({
      pendingChatMessage: message,
      openChatOnLaunch: message !== null,
    }),
  consumePendingChatLaunch: () => {
    const message = get().pendingChatMessage;
    set({ pendingChatMessage: null, openChatOnLaunch: false });
    return message;
  },
}));
