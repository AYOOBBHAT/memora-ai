import { registerRootComponent } from 'expo';
import * as ExpoSplashScreen from 'expo-splash-screen';

import App from './App';

void ExpoSplashScreen.preventAutoHideAsync();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
