// src/screens/ChatScreen.tsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
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
} from 'react-native';
import { GiftedChat, Bubble, IMessage } from 'react-native-gifted-chat';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useAppTheme } from '../context/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

// Определяем пропсы навигатора для ChatScreen
type ChatProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Расширяем IMessage, чтобы добавить поля audioUri и audioDuration
type Message = IMessage & {
  audioUri?: string;
  audioDuration?: string;
};

const {
  OPENAI_API_KEY,
  PROXY_URL,
  MODEL_GPT4,
  MODEL_FALLBACK,
} = Constants.expoConfig!.extra as Record<string, string>;

// Подавляем предупреждение о deprecated expo-av
LogBox.ignoreLogs(['[expo-av]: Expo AV has been deprecated']);

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

  // Анимация для кнопки микрофона
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ==== Вставляем кнопку «шестерёнка» в header ====
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            // При переходе в Settings передаём role и language
            navigation.navigate('Settings', { role, language })
          }
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
      // Если хотите, можно переопределить заголовок:
      // headerTitleAlign: 'center',
      // headerStyle: { backgroundColor: colors.background },
      // headerTintColor: colors.text,
    });
  }, [navigation, colors.text, role, language]);
  // ================================================

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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        // Когда палец касается кнопки: сбрасываем флаги и запускаем запись
        recordingCanceledRef.current = false;
        recordingSentRef.current = false;
        setRecordingCanceled(false);
        setRecordingSent(false);

        recordingActiveRef.current = true;
        setRecordingActive(true);

        Animated.spring(scaleAnim, {
          toValue: 1.4,
          useNativeDriver: true,
        }).start();
        startRecording();
      },

      onPanResponderMove: (_, gestureState) => {
        // Если свайп влево более чем на 50px → отменяем
        if (
          gestureState.dx < -50 &&
          recordingActiveRef.current &&
          !recordingCanceledRef.current
        ) {
          recordingCanceledRef.current = true;
          setRecordingCanceled(true);
          cancelRecording();
        }
        // Если свайп вверх более чем на 50px → досрочно отправляем (если ещё не отправляли)
        if (
          gestureState.dy < -50 &&
          recordingActiveRef.current &&
          !recordingCanceledRef.current &&
          !recordingSentRef.current
        ) {
          recordingSentRef.current = true;
          setRecordingSent(true);
          finishRecording();
        }
      },

      onPanResponderRelease: () => {
        // Когда палец отпускает кнопку: возвращаем анимацию
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        // Если всё ещё активна запись и не было отмены/отправки свайпом → отправляем
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
      console.warn('Recording already in progress');
      return;
    }
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Нужно разрешение на запись аудио');
        recordingActiveRef.current = false;
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
      recordingStartTime.current = startTime;
      setRecordingDuration('0:00');

      // Запускаем таймер, чтобы обновлять длительность записи
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
      console.error('startRecording error:', e);
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
      if (!rec) return;

      // Останавливаем и выгружаем запись, получаем статус
      const status = await rec.stopAndUnloadAsync();
      const uri = rec.getURI()!;
      recordingRef.current = null;

      // Форматируем длительность «M:SS»
      const durationMillis = status.durationMillis ?? 0;
      const totalSeconds = Math.floor(durationMillis / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
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

  // ==== Функция отмены записи (свайп влево) ====
  const cancelRecording = async () => {
    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      const rec = recordingRef.current;
      if (!rec) return;
      // Останавливаем и выгружаем запись без отправки сообщения
      await rec.stopAndUnloadAsync();
      recordingRef.current = null;
    } catch {
      // Игнорируем любые ошибки при отмене
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
      const queryTerm = extractSearchTerm(userText);
      const imageUrls = await searchImagesDuckDuckGo(queryTerm);
      if (imageUrls.length === 0) {
        setMessages((prev) =>
          GiftedChat.append(prev, [
            {
              _id: Date.now() + 1,
              text: `По запросу «${queryTerm}» ничего не найдено.`,
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
        user: { _id: 2, name: 'Lingro' },
      };
      setMessages((prev) => GiftedChat.append(prev, [botMsg]));
    } catch {
      setMessages((prev) =>
        GiftedChat.append(prev, [
          {
            _id: Date.now(),
            text: 'Ошибка при запросе к OpenAI.',
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

  // ==== Рендер одного «пузырька» сообщения (Bubble) ====
  const renderBubble = (props: any) => {
    const currentMessage = props.currentMessage as Message;

    // Если это голосовое сообщение (audioUri есть) — рендерим ▶/⏸ + длительность
    if (currentMessage.audioUri) {
      const isPlaying = playingUri === currentMessage.audioUri;
      return (
        <View
          style={[
            styles.voiceMessageBubble,
            props.position === 'right'
              ? styles.voiceMessageBubbleRight
              : styles.voiceMessageBubbleLeft,
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

    // Обычный текстовый Bubble
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: '#f0f0f0',
            borderColor: '#ccc',
            borderWidth: 1,
          },
          right: { backgroundColor: colors.primary },
        }}
        textStyle={{
          left: { color: colors.text },
          right: { color: '#fff' },
        }}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // Увеличили offset, чтобы учесть высоту статус-бара и header-а
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
      >
        <GiftedChat
          messages={messages}
          user={{ _id: 1, name: 'Вы' }}
          renderBubble={renderBubble}
          isTyping={isTyping}
          showUserAvatar={false}
          // Увеличили bottomOffset, чтобы поле ввода поднималось выше подсказок клавиатуры
          bottomOffset={Platform.OS === 'ios' ? 100 : 80}
          listViewProps={{ keyboardDismissMode: 'on-drag' } as any}
          text={text}
          onInputTextChanged={setText}
          renderInputToolbar={() => (
            <View style={styles.inputToolbar}>
              {/* Кнопка «прикрепить изображение» */}
              <TouchableOpacity onPress={onPickImage}>
                <Ionicons
                  name="attach-outline"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>

              {/* Сам текстовый input */}
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Напишите сообщение..."
                placeholderTextColor={colors.muted}
                value={text}
                onChangeText={setText}
                editable={!recordingActive} // блокировка ввода при записи
              />

              {/* Если идёт запись и не отменена, показываем таймер */}
              {recordingActive && !recordingCanceled && (
                <Text
                  style={[styles.recordingTimer, { color: colors.primary }]}
                >
                  {recordingDuration}
                </Text>
              )}

              {/* Кнопка микрофона для записи */}
              <Animated.View
                style={[
                  styles.recordButtonContainer,
                  { transform: [{ scale: scaleAnim }] },
                ]}
                {...panResponder.panHandlers}
              >
                <Ionicons name="mic-outline" size={20} color="#fff" />
              </Animated.View>

              {/* Кнопка «отправить текст» */}
              <TouchableOpacity
                onPress={handleSendText}
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
    padding: 8,
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
    width: 40,
    height: 40,
    backgroundColor: '#6A0DAD',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  voiceMessageBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    marginVertical: 2,
    maxWidth: '75%',
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
  },

  recordingTimer: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },

  headerButton: {
    // Вместо marginRight добавили paddingRight, чтобы не обрезалась иконка
    paddingRight: 20,
  },
});
