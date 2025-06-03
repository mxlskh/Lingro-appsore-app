import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useAppTheme } from '../context/ThemeContext';

const GRADIENT_COLORS: [string, string] = ['#F7B7C3', '#B6A4F7'];

export default function SignUpScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'SignUp'>) {
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <LinearGradient colors={GRADIENT_COLORS} style={styles.gradient}>
          <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
          <View style={styles.container}>
            <Text style={styles.logo}>Lingro</Text>
            <Text style={styles.title}>Новая учётная запись</Text>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#B6A4F7"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Пароль"
                placeholderTextColor="#B6A4F7"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.button} onPress={() => navigation.replace('GetStarted')}>
                <Text style={styles.buttonText}>Зарегистрироваться</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Уже есть аккаунт? Войти</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 0,
    marginTop: 0,
    letterSpacing: 1.5,
    ...Platform.select({
      ios: { fontFamily: 'AvenirNext-Heavy' },
      android: { fontFamily: 'sans-serif-black' }
    })
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center'
  },
  form: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24
  },
  input: {
    width: 280,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    shadowColor: '#B6A4F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  },
  button: {
    width: 280,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B6A4F7',
    shadowColor: '#B6A4F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 0
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  link: {
    color: '#fff',
    fontSize: 15,
    marginTop: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
    opacity: 0.9
  }
});
