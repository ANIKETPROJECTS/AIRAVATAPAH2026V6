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
        <GovtIndia width={56} height={56} />
        <View style={styles.logoDivider} />
        <SealMaharashtra width={56} height={56} />
        <View style={styles.logoDivider} />
        <Image
          source={require('../../assets/logo-dept-agriculture.png')}
          style={styles.deptLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.separator} />

      <View style={styles.container}>
        <View style={styles.hero}>
          <Image
            source={require('../../assets/logo-krushi-suvidha.png')}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 20,
    backgroundColor: '#FFFFFF',
  },
  logoDivider: {
    width: 1, height: 44, backgroundColor: '#E5E7EB',
  },
  deptLogo: {
    width: 56, height: 56,
  },
  separator: {
    height: 1, backgroundColor: '#E5E7EB',
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 36,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  brandLogo: {
    width: 300,
    height: 180,
  },
  langSection: {
    marginBottom: 28,
  },
  langTitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 14,
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
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  langBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#DCFCE7',
  },
  langBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6B7280',
  },
  langBtnTextActive: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.primary,
  },
  footer: {},
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },
});
