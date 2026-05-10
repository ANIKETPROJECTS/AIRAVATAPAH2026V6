import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZE, RADIUS, SHADOW } from '../constants';

interface Props {
  onDone: () => void;
}

export default function VerifiedScreen({ onDone }: Props) {
  const { state } = useAuth();
  const lang = state.lang;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 5 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => { onDone(); }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const benefits = [
    lang === 'hi' ? '✅ सरकारी योजनाओं के लिए आवेदन करें' : lang === 'mr' ? '✅ सरकारी योजनांसाठी अर्ज करा' : '✅ Apply for government schemes',
    lang === 'hi' ? '✅ फसल बीमा का लाभ उठाएं' : lang === 'mr' ? '✅ पीक विम्याचा लाभ घ्या' : '✅ Claim crop insurance benefits',
    lang === 'hi' ? '✅ सब्सिडी के लिए आवेदन करें' : lang === 'mr' ? '✅ अनुदानासाठी अर्ज करा' : '✅ Apply for subsidies & grants',
    lang === 'hi' ? '✅ डीबीटी लाभ प्राप्त करें' : lang === 'mr' ? '✅ डीबीटी लाभ मिळवा' : '✅ Receive direct DBT benefits',
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>कृषी सुविधा</Text>
        <Text style={styles.topBarSub}>Verification Complete</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Text style={styles.iconEmoji}>✅</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.contentBlock, { opacity: fadeAnim }]}>
          <Text style={styles.title}>
            {lang === 'hi' ? 'बधाई हो! 🎉' : lang === 'mr' ? 'अभिनंदन! 🎉' : 'Congratulations! 🎉'}
          </Text>
          <Text style={styles.subtitle}>
            {lang === 'hi'
              ? 'आपका किसान पंजीकरण सफलतापूर्वक सत्यापित हो गया है।'
              : lang === 'mr'
              ? 'तुमची शेतकरी नोंदणी यशस्वीरीत्या पडताळली गेली आहे.'
              : 'Your farmer registration has been verified and approved by the Agriculture Officer.'}
          </Text>
        </Animated.View>

        {!!state.farmer?.farmerId && (
          <View style={styles.idCard}>
            <View>
              <Text style={styles.idLabel}>
                {lang === 'hi' ? 'किसान आईडी' : lang === 'mr' ? 'शेतकरी ID' : 'Your Farmer ID'}
              </Text>
              <Text style={styles.idValue}>{state.farmer.farmerId}</Text>
            </View>
            <View style={styles.idCheckBox}>
              <Text style={styles.idCheck}>✓</Text>
            </View>
          </View>
        )}

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>
            {lang === 'hi' ? '🌟 अब आप कर सकते हैं' : lang === 'mr' ? '🌟 आता तुम्ही करू शकता' : '🌟 You now have access to'}
          </Text>
          {benefits.map((item, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.benefitItem}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.autoNote}>
          {lang === 'hi' ? '⏱ 5 सेकंड में डैशबोर्ड पर जाएंगे…' : lang === 'mr' ? '⏱ 5 सेकंदात डॅशबोर्डवर जाईल…' : '⏱ Redirecting to your dashboard in 5 seconds…'}
        </Text>

        <TouchableOpacity style={styles.btn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.btnText}>
            {lang === 'hi' ? '🚀 डैशबोर्ड पर जाएं' : lang === 'mr' ? '🚀 डॅशबोर्डवर जा' : '🚀 Go to Dashboard'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center',
  },
  topBarTitle: { fontSize: FONT_SIZE.base, fontWeight: '800', color: COLORS.gold },
  topBarSub: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scroll: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 20, alignItems: 'center' },
  iconWrap: { marginBottom: 24 },
  iconOuter: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.primaryLight, ...SHADOW.md,
  },
  iconInner: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  iconEmoji: { fontSize: 52 },
  contentBlock: { alignItems: 'center', marginBottom: 24, width: '100%' },
  title: { fontSize: FONT_SIZE['3xl'], fontWeight: '800', color: COLORS.primaryDark, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  idCard: {
    backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.lg, padding: 20,
    marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', width: '100%', ...SHADOW.md,
  },
  idLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  idValue: { fontSize: FONT_SIZE['2xl'], fontWeight: '800', color: COLORS.white, letterSpacing: 2 },
  idCheckBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  idCheck: { color: COLORS.white, fontSize: FONT_SIZE.xl, fontWeight: '800' },
  benefitsCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 18,
    width: '100%', marginBottom: 20, ...SHADOW.sm,
  },
  benefitsTitle: { fontSize: FONT_SIZE.base, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 12 },
  benefitRow: {
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  benefitItem: { fontSize: FONT_SIZE.base, color: COLORS.text, lineHeight: 22 },
  autoNote: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginBottom: 20, textAlign: 'center' },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 18,
    paddingHorizontal: 32, alignItems: 'center', width: '100%', ...SHADOW.md,
  },
  btnText: { color: COLORS.white, fontSize: FONT_SIZE.base, fontWeight: '800' },
});
