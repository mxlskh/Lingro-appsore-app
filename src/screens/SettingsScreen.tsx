// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { Audio } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';

const GRADIENT_COLORS: [string, string] = ['#F7B7C3', '#B6A4F7'];
const OPENAI_VOICES = [
  { id: 'alloy', label: 'Alloy' },
  { id: 'echo', label: 'Echo' },
  { id: 'fable', label: 'Fable' },
  { id: 'onyx', label: 'Onyx' },
  { id: 'nova', label: 'Nova' },
  { id: 'shimmer', label: 'Shimmer' },
];

async function fetchTTS(text: string, voice: string): Promise<string | null> {
  try {
    const resp = await fetch('http://localhost:3001/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
    const data = await resp.json();
    if (resp.ok && data.url) {
      return 'http://localhost:3001' + data.url;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function playMp3(url: string) {
  const { sound } = await Audio.Sound.createAsync({ uri: url });
  await sound.playAsync();
}

export default function SettingsScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'Settings'>) {
  const { isDark, toggleTheme } = require('../context/ThemeContext').useAppTheme();
  const { role } = route.params;
  const [voiceModal, setVoiceModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [loading, setLoading] = useState(false);

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Настройки</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Тёмная тема</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeSwitch}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={isDark ? '#B6A4F7' : '#F7B7C3'} />
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.button} onPress={() => setVoiceModal(true)}>
          <Ionicons name="volume-high-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Выбрать голос: {OPENAI_VOICES.find(v => v.id === selectedVoice)?.label}</Text>
        </TouchableOpacity>

        <Modal visible={voiceModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Выберите голос ChatGPT</Text>
              <FlatList
                data={OPENAI_VOICES}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.voiceItem}
                    onPress={() => setSelectedVoice(item.id)}
                  >
                    <Ionicons
                      name={selectedVoice === item.id ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color="#6A0DAD"
                    />
                    <Text style={styles.voiceName}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                style={styles.voiceList}
              />
              <TouchableOpacity
                style={styles.listenButton}
                onPress={async () => {
                  setLoading(true);
                  const url = await fetchTTS('Пример этого голоса', selectedVoice);
                  setLoading(false);
                  if (url) await playMp3(url);
                  else alert('Ошибка генерации озвучки');
                }}
                disabled={loading}
              >
                <Text style={styles.listenButtonText}>{loading ? 'Генерируется...' : 'Прослушать'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setVoiceModal(false)}
              >
                <Text style={styles.closeButtonText}>Закрыть</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    padding: 24
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    color: '#6A0DAD'
  },
  themeSwitch: {
    padding: 8
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  buttonText: {
    fontSize: 16,
    color: '#6A0DAD',
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 16,
    textAlign: 'center'
  },
  voiceList: {
    maxHeight: 320
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  voiceName: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333'
  },
  listenButton: {
    backgroundColor: '#B6A4F7',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    alignItems: 'center'
  },
  listenButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: 16
  },
  closeButtonText: {
    color: '#6A0DAD',
    fontWeight: 'bold',
    fontSize: 16
  }
});
