// App.tsx

import React from 'react';
import { SafeAreaView, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import SplashScreen from './src/screens/SplashScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import GetStartedScreen from './src/screens/GetStartedScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { LightNavTheme, DarkNavTheme } from './src/theme';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';

// Навигатор и его параметры
export type RootStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  SignUp: undefined;
  GetStarted: undefined;
  RoleSelection: undefined;
  LanguageSelection: { role: 'student' | 'teacher' };
  Chat: { role: 'student' | 'teacher'; language: string };
  Settings: { role: 'student' | 'teacher'; language: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainNavigator() {
  const { isDark, colors } = useAppTheme();
  const navTheme = isDark ? DarkNavTheme : LightNavTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{
            title: 'Войти',
            headerStyle: { backgroundColor: colors.card },
            headerTitleStyle: { color: colors.text }
          }}
        />

        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{
            title: 'Регистрация',
            headerStyle: { backgroundColor: colors.card },
            headerTitleStyle: { color: colors.text }
          }}
        />

        <Stack.Screen
          name="GetStarted"
          component={GetStartedScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="LanguageSelection"
          component={LanguageSelectionScreen}
          options={{
            headerShown: false,
            title: 'Выберите язык'
          }}
        />

        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            headerShown: false // Временно убираем шапку, чтобы проверить тулбар
          }}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Настройки',
            headerStyle: { backgroundColor: colors.card },
            headerTitleStyle: { color: colors.text }
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <MainNavigator />
      </SafeAreaView>
    </ThemeProvider>
  );
}
