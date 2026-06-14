import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatScreen } from '../features/chat/screens/ChatScreen';
import { useTheme } from '../theme/ThemeProvider';

import type { ChatStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="ChatMain" component={ChatScreen} options={{ title: 'Chat' }} />
    </Stack.Navigator>
  );
}
