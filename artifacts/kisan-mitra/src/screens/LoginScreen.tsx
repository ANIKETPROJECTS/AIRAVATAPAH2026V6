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
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Image
          source={require('../../assets/brand-logo-new.png')}
          style={styles.headerLogo}
          resizeMode="cover"
        />
        <View style={styles.backBtnPlaceholder} />
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
            <View style={styles.inputPill}>
              <Text style={styles.flagText}>🇮🇳</Text>
              <Text style={styles.prefixText}>+91</Text>
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
            <Text style={styles.inputHint}>{mobile.length}/10 digits entered</Text>
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
            <Image
              source={require('../../assets/icon-info.png')}
              style={styles.infoIcon}
              resizeMode="contain"
            />
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  backBtnPlaceholder: { width: 36 },
  backArrow: { fontSize: 22, color: '#14532D', fontWeight: '400' },
  headerLogo: { height: 38, width: 128 },

  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 32 },

  header: { alignItems: 'center', marginBottom: 24 },
  headerIcon: { width: 90, height: 90, marginBottom: 12 },
  title: {
    fontSize: 26, fontFamily: 'Poppins', fontWeight: '600',
    color: '#000000', marginBottom: 2,
  },
  titleEn: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    color: '#000000', marginBottom: 8,
  },
  subtitle: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    color: '#000000', textAlign: 'center', lineHeight: 20,
  },

  inputGroup: { marginBottom: 18 },
  inputLabel: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '500',
    color: '#000000', marginBottom: 8, letterSpacing: 0.3,
  },
  inputPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 50, overflow: 'hidden',
    paddingHorizontal: 16,
  },
  flagText: { fontSize: 18, marginRight: 6 },
  prefixText: {
    fontSize: 16, fontFamily: 'Poppins', fontWeight: '500',
    color: '#000000', marginRight: 10,
  },
  dividerLine: { width: 1, height: 24, backgroundColor: '#D1D5DB', marginRight: 10 },
  input: {
    flex: 1, fontSize: 18, fontFamily: 'Poppins', fontWeight: '500',
    color: '#000000', paddingVertical: 16, letterSpacing: 2,
  },
  inputHint: {
    fontSize: 11, fontFamily: 'Poppins', fontWeight: '400',
    color: '#6B7280', marginTop: 5, textAlign: 'right',
  },

  btn: {
    backgroundColor: '#16A34A', borderRadius: RADIUS.full,
    paddingVertical: 17, alignItems: 'center', marginBottom: 22,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  btnText: {
    color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins', fontWeight: '600',
  },

  stepsCard: {
    backgroundColor: '#16A34A', borderRadius: 14,
    padding: 16, marginBottom: 18,
  },
  stepsTitle: {
    fontSize: 14, fontFamily: 'Poppins', fontWeight: '600',
    color: '#FFFFFF', marginBottom: 14,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  stepNumText: {
    color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins', fontWeight: '700',
  },
  stepText: {
    flex: 1, fontSize: 13, fontFamily: 'Poppins',
    fontWeight: '400', color: '#FFFFFF', lineHeight: 20,
  },

  infoRow: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  infoIcon: { width: 22, height: 22, marginTop: 1, flexShrink: 0 },
  infoText: {
    flex: 1, fontSize: 12, fontFamily: 'Poppins',
    fontWeight: '400', color: '#000000', lineHeight: 19,
  },
});
