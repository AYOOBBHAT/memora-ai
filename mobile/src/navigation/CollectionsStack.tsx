import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CollectionDetailScreen } from '../features/collections/screens/CollectionDetailScreen';
import { CollectionsListScreen } from '../features/collections/screens/CollectionsListScreen';
import { CreateCollectionScreen } from '../features/collections/screens/CreateCollectionScreen';
import { EditCollectionScreen } from '../features/collections/screens/EditCollectionScreen';
import { useTheme } from '../theme/ThemeProvider';

import type { CollectionsStackParamList } from './types';

const Stack = createNativeStackNavigator<CollectionsStackParamList>();

export function CollectionsStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="CollectionsList"
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="CollectionsList" component={CollectionsListScreen} />
      <Stack.Screen
        name="CollectionDetail"
        component={CollectionDetailScreen}
        options={{ title: 'Collection' }}
      />
      <Stack.Screen
        name="CreateCollection"
        component={CreateCollectionScreen}
        options={{
          title: 'New collection',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EditCollection"
        component={EditCollectionScreen}
        options={{ title: 'Edit collection' }}
      />
    </Stack.Navigator>
  );
}
