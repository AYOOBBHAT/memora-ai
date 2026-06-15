import { useEffect, useRef } from 'react';

import { useOnboardingLaunchStore } from '../stores/onboarding.store';
import { navigationRef } from './navigationRef';
import { MainTabs } from './MainTabs';

export function MainAppEntry() {
  const openChatOnLaunch = useOnboardingLaunchStore((state) => state.openChatOnLaunch);
  const consumePendingChatLaunch = useOnboardingLaunchStore((state) => state.consumePendingChatLaunch);
  const hasLaunchedChat = useRef(false);

  useEffect(() => {
    if (!openChatOnLaunch || hasLaunchedChat.current) {
      return;
    }

    const message = consumePendingChatLaunch();
    if (!message) {
      return;
    }

    hasLaunchedChat.current = true;

    const navigateToChat = () => {
      if (!navigationRef.current?.isReady()) {
        requestAnimationFrame(navigateToChat);
        return;
      }

      navigationRef.current.navigate('App', {
        screen: 'Chat',
        params: {
          screen: 'ChatMain',
          params: {
            initialMessage: message,
            autoSend: true,
          },
        },
      });
    };

    navigateToChat();
  }, [consumePendingChatLaunch, openChatOnLaunch]);

  return <MainTabs />;
}
