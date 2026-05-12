import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, ScrollView,
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

const INFO_POINTS = [
  'कागदपत्र अपलोड करा — बाकी काम AI करेल',
  'आधार, 7/12, बँक तपशील आपोआप वाचले जातील',
  'फॉर्म भरायची गरज नाही',
  'तुमचा डिजिटल शेतकरी प्रोफाइल तयार होईल',
  'योजना व अनुदान आपोआप सुचवले जातील',
  'एका क्लिकमध्ये अर्ज करा',
  'अर्जाची स्थिती मोबाईलवर त्वरित पाहा',
  'मंजुरी / नकाराची लगेच सूचना मिळवा',
  'सुरक्षित व कागदविरहित सेवा',
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={require('../../assets/brand-logo-new.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoHeader}>
            महाराष्ट्राचे AI-आधारित कृषी प्रशासन व्यासपीठ
          </Text>
          <View style={styles.divider} />
          {INFO_POINTS.map((point, i) => (
            <View key={i} style={styles.pointRow}>
              <Image
                source={require('../../assets/icon-check.png')}
                style={styles.checkIcon}
              />
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
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

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{t('getStarted')}  →</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingVertical: 10,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  hero: {
    alignItems: 'center',
    marginTop: -24,
    marginBottom: -48,
  },
  brandLogo: {
    width: '100%',
    height: 420,
  },
  infoCard: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginTop: 0,
    marginBottom: 18,
  },
  infoHeader: {
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    gap: 10,
  },
  checkIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
    flexShrink: 0,
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  langSection: {
    marginBottom: 16,
  },
  langTitle: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#000000',
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
