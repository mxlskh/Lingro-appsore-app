import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av/build/Audio.types';

const VoiceContext = createContext<{
  selectedVoice: string;
  setSelectedVoice: (v: string) => void;
  voices: Speech.Voice[];
  speak: (text: string) => void;
}>({
  selectedVoice: '',
  setSelectedVoice: () => {},
  voices: [],
  speak: () => {},
});

export const VoiceProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voices, setVoices] = useState<Speech.Voice[]>([]);

  useEffect(() => {
    // Устанавливаем режим аудио для корректной работы TTS
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });

    Speech.getAvailableVoicesAsync().then((allVoices) => {
      const uniqueVoices = allVoices.filter((voice, index, self) =>
        index === self.findIndex((v) => v.name === voice.name)
      );
      // Перемешиваем массив голосов
      const shuffled = uniqueVoices.sort(() => Math.random() - 0.5);
      const randomVoices = shuffled.slice(0, 10);
      console.log('Выбранные 10 голосов:', randomVoices.map(v => v.name));
      setVoices(randomVoices);
      if (randomVoices.length && !randomVoices.find(v => v.identifier === selectedVoice)) {
        setSelectedVoice(randomVoices[0].identifier);
      }
    });
  }, []);

  const speak = (text: string) => {
    if (!text.trim()) return;
    Speech.stop();
    // fallback: если выбранный голос не найден, используем системный
    const voiceObj = voices.find(v => v.identifier === selectedVoice);
    const options = voiceObj ? {
      voice: selectedVoice,
      pitch: 1.0,
      rate: 0.9,
      onStart: () => console.log('Started speaking'),
      onDone: () => console.log('Done speaking'),
      onError: (error: unknown) => console.error('Speech error:', error),
    } : {
      pitch: 1.0,
      rate: 0.9,
      onStart: () => console.log('Started speaking (default voice)'),
      onDone: () => console.log('Done speaking'),
      onError: (error: unknown) => console.error('Speech error:', error),
    };
    Speech.speak(text, options);
  };

  return (
    <VoiceContext.Provider value={{ selectedVoice, setSelectedVoice, voices, speak }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => useContext(VoiceContext); 