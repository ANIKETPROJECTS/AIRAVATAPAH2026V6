import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { state } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = /^\d{10}$/.test(mobile);

  async function handleSend() {
    if (!isValid) return;
    setLoading(true);
    try {
      const result = await api.sendOtp(mobile);
      navigation.navigate('Otp', { mobile, devOtp: result.otp });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>कृषी सुविधा</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Text style={styles.iconEmoji}>📱</Text>
            </View>
            <Text style={styles.title}>{t('mobileNumber')}</Text>
            <Text style={styles.subtitle}>{t('enterMobile')}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefix}>🇮🇳  +91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={(v) => setMobile(v.replace(/\D/g, ''))}
                onSubmitEditing={handleSend}
                returnKeyType="done"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
            onPress={handleSend}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>{t('sendOtp')}  →</Text>}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>🔒</Text>
            <Text style={styles.infoText}>
              Your mobile number is used only for OTP verification and linked to your farmer profile on कृषी सुविधा.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZE.base, fontWeight: '600' },
  topBarTitle: { fontSize: FONT_SIZE.base, fontWeight: '800', color: COLORS.gold },
  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 36 },
  iconBox: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 2, borderColor: COLORS.primaryLight, ...SHADOW.sm,
  },
  iconEmoji: { fontSize: 36 },
  title: { fontSize: FONT_SIZE['2xl'], fontWeight: '800', color: COLORS.primaryDark, marginBottom: 6 },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    marginBottom: 20, borderWidth: 2, borderColor: COLORS.border, ...SHADOW.sm,
    overflow: 'hidden',
  },
  cardLabel: {
    fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.primary,
    textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  prefixBox: {
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: COLORS.primaryBg, borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  prefix: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.primaryDark },
  input: {
    flex: 1, fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text,
    paddingVertical: 14, paddingHorizontal: 16, letterSpacing: 2,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 18, alignItems: 'center', ...SHADOW.md,
  },
  btnDisabled: { backgroundColor: COLORS.textMuted + '80' },
  btnText: { color: COLORS.white, fontSize: FONT_SIZE.lg, fontWeight: '800' },
  infoBox: {
    marginTop: 24, padding: 16, backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 18, marginTop: 1 },
  infoText: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.primaryMid, lineHeight: 20 },
});
