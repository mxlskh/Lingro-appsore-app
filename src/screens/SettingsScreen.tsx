// src/screens/SettingsScreen.tsx
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useAppTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius, FontSizes } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation, route }: Props) {
  const { isDark, toggleTheme, colors } = useAppTheme();
  const { role } = route.params;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Логотип / название приложения */}
      <Text style={[styles.logo, { color: colors.primary }]}>Lingro</Text>
      {/* Заголовок экрана */}
      <Text style={[styles.screenTitle, { color: colors.text }]}>Настройки</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Тёмная тема</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ true: colors.primary }}
            thumbColor={isDark ? colors.accent : undefined}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { borderColor: colors.border }]}
          onPress={() => navigation.replace('RoleSelection')}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Изменить роль</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { borderColor: colors.border }]}
          onPress={() => navigation.replace('LanguageSelection', { role })}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Изменить язык</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { borderColor: colors.border }]}>
          <Text style={[styles.buttonText, { color: colors.text }]}>О разработчиках</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  logo: {
    fontSize: FontSizes.xl * 1.5,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: Spacing.md,
    ...Platform.select({
      ios:   { fontFamily: 'AvenirNext-Heavy' },
      android: { fontFamily: 'sans-serif-black' }
    })
  },
  screenTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg
  },
  content: {
    padding: Spacing.md
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm
  },
  label: {
    fontSize: FontSizes.md
  },
  button: {
    backgroundColor: 'transparent',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
    borderWidth: 1
  },
  buttonText: {
    fontSize: FontSizes.md
  }
});
