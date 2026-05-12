import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, RADIUS, T } from '../constants';

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
            <Image
              source={require('../../assets/icon-mobile.png')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
            <Text style={styles.title}>मोबाईल नंबर</Text>
            <Text style={styles.titleEn}>Enter Your Mobile Number</Text>
            <Text style={styles.subtitle}>
              आपल्या नोंदणीकृत मोबाईल नंबरवर OTP पाठवला जाईल.{'\n'}
              An OTP will be sent to verify your identity.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>मोबाईल नंबर / Mobile Number</Text>
            <View style={styles.inputRow}>
              <View style={styles.prefixBox}>
                <Text style={styles.flagText}>🇮🇳</Text>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <View style={styles.dividerLine} />
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                placeholderTextColor="#AAAAAA"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={(v) => setMobile(v.replace(/\D/g, ''))}
                onSubmitEditing={handleSend}
                returnKeyType="done"
              />
            </View>
            <Text style={styles.inputHint}>
              {mobile.length}/10 digits entered
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
            onPress={handleSend}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.btnText}>OTP पाठवा  →</Text>}
          </TouchableOpacity>

          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>पुढे काय होईल?</Text>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepText}>आपल्या मोबाईलवर 6-अंकी OTP येईल</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
              <Text style={styles.stepText}>OTP टाकून ओळख सिद्ध करा</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
              <Text style={styles.stepText}>कृषी सुविधा डॅशबोर्डवर प्रवेश मिळवा</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔒</Text>
            <Text style={styles.infoText}>
              आपला मोबाईल नंबर फक्त OTP पडताळणीसाठी वापरला जातो. कोणाशीही शेअर केला जाणार नाही.
            </Text>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    backgroundColor: '#14532D',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  backText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontFamily: 'Poppins', fontWeight: '600' },
  topBarTitle: { fontSize: 16, fontFamily: 'Poppins', fontWeight: '800', color: '#D97706' },
  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32 },

  header: { alignItems: 'center', marginBottom: 28 },
  headerIcon: { width: 100, height: 100, marginBottom: 14 },
  title: { fontSize: 26, fontFamily: 'Poppins', fontWeight: '700', color: '#000000', marginBottom: 2 },
  titleEn: { fontSize: 14, fontFamily: 'Poppins', fontWeight: '500', color: '#000000', marginBottom: 10 },
  subtitle: {
    fontSize: 13, fontFamily: 'Poppins', color: '#000000',
    textAlign: 'center', lineHeight: 20,
  },

  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '600',
    color: '#000000', marginBottom: 8, letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 12, overflow: 'hidden',
  },
  prefixBox: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 16, gap: 6,
    backgroundColor: '#F9FAFB',
  },
  flagText: { fontSize: 18 },
  prefixText: { fontSize: 16, fontFamily: 'Poppins', fontWeight: '700', color: '#000000' },
  dividerLine: { width: 1, height: 28, backgroundColor: '#D1D5DB' },
  input: {
    flex: 1, fontSize: 20, fontFamily: 'Poppins', fontWeight: '700',
    color: '#000000', paddingVertical: 16, paddingHorizontal: 16, letterSpacing: 3,
  },
  inputHint: {
    fontSize: 11, fontFamily: 'Poppins', color: '#6B7280',
    marginTop: 5, textAlign: 'right',
  },

  btn: {
    backgroundColor: '#16A34A', borderRadius: RADIUS.full,
    paddingVertical: 18, alignItems: 'center', marginBottom: 24,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  btnText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins', fontWeight: '700' },

  stepsCard: {
    backgroundColor: '#F8FAFC', borderRadius: 14,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  stepsTitle: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '700',
    color: '#000000', marginBottom: 12,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins', fontWeight: '700' },
  stepText: { flex: 1, fontSize: 13, fontFamily: 'Poppins', color: '#000000', lineHeight: 20 },

  infoRow: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#F0FDF4', borderRadius: 10, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#16A34A',
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Poppins', color: '#000000', lineHeight: 19 },
});
