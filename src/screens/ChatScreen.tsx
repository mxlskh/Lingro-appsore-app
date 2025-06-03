// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  PanResponder,
  Animated,
  Text,
  LogBox,
} from 'react-native';

import { GiftedChat, Bubble, IMessage } from 'react-native-gifted-chat';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useAppTheme } from '../context/ThemeContext';

type Message = IMessage & {
  audioUri?: string;
  audioDuration?: string;
};

const {
  OPENAI_API_KEY,
  PROXY_URL,
  MODEL_GPT4,
  MODEL_FALLBACK
} = Constants.expoConfig!.extra as Record<string, string>;

// Подавляем предупреждение о deprecated из expo-av (SDK 53 ещё содержит expo-av)
LogBox.ignoreLogs([
  '[expo-av]: Expo AV has been deprecated'
]);

/**
 * Проверяет, является ли текст запросом на поиск изображений.
 */
function isImageQuery(text: string): boolean {
  const lower = text.trim().toLowerCase();
  const ruTriggers = ['фото', 'картинк', 'изображен', 'фотограф'];
  const enTriggers = ['image', 'photo', 'picture'];
  return (
    ruTriggers.some((w) => lower.includes(w)) ||
    enTriggers.some((w) => lower.includes(w))
  );
}

/**
 * Убирает стандартные «ключевые слова» из текста, чтобы
 * получить «чистый» поисковый запрос для DuckDuckGo.
 */
function extractSearchTerm(text: string): string {
  let lower = text.trim().toLowerCase();

  const ruPatterns = [
    /\bнайди\b/g,
    /\bпокажи\b/g,
    /\bможешь\b/g,
    /\bпришли\b/g,
    /\bискать\b/g,
    /\bищи\b/g,
    /\bизображен(ие|ий|ию|ия)?\b/g,
    /\bфото\b/g,
    /\bкартинки?\b/g,
    /\bфотограф(ию|ия)?\b/g,
    /\bпросьба\b/g
  ];
  for (const pat of ruPatterns) {
    lower = lower.replace(pat, ' ');
  }

  const enPatterns = [
    /\bfind\b/g,
    /\bshow\b/g,
    /\bcould\b/g,
    /\bplease\b/g,
    /\bsearch\b/g,
    /\bme\b/g,
    /\bpictures?\b/g,
    /\bimages?\b/g,
    /\bphoto(s)?\b/g,
    /\bof\b/g
  ];
  for (const pat of enPatterns) {
    lower = lower.replace(pat, ' ');
  }

  const term = lower.trim().replace(/\s+/g, ' ');
  return term.length > 0 ? term : text.trim();
}

/**
 * Получает «vqd» токен у DuckDuckGo (он нужен, 
 * чтобы корректно запросить i.js-контент).
 */
async function fetchDuckDuckGoVQD(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&iax=images&ia=images`;
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html',
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    const match = html.match(/vqd=['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Запрашивает напрямую JSON из i.js DuckDuckGo
 * и возвращает до 3 URL найденных картинок.
 */
async function searchImagesDuckDuckGo(query: string): Promise<string[]> {
  try {
    const vqd = await fetchDuckDuckGoVQD(query);
    if (!vqd) throw new Error('Failed to get vqd');
    const apiUrl = `https://duckduckgo.com/i.js?l=ru-ru&o=json&q=${encodeURIComponent(
      query
    )}&vqd=${vqd}`;

    const resp = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://duckduckgo.com/',
      },
    });
    if (!resp.ok) throw new Error(`DuckDuckGo returned ${resp.status}`);
    const json: any = await resp.json();
    const results: any[] = json.results || [];
    return results
      .slice(0, 3)
      .map((r) => r.image)
      .filter((u) => typeof u === 'string');
  } catch {
    return [];
  }
}

export default function ChatScreen() {
  const { colors } = useAppTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Для аудио-записи
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<string>('0:00');
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingCanceled, setRecordingCanceled] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Для воспроизведения
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Первоначальное сообщение от бота
    setMessages([
      {
        _id: 1,
        text: 'Привет! Я Lingro, чем могу помочь?',
        createdAt: new Date(),
        user: { _id: 2, name: 'Lingro' },
      }
    ]);

    return () => {
      // Разгружаем звук при размонтировании
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // === PanResponder для кнопки микрофона ===
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setRecordingCanceled(false);
        setRecordingActive(true);
        Animated.spring(scaleAnim, { toValue: 1.4, useNativeDriver: true }).start();
        startRecording();
      },
      onPanResponderMove: (_, gestureState) => {
        // Если сдвинуть более чем на 50px влево — отменяем запись
        if (gestureState.dx < -50 && recordingActive && !recordingCanceled) {
          setRecordingCanceled(true);
          cancelRecording();
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
        if (recordingActive && !recordingCanceled) {
          finishRecording();
        }
        setRecordingActive(false);
      },
    })
  ).current;

  // === Запуск записи ===
  const startRecording = async () => {
    if (recordingRef.current) {
      console.warn('Recording already in progress');
      return;
    }
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Нужно разрешение на запись аудио');
        setRecordingActive(false);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      // @ts-ignore
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      setRecordingDuration('0:00');
      recordingTimer.current = setInterval(() => {
        const durationMs = Date.now() - startTime;
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        setRecordingDuration(
          `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
        );
      }, 300);
    } catch (e) {
      console.error('startRecording error:', e);
      alert('Ошибка при начале записи');
      setRecordingActive(false);
    }
  };

  // === Завершение записи и отправка ===
  const finishRecording = async () => {
    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      const rec = recordingRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const status = await rec.getStatusAsync();
      const uri = rec.getURI()!;
      recordingRef.current = null;

      const durationMillis = status.durationMillis ?? 0;
      const secondsTotal = Math.floor(durationMillis / 1000);
      const minutes = Math.floor(secondsTotal / 60);
      const seconds = secondsTotal % 60;
      const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      const audioMsg: Message = {
        _id: Date.now(),
        createdAt: new Date(),
        user: { _id: 1, name: 'Вы' },
        text: duration,
        audioUri: uri,
        audioDuration: duration,
      };
      setMessages((prev) => GiftedChat.append(prev, [audioMsg]));
    } catch (e) {
      console.error('finishRecording error:', e);
      alert('Ошибка при завершении записи');
    }
  };

  // === Отмена записи (свайп влево) ===
  const cancelRecording = async () => {
    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      const rec = recordingRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      recordingRef.current = null;
    } catch {
      // игнорируем ошибки
    }
  };

  // === Проигрывание голосового сообщения ===
  const playAudio = async (uri: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingUri(uri);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          setPlayingUri(null);
        }
      });
    } catch (e) {
      console.error('playAudio error:', e);
    }
  };

  // === Отправка текстового или картинка или запроса OpenAI ===
  const onSend = useCallback(async () => {
    if (!text.trim()) return;

    const newMsg: Message = {
      _id: Date.now(),
      text: text.trim(),
      createdAt: new Date(),
      user: { _id: 1, name: 'Вы' }
    };
    setMessages((prev) => GiftedChat.append(prev, [newMsg]));
    const userText = text.trim();
    setText('');
    setIsTyping(true);

    // 1) Если это запрос на фото — DuckDuckGo
    if (isImageQuery(userText)) {
      const queryTerm = extractSearchTerm(userText);
      const imageUrls = await searchImagesDuckDuckGo(queryTerm);
      if (imageUrls.length === 0) {
        setMessages((prev) =>
          GiftedChat.append(prev, [
            {
              _id: Date.now() + 1,
              text: `По запросу «${queryTerm}» ничего не найдено.`,
              createdAt: new Date(),
              user: { _id: 2, name: 'Lingro' }
            }
          ])
        );
      } else {
        const imageMessages: Message[] = imageUrls.map((url, idx) => ({
          _id: Date.now() + 10 + idx,
          createdAt: new Date(),
          user: { _id: 2, name: 'Lingro' },
          text: '',
          image: url
        }));
        setMessages((prev) => GiftedChat.append(prev, imageMessages));
      }
      setIsTyping(false);
      return;
    }

    // 2) Обычный текст — запрос к OpenAI
    const history = [
      ...messages.map((m) => ({
        role: m.user._id === 1 ? 'user' : 'assistant',
        content: m.text || ''
      })),
      { role: 'user', content: newMsg.text }
    ];

    try {
      let reply: string | null = null;
      for (const model of [MODEL_GPT4, MODEL_FALLBACK]) {
        const chatUrl = `${PROXY_URL}/api/chat`;
        const resp = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({ model, messages: history, temperature: 0.7 })
        });
        const raw = await resp.text();
        if (!resp.ok) continue;
        const data = JSON.parse(raw);
        reply = data.choices?.[0]?.message?.content?.trim() || null;
        break;
      }
      if (!reply) throw new Error();
      const botMsg: Message = {
        _id: Date.now(),
        text: reply,
        createdAt: new Date(),
        user: { _id: 2, name: 'Lingro' }
      };
      setMessages((prev) => GiftedChat.append(prev, [botMsg]));
    } catch {
      setMessages((prev) =>
        GiftedChat.append(prev, [
          {
            _id: Date.now(),
            text: 'Ошибка при запросе к OpenAI.',
            createdAt: new Date(),
            user: { _id: 2, name: 'Lingro' }
          }
        ])
      );
    } finally {
      setIsTyping(false);
    }
  }, [messages, text]);

  // === Выбор изображения из галереи и отправка ===
  const onPickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Нужно разрешение на доступ к галерее');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images
    });
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    const imgMsg: Message = {
      _id: Date.now(),
      createdAt: new Date(),
      user: { _id: 1, name: 'Вы' },
      text: '',
      image: uri
    };
    setMessages((prev) => GiftedChat.append(prev, [imgMsg]));
  };

  // === Рендер одного пузырька сообщения ===
  const renderBubble = (props: any) => {
    const currentMessage = props.currentMessage as Message;
    if (currentMessage.audioUri) {
      const isPlaying = playingUri === currentMessage.audioUri;
      return (
        <View
          style={[
            styles.voiceMessageBubble,
            props.position === 'right'
              ? styles.voiceMessageBubbleRight
              : styles.voiceMessageBubbleLeft
          ]}
        >
          <TouchableOpacity
            onPress={() => playAudio(currentMessage.audioUri!)}
            style={styles.playButton}
          >
            <Ionicons
              name={isPlaying ? 'pause-outline' : 'play-outline'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
          <Text style={styles.voiceMessageText}>
            {currentMessage.audioDuration}
          </Text>
        </View>
      );
    }

    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: '#f0f0f0',
            borderColor: '#ccc',
            borderWidth: 1
          },
          right: { backgroundColor: colors.primary }
        }}
        textStyle={{
          left: { color: colors.text },
          right: { color: '#fff' }
        }}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <GiftedChat
          messages={messages}
          user={{ _id: 1, name: 'Вы' }}
          renderBubble={renderBubble}
          isTyping={isTyping}
          showUserAvatar={false}
          bottomOffset={Platform.OS === 'ios' ? 30 : 0}
          // При свайпе вниз клавиатура скроется
          listViewProps={{ keyboardDismissMode: 'on-drag' } as any}
          renderInputToolbar={() => (
            <View style={styles.inputToolbar}>
              <TouchableOpacity onPress={onPickImage}>
                <Ionicons name="attach-outline" size={24} color={colors.primary} />
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                placeholder="Напишите сообщение..."
                placeholderTextColor={colors.muted}
                value={text}
                onChangeText={setText}
              />

              <Animated.View
                style={[styles.recordButtonContainer, { transform: [{ scale: scaleAnim }] }]}
                {...panResponder.panHandlers}
              >
                <Ionicons name="mic-outline" size={20} color="#fff" />
              </Animated.View>

              <TouchableOpacity
                onPress={onSend}
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="send" size={20} color={colors.card} />
              </TouchableOpacity>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6
  },

  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 16,
    marginHorizontal: 8,
    color: '#000',
    height: 40
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },

  recordButtonContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#6A0DAD',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },

  voiceMessageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    marginVertical: 2,
    maxWidth: '75%'
  },

  voiceMessageBubbleRight: {
    backgroundColor: '#6A0DAD',
    alignSelf: 'flex-end'
  },

  voiceMessageBubbleLeft: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start'
  },

  playButton: {
    marginRight: 8
  },

  voiceMessageText: {
    color: '#fff',
    fontSize: 16
  },

  recordingTimer: {
    marginLeft: 8,
    fontWeight: '600'
  }
});
