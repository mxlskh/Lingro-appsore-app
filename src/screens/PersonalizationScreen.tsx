import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { t, setAppLanguage } from '../i18n';

const GRADIENT_COLORS: [string, string] = ['#F7B7C3', '#B6A4F7'];
const APP_LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];
const TTS_VOICES = [
  { id: 'alloy', label: 'Alloy' },
  { id: 'nova', label: 'Nova' },
  { id: 'echo', label: 'Echo' },
  { id: 'fable', label: 'Fable' },
  { id: 'onyx', label: 'Onyx' },
  { id: 'shimmer', label: 'Shimmer' },
];

export default function PersonalizationScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Personalization'>) {
  const [appLanguage, setAppLanguageState] = useState('ru');
  const [ttsVoice, setTtsVoice] = useState('alloy');
  const [_, forceUpdate] = useState(0);

  const handleLanguageChange = (lang: string) => {
    setAppLanguageState(lang);
    setAppLanguage(lang);
    forceUpdate(x => x + 1); // обновить интерфейс
  };

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{t('personalization')}</Text>
        <Text style={styles.subtitle}>{t('choose_app_language')}</Text>
        <View style={styles.rowWrap}>
          {APP_LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.selectBtn, appLanguage === lang.code && styles.selectedBtn]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={[styles.selectBtnText, appLanguage === lang.code && styles.selectedBtnText]}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.subtitle}>{t('choose_tts_voice')}</Text>
        <View style={styles.rowWrap}>
          {TTS_VOICES.map(voice => (
            <TouchableOpacity
              key={voice.id}
              style={[styles.selectBtn, ttsVoice === voice.id && styles.selectedBtn]}
              onPress={() => setTtsVoice(voice.id)}
            >
              <Text style={[styles.selectBtnText, ttsVoice === voice.id && styles.selectedBtnText]}>{voice.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={() => navigation.replace('RoleSelection')}>
          <Text style={styles.buttonText}>{t('continue')}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>{t('you_can_change_later')}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 0
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2
  },
  subtitle: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 8
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 8
  },
  selectBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    margin: 6,
    shadowColor: '#B6A4F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2
  },
  selectedBtn: {
    backgroundColor: '#B6A4F7',
  },
  selectBtnText: {
    color: '#B6A4F7',
    fontSize: 16,
    fontWeight: '600'
  },
  selectedBtnText: {
    color: '#fff',
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
    marginTop: 24
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  hint: {
    color: '#fff',
    fontSize: 14,
    marginTop: 18,
    textAlign: 'center',
    opacity: 0.8
  }
}); 