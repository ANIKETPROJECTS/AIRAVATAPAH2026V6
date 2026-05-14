import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { Scheme, InsuranceSubsidy } from '../types';

interface StatCardProps {
  abbr: string;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  bg?: string;
}

function StatCard({ abbr, label, value, sub, color = COLORS.primary, bg = COLORS.primaryBg }: StatCardProps) {
  return (
    <View style={[statStyles.card, { backgroundColor: bg, borderColor: color + '30' }]}>
      <View style={[statStyles.iconBox, { backgroundColor: color + '20' }]}>
        <Text style={[statStyles.iconText, { color }]}>{abbr}</Text>
      </View>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      {sub ? <Text style={statStyles.sub}>{sub}</Text> : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    width: '47%', borderRadius: RADIUS.lg, padding: 14,
    alignItems: 'center', borderWidth: 1, ...SHADOW.sm, gap: 4,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  iconText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  value: { fontSize: FONT_SIZE['2xl'], fontWeight: '800' },
  label: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  sub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center' },
});

interface BarRowProps {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}

function BarRow({ label, value, max, color, suffix = '' }: BarRowProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.val, { color }]}>{value}{suffix}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  label: { width: 90, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: '600' },
  track: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADIUS.full },
  val: { width: 36, fontSize: FONT_SIZE.xs, fontWeight: '800', textAlign: 'right' },
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

        {/* Page title strip */}
        <View style={styles.pageTitleRow}>
          <View>
            <Text style={styles.pageTitle}>
              {state.lang === 'hi' ? 'विश्लेषण डैशबोर्ड' : state.lang === 'mr' ? 'विश्लेषण डॅशबोर्ड' : 'Analytics Dashboard'}
            </Text>
            <Text style={styles.pageSubtitle}>
              {state.lang === 'hi' ? 'आपके खाते का पूरा विवरण' : state.lang === 'mr' ? 'तुमच्या खात्याचा संपूर्ण तपशील' : 'Your complete farm and scheme overview'}
            </Text>
          </View>
          <View style={styles.headerIconBox}>
            <Text style={styles.headerIconText}>AN</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {state.lang === 'hi' ? 'खेत अवलोकन' : state.lang === 'mr' ? 'शेत आढावा' : 'Farm Overview'}
        </Text>
        <View style={styles.statsGrid}>
          <StatCard abbr="LA" label={t('totalLand')} value={landHa > 0 ? `${landHa} ha` : '—'} sub={landHa > 0 ? `≈ ${landAcres} acres` : undefined} color={COLORS.primary} bg={COLORS.primaryBg} />
          <StatCard abbr="CR" label={t('primaryCrop')} value={farmer?.crop && farmer.crop !== '—' ? farmer.crop : '—'} color={COLORS.gold} bg={COLORS.goldLight} />
          <StatCard abbr="VL" label={t('location')} value={farmer?.village && farmer.village !== '—' ? farmer.village : '—'} color={COLORS.info} bg={COLORS.infoLight} />
          <StatCard abbr="DT" label={t('district')} value={farmer?.district && farmer.district !== '—' ? farmer.district : '—'} color="#7C3AED" bg="#F5F3FF" />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {state.lang === 'hi' ? 'योजना सांख्यिकी' : state.lang === 'mr' ? 'योजना आकडेवारी' : 'Scheme Statistics'}
          </Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{schemes.length + insurance.length + subsidies.length} Total</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard abbr="SC" label={state.lang === 'hi' ? 'सक्रिय योजनाएं' : state.lang === 'mr' ? 'सक्रिय योजना' : 'Active Schemes'} value={String(activeSchemes)} sub={`of ${schemes.length} total`} color={COLORS.primary} bg={COLORS.primaryBg} />
          <StatCard abbr="IN" label={state.lang === 'hi' ? 'बीमा योजनाएं' : state.lang === 'mr' ? 'विमा योजना' : 'Insurance Plans'} value={String(activeInsurance)} sub={`of ${insurance.length} total`} color={COLORS.gold} bg={COLORS.goldLight} />
          <StatCard abbr="SB" label={state.lang === 'hi' ? 'सब्सिडी' : state.lang === 'mr' ? 'अनुदान' : 'Subsidies'} value={String(activeSubsidies)} sub={`of ${subsidies.length} total`} color="#7C3AED" bg="#F5F3FF" />
          <StatCard abbr="CS" label={state.lang === 'hi' ? 'केंद्रीय योजनाएं' : state.lang === 'mr' ? 'केंद्रीय योजना' : 'Central Schemes'} value={String(centralSchemes)} sub={`${stateSchemes} state`} color={COLORS.info} bg={COLORS.infoLight} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {state.lang === 'hi' ? 'श्रेणी वितरण' : state.lang === 'mr' ? 'श्रेणी वितरण' : 'Category Breakdown'}
          </Text>
          {schemeBreakdown.map((item) => (
            <BarRow key={item.label} label={item.label} value={item.count} max={maxScheme} color={item.color} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          {state.lang === 'hi' ? 'नोंदणी स्थिति' : state.lang === 'mr' ? 'नोंदणी स्थिती' : 'Registration Status'}
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
            backgroundColor: farmer?.status === 'Active' || farmer?.status === 'Verified' ? COLORS.primaryBg : COLORS.goldLight
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

        {farmer?.docs && farmer.docs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {state.lang === 'hi' ? 'दस्तावेज़ स्थिति' : state.lang === 'mr' ? 'कागदपत्र स्थिती' : 'Document Status'}
            </Text>
            <View style={styles.card}>
              <View style={styles.docsProgressRow}>
                <View style={styles.docsProgressCircle}>
                  <Text style={styles.docsProgressValue}>{farmer.docs.length}</Text>
                  <Text style={styles.docsProgressLabel}>/ 5</Text>
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
                      ? (state.lang === 'hi' ? 'सभी दस्तावेज़ सबमिट हो गए' : state.lang === 'mr' ? 'सर्व कागदपत्रे सबमिट' : 'All documents submitted')
                      : `${5 - farmer.docs.length} ${state.lang === 'hi' ? 'बाकी' : state.lang === 'mr' ? 'बाकी' : 'remaining'}`}
                  </Text>
                </View>
              </View>
              {farmer.docs.map((doc, i) => (
                <View key={i} style={styles.docRow}>
                  <View style={styles.docIconBox}>
                    <Text style={styles.docIcon}>DC</Text>
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text style={styles.docDate}>
                      {doc.extractedAt
                        ? new Date(doc.extractedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.docStatusBadge}>
                    <Text style={styles.docStatusText}>✓</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>
            {state.lang === 'hi' ? 'महाराष्ट्र कृषि विभाग' : state.lang === 'mr' ? 'महाराष्ट्र कृषी विभाग' : 'Maharashtra Agriculture Dept.'}
          </Text>
          <Text style={styles.infoCardText}>
            {state.lang === 'hi'
              ? 'किसी समस्या के लिए हेल्पलाइन: 1800-233-4000 (सोम–शनि, 10AM–5PM)'
              : state.lang === 'mr'
              ? 'मदतीसाठी हेल्पलाइन: 1800-233-4000 (सोम–शनि, 10AM–5PM)'
              : 'Helpline: 1800-233-4000 (Mon–Sat, 10AM–5PM)'}
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
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

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  pageTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  pageTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  pageSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  headerIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary + '40',
  },
  headerIconText: { fontSize: 14, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  totalBadge: {
    backgroundColor: COLORS.primaryBg, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary,
  },
  totalBadgeText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },

  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16,
    marginBottom: 20, ...SHADOW.sm,
  },
  cardTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text, marginBottom: 14 },

  statusTrack: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statusStep: { alignItems: 'center', flex: 1 },
  statusDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  statusDotDone: { backgroundColor: COLORS.primary },
  statusDotPending: { backgroundColor: COLORS.border },
  statusDotText: { color: COLORS.white, fontWeight: '800', fontSize: FONT_SIZE.sm },
  statusLine: { position: 'absolute', top: 18, left: '60%', right: '-60%', height: 2, backgroundColor: COLORS.border },
  statusLineDone: { backgroundColor: COLORS.primary },
  statusLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },
  statusLabelDone: { color: COLORS.primary },
  statusResultPill: { borderRadius: RADIUS.full, paddingVertical: 10, alignItems: 'center' },
  statusResultText: { fontSize: FONT_SIZE.sm, fontWeight: '800' },

  docsProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  docsProgressCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primaryBg, borderWidth: 3, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  docsProgressValue: { fontSize: FONT_SIZE['2xl'], fontWeight: '800', color: COLORS.primary },
  docsProgressLabel: { fontSize: FONT_SIZE.base, color: COLORS.textMuted, fontWeight: '600', marginTop: 4 },
  docsProgressInfo: { flex: 1 },
  docsProgressTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  docsBar: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  docsBarSegment: { flex: 1, height: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  docsBarSegmentFill: { backgroundColor: COLORS.primary },
  docsProgressSub: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  docIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  docIcon: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },
  docInfo: { flex: 1 },
  docName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  docDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  docStatusBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  docStatusText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '800' },
  infoCard: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.lg, padding: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  infoCardTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.primaryMid, marginBottom: 6 },
  infoCardText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
});
