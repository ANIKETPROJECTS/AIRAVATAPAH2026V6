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

const COL_A = [
  'कागदपत्र अपलोड करा',
  'फॉर्म भरायची गरज नाही',
  'योजना व अनुदान सुचवले जातील',
  'अर्जाची स्थिती मोबाईलवर पाहा',
  'सुरक्षित व कागदविरहित सेवा',
];

const COL_B = [
  'AI कागदपत्र आपोआप वाचेल',
  'डिजिटल शेतकरी प्रोफाइल तयार',
  'एका क्लिकमध्ये अर्ज करा',
  'मंजुरी / नकाराची लगेच सूचना',
];

export default function WelcomeScreen({ navigation }: Props) {
  const { state, setLang } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topLogosBar}>
        <GovtIndia width={150} height={66} />
        <View style={styles.logoDivider} />
        <Image
          source={require('../../assets/logo-dept-agriculture.png')}
          style={styles.deptLogo}
          resizeMode="contain"
        />
        <View style={styles.logoDivider} />
        <SealMaharashtra width={72} height={72} />
      </View>

      <View style={styles.separator} />

      <View style={styles.body}>
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
          <View style={styles.cardDivider} />
          <View style={styles.gridRow}>
            <View style={styles.col}>
              {COL_A.map((point, i) => (
                <View key={i} style={styles.pointRow}>
                  <View style={styles.dot} />
                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>
            <View style={styles.colDivider} />
            <View style={styles.col}>
              {COL_B.map((point, i) => (
                <View key={i} style={styles.pointRow}>
                  <View style={styles.dot} />
                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>
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

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{t('getStarted')}  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topLogosBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  logoDivider: {
    width: 1, height: 54, backgroundColor: '#E5E7EB',
  },
  deptLogo: {
    width: 72, height: 72,
  },
  separator: {
    height: 1, backgroundColor: '#E5E7EB',
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  brandLogo: {
    width: '95%',
    height: 130,
  },
  infoCard: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  infoHeader: {
    fontSize: 13.5,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 0,
  },
  col: {
    flex: 1,
    gap: 7,
  },
  colDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 10,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginTop: 6,
    flexShrink: 0,
  },
  pointText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 17,
  },
  langSection: {
    alignItems: 'center',
  },
  langTitle: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  langBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  langBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  langBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#374151',
  },
  langBtnTextActive: {
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
