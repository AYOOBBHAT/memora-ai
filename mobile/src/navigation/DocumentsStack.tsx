import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CreateDocumentScreen } from '../features/documents/screens/CreateDocumentScreen';
import { DocumentDetailScreen } from '../features/documents/screens/DocumentDetailScreen';
import { DocumentsListScreen } from '../features/documents/screens/DocumentsListScreen';
import { EditDocumentScreen } from '../features/documents/screens/EditDocumentScreen';
import { SearchScreen } from '../features/search/screens/SearchScreen';
import { useTheme } from '../theme/ThemeProvider';

import type { DocumentsStackParamList } from './types';

const Stack = createNativeStackNavigator<DocumentsStackParamList>();

export function DocumentsStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="DocumentsList"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="DocumentsList"
        component={DocumentsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search', headerShown: false }}
      />
      <Stack.Screen
        name="DocumentDetail"
        component={DocumentDetailScreen}
        options={{ title: 'Document' }}
      />
      <Stack.Screen
        name="CreateDocument"
        component={CreateDocumentScreen}
        options={{
          title: 'New document',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EditDocument"
        component={EditDocumentScreen}
        options={{ title: 'Edit document' }}
      />
    </Stack.Navigator>
  );
}
