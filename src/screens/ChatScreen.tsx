// src/screens/ChatScreen.tsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
} from 'react';
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
  Linking,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { GiftedChat, Bubble, IMessage } from 'react-native-gifted-chat';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useAppTheme } from '../context/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile, API_URL } from '../api/client';

// Определяем пропсы навигатора для ChatScreen
type ChatProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Расширяем IMessage, чтобы добавить поля audioUri и audioDuration
type Message = IMessage & {
  audioUri?: string;
  audioDuration?: string;
  waveform?: number[];
  file?: {
    name: string;
    url: string;
    type: string;
    status?: 'uploading' | 'done' | 'error';
    correctedUrl?: string; // для исправленного файла
  };
};

const {
  OPENAI_API_KEY,
  PROXY_URL,
  MODEL_GPT4,
  MODEL_FALLBACK,
} = Constants.expoConfig!.extra as Record<string, string>;

// Подавляем предупреждение о deprecated expo-av
LogBox.ignoreLogs(['[expo-av]: Expo AV has been deprecated']);

// === Опции для записи аудио (iOS/Android) ===
const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: 2, // MPEG_4
    audioEncoder: 3, // AAC
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: 2, // HIGH
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

const GRADIENT_COLORS: [string, string] = ['#F7B7C3', '#B6A4F7'];

// Новый компонент для выбора действия над файлом
function FileActionMenu({ visible, onClose, onAction }: { visible: boolean, onClose: () => void, onAction: (action: string, prompt?: string) => void }) {
  const [customPrompt, setCustomPrompt] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 28, width: 320, shadowColor: '#B6A4F7', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#6A0DAD' }}>Что сделать с файлом?</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { onAction('fix'); onClose(); }}>
            <LinearGradient colors={["#FF6DCB", "#6DDCFF"]} style={styles.actionGradient}>
              <Ionicons name="build-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.actionText}>Исправить ошибки</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { onAction('translate'); onClose(); }}>
            <LinearGradient colors={["#6DDCFF", "#B6A4F7"]} style={styles.actionGradient}>
              <Ionicons name="language-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.actionText}>Перевести</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { onAction('analyze'); onClose(); }}>
            <LinearGradient colors={["#B6A4F7", "#FF6DCB"]} style={styles.actionGradient}>
              <Ionicons name="analytics-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.actionText}>Анализировать</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={{ marginTop: 18, fontSize: 15, color: '#6A0DAD', fontWeight: 'bold' }}>Другое действие:</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#B6A4F7', borderRadius: 12, padding: 10, marginTop: 8, marginBottom: 8, fontSize: 15, backgroundColor: '#f7f7fa' }}
            placeholder="Введите команду..."
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholderTextColor="#B6A4F7"
          />
          <TouchableOpacity onPress={() => { if (customPrompt.trim()) { onAction('custom', customPrompt); onClose(); } }} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
            <Text style={{ color: '#6A0DAD', fontWeight: 'bold', fontSize: 16 }}>Отправить</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 10, right: 14 }}>
            <Ionicons name="close" size={28} color="#B6A4F7" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ChatScreen({ navigation, route }: ChatProps) {
  const { colors } = useAppTheme();

  // Забираем role и language из route.params
  const { role, language } = route.params;

  // === Состояния для Chat ===
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // === Состояния для записи аудио ===
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingCanceled, setRecordingCanceled] = useState(false);
  const [recordingSent, setRecordingSent] = useState(false);
  const [showCancelUI, setShowCancelUI] = useState(false);

  const [recordingDuration, setRecordingDuration] = useState<string>('0:00');
  const recordingStartTime = useRef<number | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // refs для мгновенной проверки жестов PanResponder
  const recordingActiveRef = useRef(false);
  const recordingCanceledRef = useRef(false);
  const recordingSentRef = useRef(false);

  // Audio.Recording ref
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Audio.Sound ref
  const soundRef = useRef<Audio.Sound | null>(null);

  // Состояние для URI проигрываемого аудио (кнопка ▶/⏸)
  const [playingUri, setPlayingUri] = useState<string | null>(null);

  // Мемоизированный headerRight
  const HeaderSettingsButton = useMemo(() => (
    <TouchableOpacity
      style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}
      onPress={() => navigation.navigate('Settings', { role, language })}
    >
      <Ionicons name="settings-outline" size={24} color={colors.text} />
    </TouchableOpacity>
  ), [navigation, colors.text, role, language]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => HeaderSettingsButton,
    });
  }, [navigation, HeaderSettingsButton]);

  // === При монтировании: сразу добавляем приветственное сообщение Lingro ===
  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Привет! Я Lingro, чем могу помочь?',
        createdAt: new Date(),
        user: { _id: 2, name: 'Lingro' },
      },
    ]);
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // ==== PanResponder для записи голосового сообщения ====
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return true;
      },
      onMoveShouldSetPanResponder: () => {
        return true;
      },
      onPanResponderGrant: () => {
        recordingCanceledRef.current = false;
        recordingSentRef.current = false;
        setRecordingCanceled(false);
        setRecordingSent(false);
        setShowCancelUI(false);
        recordingActiveRef.current = true;
        setRecordingActive(true);
        startRecording();
      },
      onPanResponderMove: (_, gestureState) => {
        if (
          gestureState.dx < -50 &&
          recordingActiveRef.current &&
          !recordingCanceledRef.current
        ) {
          recordingCanceledRef.current = true;
          setRecordingCanceled(true);
          setShowCancelUI(true);
          cancelRecording();
        }
        if (
          gestureState.dy < -50 &&
          recordingActiveRef.current &&
          !recordingCanceledRef.current &&
          !recordingSentRef.current
        ) {
          recordingSentRef.current = true;
          setRecordingSent(true);
          setShowCancelUI(false);
          finishRecording();
        }
        if (gestureState.dx < -20 && !recordingCanceledRef.current) {
          setShowCancelUI(true);
        } else if (gestureState.dx > -10 && !recordingCanceledRef.current) {
          setShowCancelUI(false);
        }
      },
      onPanResponderRelease: () => {
        setShowCancelUI(false);
        if (
          recordingActiveRef.current &&
          !recordingCanceledRef.current &&
          !recordingSentRef.current
        ) {
          finishRecording();
        }
        recordingActiveRef.current = false;
        setRecordingActive(false);
      },
    })
  ).current;

  // ==== Функция начала записи аудио ====
  const startRecording = async () => {
    if (recordingRef.current) {
      return;
    }
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        recordingActiveRef.current = false;
        setRecordingActive(false);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(RECORDING_OPTIONS);
      await rec.startAsync();
      recordingRef.current = rec;
      const startTime = Date.now();
      recordingStartTime.current = startTime;
      setRecordingDuration('0:00');
      recordingTimer.current = setInterval(() => {
        if (recordingStartTime.current) {
          const durationMs = Date.now() - recordingStartTime.current;
          const seconds = Math.floor(durationMs / 1000);
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          setRecordingDuration(
            `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
          );
        }
      }, 300);
    } catch (e) {
      alert('Ошибка при начале записи');
      recordingActiveRef.current = false;
      setRecordingActive(false);
    }
  };

  // ==== Функция завершения записи и отправки аудио ====
  const finishRecording = async () => {
    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      const rec = recordingRef.current;
      if (!rec) {
        return;
      }
      const now = Date.now();
      const started = recordingStartTime.current || now;
      const diff = now - started;
      if (diff < 300) {
        return;
      }
      const status = await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      let durationMillis = status.durationMillis ?? 0;
      if (durationMillis === 0 && uri) {
        try {
          const { sound } = await Audio.Sound.createAsync({ uri });
          const soundStatus = await sound.getStatusAsync();
          if (soundStatus.isLoaded) {
            durationMillis = soundStatus.durationMillis ?? 0;
          }
          await sound.unloadAsync();
        } catch (e) {
          console.error('Error getting duration from sound:', e);
        }
      }
      const totalSeconds = Math.floor(durationMillis / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      if (!uri || durationMillis < 700) {
        return;
      }
      const audioMsg: Message = {
        _id: Date.now(),
        createdAt: new Date(),
        user: { _id: 1, name: 'Вы' },
        text: duration,
        audioUri: uri,
        audioDuration: duration,
        waveform: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16) + 8),
      };
      setMessages((prev) => GiftedChat.append(prev, [audioMsg]));
    } catch (e) {
      alert('Ошибка при завершении записи');
    }
  };

  // ==== Функция отмены записи (свайп влево) ====
  const cancelRecording = async () => {
    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      const rec = recordingRef.current;
      if (!rec) {
        return;
      }
      await rec.stopAndUnloadAsync();
      recordingRef.current = null;
    } catch (e) {
      console.error('cancelRecording error:', e);
    }
  };

  // ==== Функция проигрывания голосового сообщения ====
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

  // ==== Вспомогательные функции для «фото-запросов» ====
  function isImageQuery(text: string): boolean {
    const lower = text.trim().toLowerCase();
    const ruTriggers = ['фото', 'картинк', 'изображен', 'фотограф'];
    const enTriggers = ['image', 'photo', 'picture'];
    return (
      ruTriggers.some((w) => lower.includes(w)) ||
      enTriggers.some((w) => lower.includes(w))
    );
  }

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
      /\bпросьба\b/g,
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
      /\bof\b/g,
    ];
    for (const pat of enPatterns) {
      lower = lower.replace(pat, ' ');
    }

    const term = lower.trim().replace(/\s+/g, ' ');
    return term || text.trim();
  }

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

  async function searchImagesDuckDuckGo(query: string): Promise<string[]> {
    try {
      const vqd = await fetchDuckDuckGoVQD(query);
      if (!vqd) throw new Error('Failed to get vqd');
      const apiUrl = `https://duckduckgo.com/i.js?l=ru-ru&o=json&q=${encodeURIComponent(
        query
      )}&vqd=${vqd}`;
      const resp = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json',
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

  // ==== Логика отправки текстового сообщения или «фото-запроса» ====
  const handleSendText = useCallback(async () => {
    if (!text.trim()) {
      return;
    }

    const userMsg: Message = {
      _id: Date.now(),
      text: text.trim(),
      createdAt: new Date(),
      user: { _id: 1, name: 'Вы' },
    };

    setMessages((prev) => GiftedChat.append(prev, [userMsg]));
    const userText = text.trim();
    setText('');
    setIsTyping(true);

    // 1) Если запрос «найди фото …» → используем DuckDuckGo
    if (isImageQuery(userText)) {
      console.log('Image query detected:', userText);
      const queryTerm = extractSearchTerm(userText);
      console.log('Extracted search term:', queryTerm);
      
      if (!queryTerm || queryTerm.length < 3) {
        setMessages((prev) =>
          GiftedChat.append(prev, [
            {
              _id: Date.now() + 1,
              text: 'Пожалуйста, уточните, какое изображение вы ищете.',
              createdAt: new Date(),
              user: { _id: 2, name: 'Lingro' },
            },
          ])
        );
        setIsTyping(false);
        return;
      }

      try {
        const imageUrls = await searchImagesDuckDuckGo(queryTerm);
        console.log('Search results:', imageUrls);
        
        if (imageUrls.length === 0) {
          setMessages((prev) =>
            GiftedChat.append(prev, [
              {
                _id: Date.now() + 1,
                text: `По запросу «${queryTerm}» ничего не найдено. Попробуйте изменить запрос или использовать другие ключевые слова.`,
                createdAt: new Date(),
                user: { _id: 2, name: 'Lingro' },
              },
            ])
          );
        } else {
          const imageMessages: Message[] = imageUrls.map((url, idx) => ({
            _id: Date.now() + 10 + idx,
            createdAt: new Date(),
            user: { _id: 2, name: 'Lingro' },
            text: '',
            image: url,
          }));
          setMessages((prev) => GiftedChat.append(prev, imageMessages));
        }
      } catch (error) {
        console.error('Image search error:', error);
        setMessages((prev) =>
          GiftedChat.append(prev, [
            {
              _id: Date.now() + 1,
              text: 'Произошла ошибка при поиске изображений. Пожалуйста, попробуйте позже.',
              createdAt: new Date(),
              user: { _id: 2, name: 'Lingro' },
            },
          ])
        );
      }
      setIsTyping(false);
      return;
    }

    // 2) Иначе — отправляем текст в OpenAI
    const history = [
      ...messages.map((m) => ({
        role: m.user._id === 1 ? 'user' : 'assistant',
        content: m.text || '',
      })),
      { role: 'user', content: userMsg.text },
    ];

    try {
      let reply: string | null = null;
      for (const model of [MODEL_GPT4, MODEL_FALLBACK]) {
        console.log('Trying model:', model);
        const chatUrl = `${PROXY_URL}/api/chat`;
        const resp = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: history,
            temperature: 0.7,
          }),
        });
        const raw = await resp.text();
        console.log('Chat response:', raw);
        if (!resp.ok) {
          console.error('Chat error:', resp.status, raw);
          continue;
        }
        const data = JSON.parse(raw);
        reply = data.choices?.[0]?.message?.content?.trim() || null;
        if (reply) break;
      }
      if (!reply) throw new Error('No valid response from any model');
      const botMsg: Message = {
        _id: Date.now(),
        text: reply,
        createdAt: new Date(),
        user: { _id: 2, name: 'Lingro' },
      };
      setMessages((prev) => GiftedChat.append(prev, [botMsg]));
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        GiftedChat.append(prev, [
          {
            _id: Date.now(),
            text: 'Ошибка при запросе к OpenAI. Пожалуйста, попробуйте позже.',
            createdAt: new Date(),
            user: { _id: 2, name: 'Lingro' },
          },
        ])
      );
    } finally {
      setIsTyping(false);
    }
  }, [messages, text]);

  // ==== Выбор изображения из галереи и отправка как сообщение ====
  const onPickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Нужно разрешение на доступ к галерее');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    const imgMsg: Message = {
      _id: Date.now(),
      createdAt: new Date(),
      user: { _id: 1, name: 'Вы' },
      text: '',
      image: uri,
    };
    setMessages((prev) => GiftedChat.append(prev, [imgMsg]));
  };

  // ==== Выбор любого файла и отправка как сообщение ====
  const onPickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      });
      if (!res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      const fileUri = asset.uri;
      const fileName = asset.name;
      const fileType = asset.mimeType || 'application/octet-stream';
      // Логируем параметры
      console.log('UPLOAD TO:', API_URL + '/api/file');
      console.log('File params:', { uri: fileUri, name: fileName, type: fileType });
      // Показываем bubble "Загрузка файла..."
      const tempId = Date.now();
      setMessages((prev) => GiftedChat.append(prev, [{
        _id: tempId,
        createdAt: new Date(),
        user: { _id: 1, name: 'Вы' },
        text: '',
        file: {
          name: fileName,
          url: fileUri,
          type: fileType,
          status: 'uploading' as 'uploading',
        },
      }]));
      // Отправка файла на backend
      const uploadRes = await uploadFile({ uri: fileUri, name: fileName, type: fileType });
      // Удаляем bubble "Загрузка..." и добавляем результат
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      // Основной файл
      const fileMsg = {
        _id: Date.now(),
        createdAt: new Date(),
        user: { _id: 1, name: 'Вы' },
        text: '',
        file: {
          name: uploadRes.fileName || fileName,
          url: uploadRes.url,
          type: uploadRes.fileType || fileType,
          status: 'done' as 'done',
          correctedUrl: uploadRes.correctedUrl,
        },
      };
      setMessages((prev) => GiftedChat.append(prev, [fileMsg]));
      // Исправленный файл от GPT
      if (uploadRes.correctedUrl) {
        setMessages((prev) => GiftedChat.append(prev, [{
          _id: Date.now() + 1,
          createdAt: new Date(),
          user: { _id: 2, name: 'Lingro' },
          text: '',
          file: {
            name: 'Исправленный файл',
            url: uploadRes.correctedUrl,
            type: uploadRes.fileType || fileType,
            status: 'done' as 'done',
          },
        }]));
      }
      // Текстовый ответ от GPT
      if (uploadRes.text) {
        setMessages((prev) => GiftedChat.append(prev, [{
          _id: Date.now() + 2,
          createdAt: new Date(),
          user: { _id: 2, name: 'Lingro' },
          text: uploadRes.text,
        }]));
      }
    } catch (e) {
      setMessages((prev) => GiftedChat.append(prev, [{
        _id: Date.now(),
        createdAt: new Date(),
        user: { _id: 1, name: 'Вы' },
        text: 'Ошибка при отправке файла',
      }]));
    }
  };

  // ==== Рендер одного «пузырька» сообщения (Bubble) ====
  const renderBubble = (props: any) => {
    const currentMessage = props.currentMessage as Message;

    // Если это голосовое сообщение (audioUri есть) — рендерим ▶/⏸ + длительность
    if (currentMessage.audioUri) {
      const isPlaying = playingUri === currentMessage.audioUri;
      const waveform = currentMessage.waveform || Array.from({ length: 32 }, () => 12);
      // Динамическая ширина bubble
      const minWidth = 60;
      const maxWidth = 320;
      const maxDuration = 60; // сек
      let durationSec = 0;
      if (currentMessage.audioDuration) {
        const [min, sec] = currentMessage.audioDuration.split(':').map(Number);
        durationSec = (min || 0) * 60 + (sec || 0);
      }
      const bubbleWidth = Math.round(
        minWidth + Math.min(durationSec, maxDuration) / maxDuration * (maxWidth - minWidth)
      );
      return (
        <View
          style={[
            styles.voiceMessageBubble,
            props.position === 'right'
              ? styles.voiceMessageBubbleRight
              : styles.voiceMessageBubbleLeft,
            { width: bubbleWidth, maxWidth: '75%', marginHorizontal: 4 },
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
          {/* Waveform */}
          <View style={styles.waveformContainer}>
            {waveform.map((h, i) => (
              <View
                key={i}
                style={{
                  width: 2,
                  height: h,
                  marginHorizontal: 0.5,
                  borderRadius: 1,
                  backgroundColor: props.position === 'right' ? '#a259ff' : '#bbb',
                  opacity: 0.7 + 0.3 * (h / 24),
                  alignSelf: 'flex-end',
                }}
              />
            ))}
          </View>
          <Text style={styles.voiceMessageText}>
            {currentMessage.audioDuration}
          </Text>
        </View>
      );
    }

    // Если это файловое сообщение (file есть) — рендерим иконку и название файла
    if (currentMessage.file?.status === 'uploading') {
      return (
        <View style={{ backgroundColor: '#fff', borderRadius: 20, margin: 8, padding: 16, shadowColor: '#B6A4F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2, maxWidth: '75%', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#B6A4F7" style={{ marginBottom: 8 }} />
          <Text style={{ color: '#B6A4F7', fontSize: 15 }}>Загрузка файла...</Text>
        </View>
      );
    }
    if (currentMessage.file?.type?.startsWith('image/')) {
      return (
        <View style={{ backgroundColor: '#fff', borderRadius: 20, margin: 8, padding: 8, shadowColor: '#B6A4F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2, maxWidth: '75%', alignItems: 'center' }}>
          <Image source={{ uri: currentMessage.file.url }} style={{ width: 180, height: 120, borderRadius: 14, marginBottom: 8 }} resizeMode="cover" />
          <Text style={{ color: '#222', fontSize: 15, marginBottom: 4 }}>{currentMessage.file.name}</Text>
          <TouchableOpacity onPress={() => currentMessage.file?.url && Linking.openURL(String(currentMessage.file.url))}>
            <Text style={{ color: '#6A0DAD', fontSize: 15, textDecorationLine: 'underline' }}>Открыть изображение</Text>
          </TouchableOpacity>
          {currentMessage.file?.correctedUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(String(currentMessage.file?.correctedUrl))} style={{ marginTop: 8 }}>
              <Text style={{ color: '#B6A4F7', fontSize: 15, textDecorationLine: 'underline' }}>Исправленное изображение</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (currentMessage.file?.url && currentMessage.file?.name) {
      return (
        <View style={{ backgroundColor: '#fff', borderRadius: 20, margin: 8, padding: 16, shadowColor: '#B6A4F7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 2, maxWidth: '75%' }}>
          <Ionicons name="document-outline" size={28} color="#B6A4F7" style={{ marginBottom: 8 }} />
          <Text style={{ color: '#222', fontSize: 16, marginBottom: 4 }}>{currentMessage.file?.name}</Text>
          <TouchableOpacity onPress={() => currentMessage.file?.url && Linking.openURL(String(currentMessage.file?.url))}>
            <Text style={{ color: '#6A0DAD', fontSize: 15, textDecorationLine: 'underline' }}>Открыть файл</Text>
          </TouchableOpacity>
          {currentMessage.file?.correctedUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(String(currentMessage.file?.correctedUrl))} style={{ marginTop: 8 }}>
              <Text style={{ color: '#B6A4F7', fontSize: 15, textDecorationLine: 'underline' }}>Исправленный файл</Text>
            </TouchableOpacity>
          )}
          {/* Кнопка действия с файлом для любого типа файла */}
          <TouchableOpacity
            onPress={() => setFileActionMenu({ visible: true, fileId: currentMessage.file!.url.split('/').pop() })}
            style={{ marginTop: 8 }}
          >
            <Text style={{ color: '#6A0DAD', fontSize: 15, textDecorationLine: 'underline' }}>Действие с файлом</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Одинаковый стиль для всех bubble
    return (
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        marginVertical: 6,
        marginHorizontal: 8,
        maxWidth: '75%',
        shadowColor: '#B6A4F7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 2
      }}>
        <Text style={{ color: '#222', fontSize: 17, padding: 16 }}>{currentMessage.text}</Text>
      </View>
    );
  };

  const [fileActionMenu, setFileActionMenu] = useState<{ visible: boolean, fileId?: string } | null>(null);

  // Функция для отправки действия на backend
  const handleFileAction = async (fileId: string, action: string, prompt?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/file/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, action: action === 'custom' ? 'analyze' : action, prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Показываем детальное сообщение об ошибке
        const errorMessage = data.details || data.error || 'Ошибка при обработке файла';
        setMessages((prev) => GiftedChat.append(prev, [{
          _id: Date.now(),
          createdAt: new Date(),
          user: { _id: 2, name: 'Lingro' },
          text: errorMessage,
        }]));
        return;
      }

      // Добавляем результат в чат
      if (data.imageUrl) {
        // Для сгенерированных изображений
        setMessages((prev) => GiftedChat.append(prev, [{
          _id: Date.now(),
          createdAt: new Date(),
          user: { _id: 2, name: 'Lingro' },
          text: '',
          image: data.imageUrl,
        }]));
      } else if (action === 'fix' && data.correctedUrl) {
        setMessages((prev) => GiftedChat.append(prev, [{
          _id: Date.now(),
          createdAt: new Date(),
          user: { _id: 2, name: 'Lingro' },
          text: '',
          file: { name: 'Исправленный файл', url: data.correctedUrl, type: 'text/plain', status: 'done' },
        }]));
      } else if (action === 'translate' && data.translatedUrl) {
        setMessages((prev) => GiftedChat.append(prev, [{
          _id: Date.now(),
          createdAt: new Date(),
          user: { _id: 2, name: 'Lingro' },
          text: '',
          file: { name: 'Переведённый файл', url: data.translatedUrl, type: 'text/plain', status: 'done' },
        }]));
      }
      if (data.text) {
        setMessages((prev) => GiftedChat.append(prev, [{
          _id: Date.now() + 1,
          createdAt: new Date(),
          user: { _id: 2, name: 'Lingro' },
          text: data.text,
        }]));
      }
      if (data.analysis) {
        setMessages((prev) => GiftedChat.append(prev, [{
          _id: Date.now() + 2,
          createdAt: new Date(),
          user: { _id: 2, name: 'Lingro' },
          text: data.analysis,
        }]));
      }
    } catch (e: any) {
      Alert.alert('Ошибка', e.message || 'Ошибка при обработке файла');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <LinearGradient colors={GRADIENT_COLORS} style={{ flex: 1 }}>
        <GiftedChat
          messages={messages}
          user={{ _id: 1, name: 'Вы' }}
          renderBubble={renderBubble}
          isTyping={isTyping}
          showUserAvatar={false}
          bottomOffset={Platform.OS === 'ios' ? 100 : 80}
          listViewProps={{ keyboardDismissMode: 'on-drag' } as any}
          text={text}
          onInputTextChanged={setText}
          renderInputToolbar={() => (
            <View style={[styles.inputToolbar, { borderTopWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0, justifyContent: 'space-between' }]}>
              <TouchableOpacity onPress={onPickImage} style={{ marginHorizontal: 8 }}>
                <Ionicons
                  name="attach-outline"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onPickDocument} style={{ marginHorizontal: 8 }}>
                <Ionicons name="document-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: '#fff',
                    borderColor: 'transparent',
                    color: colors.text,
                    shadowColor: '#B6A4F7',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2
                  },
                ]}
                placeholder="Напишите сообщение..."
                placeholderTextColor={colors.muted}
                value={text}
                onChangeText={setText}
                editable={!recordingActive}
              />
              {recordingActive && !recordingCanceled && (
                <Text
                  style={[styles.recordingTimer, { color: colors.primary }]}
                >
                  {recordingDuration}
                </Text>
              )}
              <Animated.View
                style={[styles.recordButtonContainer, { marginLeft: 8, marginRight: 0 }]}
                {...panResponder.panHandlers}
              >
                <Ionicons name="mic-outline" size={24} color="#fff" />
              </Animated.View>
              {showCancelUI && (
                <View style={styles.cancelButtonContainer}>
                  <Ionicons name="close" size={28} color="#fff" />
                </View>
              )}
              <TouchableOpacity
                onPress={handleSendText}
                style={[styles.sendButton, { backgroundColor: colors.primary, marginLeft: 8 }]}
              >
                <Ionicons name="send" size={24} color={colors.card} />
              </TouchableOpacity>
            </View>
          )}
        />
      </LinearGradient>
      <FileActionMenu
        visible={!!fileActionMenu?.visible}
        onClose={() => setFileActionMenu(null)}
        onAction={(action, prompt) => fileActionMenu?.fileId && handleFileAction(fileActionMenu.fileId, action, prompt)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    padding: 0,
    paddingHorizontal: 0,
    justifyContent: 'space-between',
  },

  textInput: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    fontSize: 16,
    maxHeight: 100,
  },

  sendButton: {
    marginLeft: 8,
    padding: 10,
    borderRadius: 20,
  },

  recordButtonContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#6A0DAD',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 0,
  },

  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 6,
    height: 24,
    minWidth: 70,
    flex: 1,
  },

  voiceMessageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    marginVertical: 2,
    maxWidth: '75%',
    marginHorizontal: 4,
  },

  voiceMessageBubbleRight: {
    backgroundColor: '#6A0DAD',
    alignSelf: 'flex-end',
  },

  voiceMessageBubbleLeft: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },

  playButton: {
    marginRight: 8,
  },

  voiceMessageText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 6,
  },

  recordingTimer: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },

  headerButton: {
    marginRight: 16,
  },

  cancelButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  actionBtn: {
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#B6A4F7',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  actionText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
});
