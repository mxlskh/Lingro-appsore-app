// supabase.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { GoTrueClient } from '@supabase/gotrue-js';

// Берём URL и ключ из expo.config.js → extra
const { SUPABASE_URL, SUPABASE_ANON_KEY } = Constants.expoConfig.extra;

// Проверяем, что переменные определены
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in expoConfig.extra');
}

// Экспортируем клиента авторизации GoTrue
export const auth = new GoTrueClient({
  url: `${SUPABASE_URL}/auth/v1`,
  headers: {
    apikey:        SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  },
  storage:          AsyncStorage,
  storageKey:       'supabase.auth.token',
  autoRefreshToken: true,
  persistSession:   true,
  detectSessionInUrl:false,
  fetch
});
