// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  navigation: any;
};

const GRADIENT_COLORS: [string, string] = ['#F7B7C3', '#B6A4F7'];

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    // через 2 секунды переходим на SignIn
    const timer = setTimeout(() => {
      navigation.replace('SignIn');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <Image
          source={require('../../assets/splash.png')}
          style={styles.splash}
          resizeMode="contain"
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
    alignItems: 'center'
  },
  splash: {
    width: 220,
    height: 220
  }
});
