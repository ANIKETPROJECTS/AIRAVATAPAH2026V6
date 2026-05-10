import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { Lang } from '../types';

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
      <View style={styles.topBand} />
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <Text style={styles.logoEmoji}>🌾</Text>
              </View>
            </View>
          </View>
          <Text style={styles.appNameGold}>कृषी सुविधा</Text>
          <Text style={styles.appNameSub}>Krushi Suvidha</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>{t('tagline')}</Text>
          <View style={styles.govBadge}>
            <Text style={styles.govBadgeText}>🏛️  Govt. of Maharashtra  •  Agriculture Dept.</Text>
          </View>
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

          <View style={styles.featureRow}>
            {['🔒 Secure', '📱 OTP Login', '🤖 AI OCR'].map((f) => (
              <View key={f} style={styles.featureChip}>
                <Text style={styles.featureChipText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  topBand: { height: 6, backgroundColor: COLORS.gold },
  container: {
    flex: 1, paddingHorizontal: 28,
    justifyContent: 'space-between', paddingVertical: 36,
    backgroundColor: COLORS.primaryDark,
  },
  hero: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  logoWrap: { marginBottom: 20 },
  logoOuter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.gold + '60',
  },
  logoInner: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.md,
  },
  logoEmoji: { fontSize: 42 },
  appNameGold: {
    fontSize: FONT_SIZE['3xl'], fontWeight: '800',
    color: COLORS.gold, letterSpacing: 0.5, marginBottom: 4,
  },
  appNameSub: {
    fontSize: FONT_SIZE.lg, fontWeight: '600',
    color: 'rgba(255,255,255,0.55)', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 18,
  },
  divider: { width: 48, height: 2, backgroundColor: COLORS.gold + '80', borderRadius: 1, marginBottom: 18 },
  tagline: {
    fontSize: FONT_SIZE.base, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 24, maxWidth: 260, marginBottom: 20,
  },
  govBadge: {
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: RADIUS.full,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  govBadgeText: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  langSection: { marginBottom: 28 },
  langTitle: {
    fontSize: FONT_SIZE.xs, fontWeight: '700', color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  langRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  langBtn: {
    paddingHorizontal: 22, paddingVertical: 11, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  langBtnActive: { borderColor: COLORS.gold, backgroundColor: COLORS.gold + '22' },
  langBtnText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  langBtnTextActive: { color: COLORS.gold, fontWeight: '800' },
  footer: { gap: 16 },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 18, alignItems: 'center', ...SHADOW.md,
    borderWidth: 1, borderColor: COLORS.primaryLight + '40',
  },
  primaryBtnText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '800', letterSpacing: 0.5 },
  featureRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  featureChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  featureChipText: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
});
