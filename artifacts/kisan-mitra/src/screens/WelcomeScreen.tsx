import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, T } from '../constants';
import { Lang } from '../types';

import GovtIndia from '../../assets/logo-govt-india.svg';
import SealMaharashtra from '../../assets/logo-seal-maharashtra.svg';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'> };

const LANGS: { id: Lang; native: string }[] = [
  { id: 'en', native: 'English' },
  { id: 'hi', native: 'हिंदी' },
  { id: 'mr', native: 'मराठी' },
];

export default function WelcomeScreen({ navigation }: Props) {
  const { state, setLang } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topLogosBar}>
        <GovtIndia width={160} height={72} />
        <View style={styles.logoDivider} />
        <Image
          source={require('../../assets/logo-dept-agriculture.png')}
          style={styles.deptLogo}
          resizeMode="contain"
        />
        <View style={styles.logoDivider} />
        <SealMaharashtra width={80} height={80} />
      </View>

      <View style={styles.separator} />

      <View style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={require('../../assets/logo-krushi-new.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.langSection}>
          <Text style={styles.langTitle}>{t('selectLang')}</Text>
          <View style={styles.langRow}>
            {LANGS.map((l) => (
              <TouchableOpacity
                key={l.id}
                onPress={() => setLang(l.id)}
                style={[styles.langBtn, state.lang === l.id && styles.langBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.langBtnText, state.lang === l.id && styles.langBtnTextActive]}>
                  {l.native}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{t('getStarted')}  →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: '#FFFFFF',
  },
  topLogosBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  logoDivider: {
    width: 1, height: 60, backgroundColor: '#E5E7EB',
  },
  deptLogo: {
    width: 80, height: 80,
  },
  separator: {
    height: 1, backgroundColor: '#E5E7EB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 36,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  brandLogo: {
    width: '100%',
    height: 300,
  },
  langSection: {
    marginBottom: 24,
  },
  langTitle: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  langBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  langBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  langBtnText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#000000',
  },
  langBtnTextActive: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {},
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
