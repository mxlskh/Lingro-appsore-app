// App.tsx

import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
import { VoiceProvider } from './src/context/VoiceContext';

// 1) Типизация всех экранов и их параметров:
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
  // Получаем текущую тему
  const { isDark, colors } = useAppTheme();
  const navTheme = isDark ? DarkNavTheme : LightNavTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName="Splash">
        {/* ------------------- Splash ------------------- */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />

        {/* ------------------- SignIn ------------------- */}
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ headerShown: false }}
        />

        {/* ------------------- SignUp ------------------- */}
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />

        {/* ------------------- GetStarted ------------------- */}
        <Stack.Screen
          name="GetStarted"
          component={GetStartedScreen}
          options={{ headerShown: false }}
        />

        {/* ------------------- RoleSelection ------------------- */}
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />

        {/* ------------------- LanguageSelection ------------------- */}
        <Stack.Screen
          name="LanguageSelection"
          component={LanguageSelectionScreen}
          options={{
            headerShown: false,
            title: 'Выберите язык',
          }}
        />

        {/* ------------------- Chat ------------------- */}
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            // Включаем шапку, чтобы отобразить headerRight с иконкой «шестерёнки»
            headerShown: true,
            title: 'Чат',
            headerStyle: { backgroundColor: colors.card },
            headerTitleStyle: { color: colors.text },
          }}
        />

        {/* ------------------- Settings ------------------- */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Настройки',
            headerStyle: { backgroundColor: colors.card },
            headerTitleStyle: { color: colors.text },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Чтобы top/bottom SafeArea были окрашены под тему, оборачиваем MainNavigator
function AppWrapper() {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <MainNavigator />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <VoiceProvider>
    <ThemeProvider>
      <AppWrapper />
    </ThemeProvider>
    </VoiceProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
