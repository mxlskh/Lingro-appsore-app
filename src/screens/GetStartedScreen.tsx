// src/screens/GetStartedScreen.tsx
import React from 'react';
import {
  View,
  Text,
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

export default function GetStartedScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'GetStarted'>) {
  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Начнём наше путешествие в мир языков!</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.replace('RoleSelection')}>
          <Text style={styles.buttonText}>Давай по порядку</Text>
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
    paddingHorizontal: 24
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: 0.2
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
    elevation: 2
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
