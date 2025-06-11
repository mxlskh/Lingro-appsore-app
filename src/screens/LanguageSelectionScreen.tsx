// src/screens/LanguageSelectionScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  StatusBar,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { t } from '../i18n';

const LANGUAGES = [
  { code: 'en', label: '🇺🇸/🇬🇧 Английский' },
  { code: 'es', label: '🇪🇸 Испанский' },
  { code: 'zh', label: '🇨🇳 Китайский' },
  { code: 'fr', label: '🇫🇷 Французский' },
  { code: 'ar', label: '🇦🇪 Арабский' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'de', label: '🇩🇪 Немецкий' },
  { code: 'pt', label: '🇵🇹 Португальский' },
  { code: 'ja', label: '🇯🇵 Японский' },
  { code: 'it', label: '🇮🇹 Итальянский' }
];

const GRADIENT_COLORS: [string, string] = ['#F7B7C3', '#B6A4F7'];

export default function LanguageSelectionScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>) {
  const { role } = route.params;

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{t('select_learning_language')}</Text>
      <FlatList
        data={LANGUAGES}
        keyExtractor={item => item.code}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.replace('Chat', { role, language: item.code })}
              activeOpacity={0.85}
          >
              <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        )}
          columnWrapperStyle={{ justifyContent: 'space-between', columnGap: 16 }}
          contentContainerStyle={styles.cardsContainer}
          showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 0
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
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.2
  },
  cardsContainer: {
    paddingBottom: 0
  },
  card: {
    width: 150,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B6A4F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2
  },
  cardText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#B6A4F7',
    textAlign: 'center'
  }
});
