// src/screens/RoleSelectionScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { t } from '../i18n';

const GRADIENT_COLORS: [string, string] = ['#F7B7C3', '#B6A4F7'];

export default function RoleSelectionScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'RoleSelection'>) {
  const onChoose = (role: 'student' | 'teacher') =>
    navigation.replace('LanguageSelection', { role });

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{t('select_role')}</Text>
      <View style={styles.buttonsWrapper}>
          <TouchableOpacity style={styles.button} onPress={() => onChoose('teacher')}>
          <Text style={styles.buttonText}>{t('role_teacher')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#F7B7C3' }]} onPress={() => onChoose('student')}>
          <Text style={styles.buttonText}>{t('role_student')}</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 0
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.2
  },
  buttonsWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 20
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
    marginBottom: 0
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
