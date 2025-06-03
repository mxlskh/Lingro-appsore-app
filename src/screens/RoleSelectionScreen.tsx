// src/screens/RoleSelectionScreen.tsx
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useAppTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius, FontSizes } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelection'>;

export default function RoleSelectionScreen({ navigation }: Props) {
  const { colors } = useAppTheme();

  const onChoose = (role: 'student' | 'teacher') =>
    navigation.replace('LanguageSelection', { role });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.logo, { color: colors.primary }]}>Lingro</Text>
      <Text style={[styles.title, { color: colors.text }]}>Кто вы?</Text>
      <View style={styles.buttonsWrapper}>
        <Pressable
          android_ripple={{ color: '#0002' }}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.accent },
            pressed && styles.pressed
          ]}
          onPress={() => onChoose('teacher')}
        >
          <Text style={styles.buttonText}>Преподаватель</Text>
        </Pressable>

        <Pressable
          android_ripple={{ color: '#0002' }}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary },
            pressed && styles.pressed
          ]}
          onPress={() => onChoose('student')}
        >
          <Text style={styles.buttonText}>Ученик</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  logo: {
    fontSize: FontSizes.xl * 1.5,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios:   { fontFamily: 'AvenirNext-Heavy' },
      android: { fontFamily: 'sans-serif-black' }
    })
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xl
  },
  buttonsWrapper: {
    width: '80%',
    alignSelf: 'center',
    gap: Spacing.md // RN 0.71+ supports gap
  },
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.8
  },
  buttonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600'
  }
});
