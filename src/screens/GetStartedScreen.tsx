// src/screens/GetStartedScreen.tsx
import React from 'react';
import {
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../../App';
import { Spacing, FontSizes, BorderRadius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'GetStarted'>;

export default function GetStartedScreen({ navigation }: Props) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Логотип / название */}
      <Text style={[styles.logo, { color: colors.primary }]}>Lingro</Text>
      {/* Основной заголовок */}
      <Text style={[styles.title, { color: colors.text }]}>
        Начнём наше путешествие в мир языков!
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => navigation.replace('RoleSelection')}
      >
        <Text style={[styles.buttonText, { color: colors.card }]}>
          Давай по порядку
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md
  },
  logo: {
    fontSize: FontSizes.xl * 1.5,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: { fontFamily: 'AvenirNext-Heavy' },
      android: { fontFamily: 'sans-serif-black' }
    })
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xl
  },
  button: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '80%',
    alignItems: 'center'
  },
  buttonText: {
    fontSize: FontSizes.md,
    fontWeight: '600'
  }
});
