import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, RADIUS, SHADOW, T } from '../constants';
import { Scheme, InsuranceSubsidy } from '../types';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  bg?: string;
}

function StatCard({ label, value, sub, color = COLORS.primary, bg = '#F0FDF4' }: StatCardProps) {
  return (
    <View style={[statStyles.card, { backgroundColor: bg, borderColor: color + '25' }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      {sub ? <Text style={statStyles.sub}>{sub}</Text> : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    width: '47%', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, ...SHADOW.sm, gap: 4,
  },
  value: {
    fontSize: 26,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 15,
  },
  sub: {
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

interface BarRowProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function BarRow({ label, value, max, color }: BarRowProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.val, { color }]}>{value}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  label: {
    width: 100,
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#6B7280',
  },
  track: { flex: 1, height: 7, backgroundColor: '#F1F5F9', borderRadius: RADIUS.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADIUS.full },
  val: {
    width: 32,
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'right',
  },
});

export default function AnalyticsScreen() {
  const { state } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const farmer = state.farmer;

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [insurance, setInsurance] = useState<InsuranceSubsidy[]>([]);
  const [subsidies, setSubsidies] = useState<InsuranceSubsidy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, ins, sub] = await Promise.all([
          api.getSchemes(),
          api.getInsuranceSubsidies({ type: 'Insurance', limit: 50 }),
          api.getInsuranceSubsidies({ type: 'Subsidy', limit: 50 }),
        ]);
        setSchemes(s);
        setInsurance(ins.items);
        setSubsidies(sub.items);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  const TopBar = (
    <View style={styles.topBar}>
      <View style={styles.topBarSide} />
      <View style={styles.headerLogoWrap}>
        <Image source={require('../../assets/brand-logo-new.png')} style={styles.headerLogo} />
      </View>
      <View style={styles.topBarSide} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        {TopBar}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const activeSchemes = schemes.filter(s => s.status === 'Active').length;
  const centralSchemes = schemes.filter(s => s.type === 'CENTRAL').length;
  const stateSchemes = schemes.filter(s => s.type === 'STATE').length;
  const activeInsurance = insurance.filter(s => s.status === 'Active').length;
  const activeSubsidies = subsidies.filter(s => s.status === 'Active').length;

  const landHa = farmer?.land ? parseFloat(String(farmer.land)) : 0;
  const landAcres = isNaN(landHa) ? 0 : Math.round(landHa * 2.47 * 10) / 10;

  const schemeBreakdown = [
    { label: 'Central Schemes', count: centralSchemes, color: COLORS.info },
    { label: 'State Schemes',   count: stateSchemes,   color: COLORS.primary },
    { label: 'Insurance Plans', count: insurance.length, color: COLORS.gold },
    { label: 'Subsidies',       count: subsidies.length, color: '#7C3AED' },
  ];
  const maxScheme = Math.max(...schemeBreakdown.map(s => s.count), 1);

  const statusHistory = [
    { label: state.lang === 'hi' ? 'सबमिट किया' : state.lang === 'mr' ? 'सबमिट केले' : 'Submitted', done: true },
    { label: state.lang === 'hi' ? 'समीक्षाधीन' : state.lang === 'mr' ? 'पुनरावलोकन' : 'Under Review', done: farmer?.status === 'Active' || farmer?.status === 'Verified' },
    { label: state.lang === 'hi' ? 'सत्यापित' : state.lang === 'mr' ? 'सत्यापित' : 'Verified', done: farmer?.status === 'Active' || farmer?.status === 'Verified' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {TopBar}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Page Title */}
        <View style={styles.pageTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>
              {state.lang === 'hi' ? 'विश्लेषण' : state.lang === 'mr' ? 'विश्लेषण' : 'Analytics'}
            </Text>
            <Text style={styles.pageSubtitle}>
              {state.lang === 'hi' ? 'आपके खाते का पूरा विवरण' : state.lang === 'mr' ? 'तुमच्या खात्याचा संपूर्ण तपशील' : 'Your complete farm & scheme overview'}
            </Text>
          </View>
        </View>

        {/* Farm Overview */}
        <Text style={styles.sectionTitle}>
          {state.lang === 'hi' ? 'खेत अवलोकन' : state.lang === 'mr' ? 'शेत आढावा' : 'Farm Overview'}
        </Text>
        <View style={styles.statsGrid}>
          <StatCard label={t('totalLand')} value={landHa > 0 ? `${landHa} ha` : '—'} sub={landHa > 0 ? `≈ ${landAcres} acres` : undefined} color={COLORS.primary} bg="#F0FDF4" />
          <StatCard label={t('primaryCrop')} value={farmer?.crop && farmer.crop !== '—' ? farmer.crop : '—'} color={COLORS.gold} bg="#FFFBEB" />
          <StatCard label={t('location')} value={farmer?.village && farmer.village !== '—' ? farmer.village : '—'} color={COLORS.info} bg="#EFF6FF" />
          <StatCard label={t('district')} value={farmer?.district && farmer.district !== '—' ? farmer.district : '—'} color="#7C3AED" bg="#F5F3FF" />
        </View>

        {/* Scheme Statistics */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {state.lang === 'hi' ? 'योजना सांख्यिकी' : state.lang === 'mr' ? 'योजना आकडेवारी' : 'Scheme Statistics'}
          </Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{schemes.length + insurance.length + subsidies.length} total</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <StatCard label={state.lang === 'hi' ? 'सक्रिय योजनाएं' : 'Active Schemes'} value={String(activeSchemes)} sub={`of ${schemes.length} total`} color={COLORS.primary} bg="#F0FDF4" />
          <StatCard label={state.lang === 'hi' ? 'बीमा योजनाएं' : 'Insurance Plans'} value={String(activeInsurance)} sub={`of ${insurance.length} total`} color={COLORS.gold} bg="#FFFBEB" />
          <StatCard label={state.lang === 'hi' ? 'सब्सिडी' : 'Subsidies'} value={String(activeSubsidies)} sub={`of ${subsidies.length} total`} color="#7C3AED" bg="#F5F3FF" />
          <StatCard label={state.lang === 'hi' ? 'केंद्रीय योजनाएं' : 'Central Schemes'} value={String(centralSchemes)} sub={`${stateSchemes} state`} color={COLORS.info} bg="#EFF6FF" />
        </View>

        {/* Category Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {state.lang === 'hi' ? 'श्रेणी वितरण' : state.lang === 'mr' ? 'श्रेणी वितरण' : 'Category Breakdown'}
          </Text>
          {schemeBreakdown.map((item) => (
            <BarRow key={item.label} label={item.label} value={item.count} max={maxScheme} color={item.color} />
          ))}
        </View>

        {/* Registration Status */}
        <Text style={styles.sectionTitle}>
          {state.lang === 'hi' ? 'पंजीकरण स्थिति' : state.lang === 'mr' ? 'नोंदणी स्थिती' : 'Registration Status'}
        </Text>
        <View style={styles.card}>
          <View style={styles.statusTrack}>
            {statusHistory.map((step, idx) => (
              <View key={step.label} style={styles.statusStep}>
                <View style={[styles.statusDot, step.done ? styles.statusDotDone : styles.statusDotPending]}>
                  <Text style={styles.statusDotText}>{step.done ? '✓' : String(idx + 1)}</Text>
                </View>
                {idx < statusHistory.length - 1 && (
                  <View style={[styles.statusLine, step.done && styles.statusLineDone]} />
                )}
                <Text style={[styles.statusLabel, step.done && styles.statusLabelDone]}>{step.label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.statusResultPill, {
            backgroundColor: farmer?.status === 'Active' || farmer?.status === 'Verified' ? '#F0FDF4' : '#FFFBEB'
          }]}>
            <Text style={[styles.statusResultText, {
              color: farmer?.status === 'Active' || farmer?.status === 'Verified' ? COLORS.primary : COLORS.gold
            }]}>
              {farmer?.status === 'Active' || farmer?.status === 'Verified'
                ? (state.lang === 'hi' ? '✓ सत्यापित किसान' : state.lang === 'mr' ? '✓ सत्यापित शेतकरी' : '✓ Verified Farmer')
                : (state.lang === 'hi' ? 'समीक्षाधीन' : state.lang === 'mr' ? 'पुनरावलोकनाधीन' : 'Under Review')}
            </Text>
          </View>
        </View>

        {/* Document Status */}
        {farmer?.docs && farmer.docs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {state.lang === 'hi' ? 'दस्तावेज़ स्थिति' : state.lang === 'mr' ? 'कागदपत्र स्थिती' : 'Document Status'}
            </Text>
            <View style={styles.card}>
              <View style={styles.docsProgressRow}>
                <View style={styles.docsProgressCircle}>
                  <Text style={styles.docsProgressValue}>{farmer.docs.length}</Text>
                  <Text style={styles.docsProgressLabel}>/5</Text>
                </View>
                <View style={styles.docsProgressInfo}>
                  <Text style={styles.docsProgressTitle}>
                    {state.lang === 'hi' ? 'दस्तावेज़ अपलोड किए' : state.lang === 'mr' ? 'कागदपत्रे अपलोड' : 'Documents Uploaded'}
                  </Text>
                  <View style={styles.docsBar}>
                    {[0, 1, 2, 3, 4].map(i => (
                      <View key={i} style={[styles.docsBarSegment, i < farmer.docs!.length && styles.docsBarSegmentFill]} />
                    ))}
                  </View>
                  <Text style={styles.docsProgressSub}>
                    {farmer.docs.length === 5
                      ? (state.lang === 'hi' ? 'सभी दस्तावेज़ सबमिट' : state.lang === 'mr' ? 'सर्व कागदपत्रे सबमिट' : 'All documents submitted')
                      : `${5 - farmer.docs.length} ${state.lang === 'hi' ? 'बाकी' : state.lang === 'mr' ? 'बाकी' : 'remaining'}`}
                  </Text>
                </View>
              </View>
              {farmer.docs.map((doc, i) => (
                <View key={i} style={styles.docRow}>
                  <View style={styles.docCheckCircle}>
                    <Text style={styles.docCheckText}>✓</Text>
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text style={styles.docDate}>
                      {doc.extractedAt
                        ? new Date(doc.extractedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Helpline */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>
            {state.lang === 'hi' ? 'महाराष्ट्र कृषि विभाग' : state.lang === 'mr' ? 'महाराष्ट्र कृषी विभाग' : 'Maharashtra Agriculture Dept.'}
          </Text>
          <Text style={styles.helpText}>
            {state.lang === 'hi'
              ? 'हेल्पलाइन: 1800-233-4000 (सोम–शनि, 10AM–5PM)'
              : state.lang === 'mr'
              ? 'हेल्पलाइन: 1800-233-4000 (सोम–शनि, 10AM–5PM)'
              : 'Helpline: 1800-233-4000 (Mon–Sat, 10AM–5PM)'}
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarSide: { width: 90 },
  headerLogoWrap: { width: 220, height: 74, overflow: 'hidden' },
  headerLogo: { width: 220, height: 220, marginTop: -71 },

  scroll: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 },

  pageTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, paddingBottom: 18,
    borderBottomWidth: 1, borderBottomColor: '#EAECEF',
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
  },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  totalBadge: {
    backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary,
  },
  totalBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primary,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
    marginBottom: 20, ...SHADOW.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
    marginBottom: 16,
  },

  statusTrack: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  statusStep: { alignItems: 'center', flex: 1 },
  statusDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  statusDotDone: { backgroundColor: COLORS.primary },
  statusDotPending: { backgroundColor: '#E5E7EB' },
  statusDotText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontWeight: '500',
    fontSize: 12,
  },
  statusLine: { position: 'absolute', top: 17, left: '60%', right: '-60%', height: 2, backgroundColor: '#E5E7EB' },
  statusLineDone: { backgroundColor: COLORS.primary },
  statusLabel: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statusLabelDone: { color: COLORS.primary, fontWeight: '500' },
  statusResultPill: { borderRadius: RADIUS.full, paddingVertical: 10, alignItems: 'center' },
  statusResultText: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },

  docsProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  docsProgressCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F0FDF4', borderWidth: 3, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2,
  },
  docsProgressValue: {
    fontSize: 22,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primary,
  },
  docsProgressLabel: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    marginTop: 4,
  },
  docsProgressInfo: { flex: 1 },
  docsProgressTitle: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  docsBar: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  docsBarSegment: { flex: 1, height: 5, borderRadius: RADIUS.full, backgroundColor: '#E5E7EB' },
  docsBarSegmentFill: { backgroundColor: COLORS.primary },
  docsProgressSub: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#6B7280',
  },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  docCheckCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  docCheckText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primary,
  },
  docInfo: { flex: 1 },
  docName: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#1A1A2E',
  },
  docDate: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
  },

  helpCard: {
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  helpTitle: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#374151',
    lineHeight: 18,
  },
});
