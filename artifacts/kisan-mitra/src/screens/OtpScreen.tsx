import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { RADIUS, T } from '../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Otp'>;
  route: RouteProp<RootStackParamList, 'Otp'>;
};

const OTP_TTL = 300;
const OTP_LENGTH = 6;

export default function OtpScreen({ navigation, route }: Props) {
  const { state, login } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const { mobile, devOtp: initialDevOtp } = route.params;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(OTP_TTL);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(initialDevOtp ?? null);
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  const canResend = timer === 0;
  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  function handleDigitChange(val: string, idx: number) {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      const spread = clean.slice(0, OTP_LENGTH).split('');
      const next = [...digits];
      spread.forEach((d, i) => { if (idx + i < OTP_LENGTH) next[idx + i] = d; });
      setDigits(next);
      const focusIdx = Math.min(idx + spread.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...digits];
    next[idx] = clean;
    setDigits(next);
    if (clean && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  }

  function handleKeyPress(e: any, idx: number) {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function fillDevOtp() {
    if (!devOtp) return;
    const spread = devOtp.slice(0, OTP_LENGTH).split('');
    setDigits(spread);
  }

  async function handleVerify() {
    if (!isComplete) return;
    setLoading(true);
    try {
      const result = await api.verifyOtp(mobile, otp);
      if (!result.success) throw new Error('Invalid OTP');
      await login(result.token, mobile, result.farmer);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    setResending(true);
    try {
      const result = await api.sendOtp(mobile);
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimer(OTP_TTL);
      if (result.otp) setDevOtp(result.otp);
      inputRefs.current[0]?.focus();
      Alert.alert('OTP Sent', 'A new OTP has been sent to your mobile number.');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerLogoWrap}>
          <Image
            source={require('../../assets/brand-logo-new.png')}
            style={styles.headerLogo}
          />
        </View>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <View style={styles.container}>

          <View style={styles.header}>
            <Image
              source={require('../../assets/icon-otp.png')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
            <Text style={styles.title}>OTP पडताळणी</Text>
            <Text style={styles.titleEn}>Enter 6-Digit OTP</Text>
            <Text style={styles.subtitle}>
              खालील नंबरवर OTP पाठवला आहे{'\n'}
              <Text style={styles.mobileText}>+91 {mobile}</Text>
            </Text>
          </View>

          {devOtp && (
            <TouchableOpacity style={styles.devBanner} onPress={fillDevOtp} activeOpacity={0.8}>
              <Text style={styles.devText}>
                🔧 Dev mode — OTP: <Text style={styles.devOtp}>{devOtp}</Text>  (tap to fill)
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.otpSection}>
            <Text style={styles.otpLabel}>6-अंकी OTP टाका</Text>
            <View style={styles.otpBoxRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputRefs.current[i] = r; }}
                  style={[styles.otpBox, d ? styles.otpBoxFilled : null]}
                  value={d}
                  onChangeText={(v) => handleDigitChange(v, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={i === 0}
                  selectTextOnFocus
                />
              ))}
            </View>
            <Text style={styles.otpHint}>{digits.filter(Boolean).length} of 6 digits entered</Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, (!isComplete || loading) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={!isComplete || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.btnText}>पडताळा व पुढे जा  →</Text>}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendBtn}>
                <Text style={styles.resendText}>{resending ? '...' : 'OTP पुन्हा पाठवा'}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.timerBox}>
                <Text style={styles.timerLabel}>OTP पुन्हा पाठवा — </Text>
                <Text style={styles.timerValue}>{mins}:{String(secs).padStart(2, '0')}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoTitleRow}>
              <Image
                source={require('../../assets/icon-info2.png')}
                style={styles.infoTitleIcon}
                resizeMode="contain"
              />
              <Text style={styles.infoTitle}>महत्त्वाची माहिती</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>OTP फक्त 5 मिनिटांसाठी वैध आहे</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>SMS इनबॉक्स तपासा — स्पॅम फोल्डर देखील</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>OTP कोणाशीही शेअर करू नका</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>समस्या असल्यास मागे जाऊन नंबर पुन्हा टाका</Text>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  backBtnPlaceholder: { width: 36 },
  backArrow: { fontSize: 22, color: '#14532D', fontWeight: '400' },
  headerLogoWrap: { width: 220, height: 74, overflow: 'hidden' },
  headerLogo: { width: 220, height: 220, marginTop: -71 },

  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 32 },

  header: { alignItems: 'center', marginBottom: 16 },
  headerIcon: { width: 90, height: 90, marginBottom: 10 },
  title: {
    fontSize: 24, fontFamily: 'Poppins', fontWeight: '600',
    color: '#000000', marginBottom: 2,
  },
  titleEn: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    color: '#000000', marginBottom: 6,
  },
  subtitle: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    color: '#000000', textAlign: 'center', lineHeight: 22,
  },
  mobileText: {
    fontFamily: 'Poppins', fontWeight: '600', color: '#000000',
  },

  devBanner: {
    backgroundColor: '#FEF9C3', borderRadius: 10, padding: 12,
    marginBottom: 14, borderWidth: 1, borderColor: '#FDE047',
  },
  devText: { fontSize: 13, fontFamily: 'Poppins', fontWeight: '400', color: '#713F12', textAlign: 'center' },
  devOtp: { fontFamily: 'Poppins', fontWeight: '700', letterSpacing: 3 },

  otpSection: { marginBottom: 20 },
  otpLabel: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '500',
    color: '#000000', marginBottom: 14, letterSpacing: 0.3,
  },
  otpBoxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  otpBox: {
    width: 44,
    height: 52,
    flexShrink: 0,
    flexGrow: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#16A34A',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  otpHint: {
    fontSize: 11, fontFamily: 'Poppins', fontWeight: '400',
    color: '#6B7280', marginTop: 8, textAlign: 'right',
  },

  btn: {
    backgroundColor: '#16A34A', borderRadius: RADIUS.full,
    paddingVertical: 17, alignItems: 'center', marginBottom: 14,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  btnText: {
    color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins', fontWeight: '600',
  },

  resendRow: { alignItems: 'center', marginBottom: 18 },
  resendBtn: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: '#16A34A',
  },
  resendText: {
    color: '#16A34A', fontSize: 14, fontFamily: 'Poppins', fontWeight: '500',
  },
  timerBox: { flexDirection: 'row', alignItems: 'center' },
  timerLabel: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '400', color: '#6B7280',
  },
  timerValue: {
    fontSize: 14, fontFamily: 'Poppins', fontWeight: '600', color: '#000000',
  },

  infoCard: {
    backgroundColor: '#16A34A', borderRadius: 14, padding: 16,
  },
  infoTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  infoTitleIcon: {
    width: 20, height: 20, tintColor: '#FFFFFF',
  },
  infoTitle: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '600', color: '#FFFFFF',
  },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 7, alignItems: 'flex-start' },
  infoBullet: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, lineHeight: 20 },
  infoText: {
    flex: 1, fontSize: 12, fontFamily: 'Poppins',
    fontWeight: '400', color: '#FFFFFF', lineHeight: 19,
  },
});
