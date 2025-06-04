// app.config.js

import 'dotenv/config';

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('BACKEND_URL_PROD:', process.env.BACKEND_URL_PROD);

export default {
  expo: {
    name: "Lingro",
    slug: "lingro",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/logo.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SUPABASE_URL:      process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      PROXY_URL:         process.env.PROXY_URL,
      MODEL_GPT4:        process.env.MODEL_GPT4,
      MODEL_FALLBACK:    process.env.MODEL_FALLBACK,
      server: {
        url: process.env.BACKEND_URL_PROD // всегда Railway backend
      }
    }
  }
};
