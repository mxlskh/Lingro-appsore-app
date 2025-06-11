import * as Localization from 'expo-localization';
import i18n from 'i18n-js';

// @ts-ignore
i18n.defaultLocale = 'en';
// @ts-ignore
i18n.translations = {
  en: {
    welcome: 'Welcome!',
    get_started: 'Let\'s get started',
    personalization: 'Personalization',
    choose_app_language: 'Choose app language',
    choose_tts_voice: 'Choose TTS voice',
    continue: 'Continue',
    you_can_change_later: 'You can change these settings later in Settings.',
    role_teacher: 'Teacher',
    role_student: 'Student',
    select_role: 'Who are you?',
    select_learning_language: 'Choose learning language',
    select_interface_language: 'Change app language',
    select_voice: 'Change TTS voice',
    settings: 'Settings',
    change_role: 'Change role',
    change_learning_language: 'Change learning language',
    change_app_language: 'Change app language',
    change_voice: 'Change TTS voice',
    dark_theme: 'Dark theme',
    about: 'About',
    start_journey: 'Let\'s start our journey into the world of languages!'
  },
  ru: {
    welcome: 'Добро пожаловать!',
    get_started: 'Давай по порядку',
    personalization: 'Персонализация',
    choose_app_language: 'Выберите язык приложения',
    choose_tts_voice: 'Выберите голос для озвучки',
    continue: 'Продолжить',
    you_can_change_later: 'Вы сможете изменить эти настройки позже в разделе "Настройки".',
    role_teacher: 'Преподаватель',
    role_student: 'Ученик',
    select_role: 'Кто вы?',
    select_learning_language: 'Выберите язык изучения',
    select_interface_language: 'Изменить язык приложения',
    select_voice: 'Изменить голос озвучки',
    settings: 'Настройки',
    change_role: 'Изменить роль',
    change_learning_language: 'Изменить язык изучения',
    change_app_language: 'Изменить язык приложения',
    change_voice: 'Изменить голос озвучки',
    dark_theme: 'Тёмная тема',
    about: 'О разработчиках',
    start_journey: 'Начнём наше путешествие в мир языков!'
  }
};
// @ts-ignore
i18n.locale = Localization.locale.split('-')[0];
// @ts-ignore
i18n.fallbacks = true;

// @ts-ignore
export const t = (key: string, config?: any) => i18n.t(key, config);
// @ts-ignore
export const setAppLanguage = (lang: string) => { i18n.locale = lang; }; 