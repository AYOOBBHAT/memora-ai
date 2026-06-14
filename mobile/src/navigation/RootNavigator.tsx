import { useCallback, useState } from 'react';



import { SplashScreen } from '../features/auth/screens/SplashScreen';

import { useAuthStore } from '../stores/auth.store';

import { AuthStack } from './AuthStack';

import { MainTabs } from './MainTabs';



export function RootNavigator() {

  const { isAuthenticated } = useAuthStore();

  const [isBootstrapped, setIsBootstrapped] = useState(false);



  const handleSplashReady = useCallback(() => {

    setIsBootstrapped(true);

  }, []);



  if (!isBootstrapped) {

    return <SplashScreen onReady={handleSplashReady} />;

  }



  if (!isAuthenticated) {

    return <AuthStack />;

  }



  return <MainTabs />;

}

