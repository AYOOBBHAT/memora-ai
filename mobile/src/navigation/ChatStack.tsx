import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import { ChatHistoryScreen } from '../features/chat/screens/ChatHistoryScreen';
import { ChatScreen } from '../features/chat/screens/ChatScreen';
import { useTheme } from '../theme/ThemeProvider';

import type { ChatStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

export function ChatStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          ...(Platform.OS === 'android' ? { height: 56 } : undefined),
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: theme.typography.fontSizes.md,
          fontWeight: theme.typography.fontWeights.semibold,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="ChatMain" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen
        name="ChatHistory"
        component={ChatHistoryScreen}
        options={{ title: 'Chat history' }}
      />
    </Stack.Navigator>
  );
}
