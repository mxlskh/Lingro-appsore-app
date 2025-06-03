// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Spacing, FontSizes } from '../theme';

type Props = {
  navigation: any;
};

export default function SplashScreen({ navigation }: Props) {
  const { colors } = useAppTheme();

  useEffect(() => {
    // через 2 секунды переходим на SignIn
    const timer = setTimeout(() => {
      navigation.replace('SignIn');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* логотип приложения */}
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {/* название */}
      <Text style={[styles.text, { color: colors.primary }]}>Lingro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg
  },
  text: {
    fontSize: FontSizes.xl * 1.5,
    fontWeight: '800',
    ...Platform.select({
      ios:   { fontFamily: 'AvenirNext-Heavy' },
      android: { fontFamily: 'sans-serif-black' }
    })
  }
});
