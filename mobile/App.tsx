import { ShareIntentProvider } from 'expo-share-intent';

import { AppProviders } from './src/providers/AppProviders';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <ShareIntentProvider>
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </ShareIntentProvider>
  );
}
