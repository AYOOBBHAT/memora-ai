import { createNativeStackNavigator } from '@react-navigation/native-stack';



import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';

import { LoginScreen } from '../features/auth/screens/LoginScreen';

import { RegisterScreen } from '../features/auth/screens/RegisterScreen';

import { useTheme } from '../theme/ThemeProvider';

import type { AuthStackParamList } from './types';



const Stack = createNativeStackNavigator<AuthStackParamList>();



export function AuthStack() {

  const { theme } = useTheme();



  return (

    <Stack.Navigator

      initialRouteName="Login"

      screenOptions={{

        headerStyle: { backgroundColor: theme.colors.surface },

        headerTintColor: theme.colors.text,

        headerShadowVisible: false,

        contentStyle: { backgroundColor: theme.colors.background },

      }}

    >

      <Stack.Screen

        name="Login"

        component={LoginScreen}

        options={{ headerShown: false }}

      />

      <Stack.Screen

        name="Register"

        component={RegisterScreen}

        options={{ title: 'Create account' }}

      />

      <Stack.Screen

        name="ForgotPassword"

        component={ForgotPasswordScreen}

        options={{ title: 'Reset password' }}

      />

    </Stack.Navigator>

  );

}

