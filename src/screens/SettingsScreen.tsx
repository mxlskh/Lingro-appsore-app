// src/screens/SettingsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

const GRADIENT_COLORS: [string, string] = ['#F7B7C3', '#B6A4F7'];

export default function SettingsScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'Settings'>) {
  const { isDark, toggleTheme } = require('../context/ThemeContext').useAppTheme();
  const { role } = route.params;

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Настройки</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Тёмная тема</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ true: '#B6A4F7' }}
            thumbColor={isDark ? '#F7B7C3' : undefined}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={() => navigation.replace('RoleSelection')}>
          <Text style={styles.buttonText}>Изменить роль</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.replace('LanguageSelection', { role })}>
          <Text style={styles.buttonText}>Изменить язык</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>О разработчиках</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 0
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 0,
    marginTop: 0
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 0,
    marginTop: 0,
    textAlign: 'center',
    letterSpacing: 0.2
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 240,
    marginBottom: 8,
    marginTop: 0
  },
  label: {
    fontSize: 17,
    color: '#B6A4F7',
    fontWeight: '600'
  },
  button: {
    width: 240,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B6A4F7',
    shadowColor: '#B6A4F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
    marginTop: 0
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
