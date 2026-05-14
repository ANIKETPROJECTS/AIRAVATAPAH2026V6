import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Platform, Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, T } from '../constants';

const STEPS = [
  { key: 'submitted', label: 'Documents Submitted', sub: 'Documents received successfully', num: '1' },
  { key: 'underReview', label: 'Under Review', sub: 'Documents being verified', num: '2' },
  { key: 'decision', label: 'Admin Decision', sub: 'Awaiting final approval', num: '3' },
];

export default function PendingScreen() {
  const { state, refreshFarmer, logout } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const [refreshing, setRefreshing] = useState(false);
  const farmer = state.farmer;

  useEffect(() => {
    refreshFarmer().catch(() => {});
    const interval = setInterval(async () => {
      try { await refreshFarmer(); } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshFarmer]);

  async function handleRefresh() {
    setRefreshing(true);
    try { await refreshFarmer(); }
    catch { Alert.alert('Error', 'Could not fetch updated status. Please try again.'); }
    finally { setRefreshing(false); }
  }

  async function handleLogout() {
    if (Platform.OS === 'web') {
      const msg = t('logoutConfirm') || 'Are you sure you want to logout?';
      if (window.confirm(msg)) await logout();
      return;
    }
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => { logout(); } },
    ]);
  }

  const docs = farmer?.docs ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header — same logo style as Login/OTP/DocumentUpload */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <View style={styles.headerLogoWrap}>
          <Image
            source={require('../../assets/brand-logo-new.png')}
            style={styles.headerLogo}
          />
        </View>
        <TouchableOpacity style={styles.refreshTopBtn} onPress={handleRefresh} disabled={refreshing}>
          {refreshing
            ? <ActivityIndicator size="small" color={COLORS.primaryDark} />
            : <Text style={styles.refreshTopText}>↻  Refresh</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <View style={styles.heroDot} />
            <Text style={styles.heroBadgeText}>Under Review</Text>
          </View>
          <Text style={styles.heroTitle}>{t('pendingTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('pendingSubtitle')}</Text>
        </View>

        {/* Farmer ID Card */}
        {!!farmer?.farmerId && (
          <View style={styles.idCard}>
            <View style={styles.idCardLeft}>
              <View style={styles.idBadgeRow}>
                <View style={styles.idDot} />
                <Text style={styles.idLabel}>{t('farmerId')}</Text>
              </View>
              <Text style={styles.idValue}>{farmer.farmerId}</Text>
              <Text style={styles.idMobile}>+91 {state.mobile}</Text>
            </View>
            <View style={styles.idIconBox}>
              <Text style={styles.idIconText}>ID</Text>
            </View>
          </View>
        )}

        {/* Application Timeline */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Application Timeline</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>Step 2 of 3</Text>
            </View>
          </View>

          {STEPS.map((step, idx) => {
            const isDone = idx === 0;
            const isActive = idx === 1;
            const isPending = idx === 2;
            return (
              <View key={step.key}>
                <View style={styles.stepRow}>
                  <View style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isActive && styles.stepCircleActive,
                    isPending && styles.stepCirclePending,
                  ]}>
                    {isDone ? (
                      <Text style={styles.stepCheckmark}>✓</Text>
                    ) : isActive ? (
                      <Image
                        source={require('../../assets/icon-under-review.png')}
                        style={styles.stepIcon}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.stepCircleNum}>{step.num}</Text>
                    )}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={[
                      styles.stepLabel,
                      isDone && styles.stepLabelDone,
                      isActive && styles.stepLabelActive,
                      isPending && styles.stepLabelPending,
                    ]}>
                      {idx === 0 ? t('statusSubmitted') : idx === 1 ? t('statusUnderReview') : t('statusDecision')}
                    </Text>
                    <Text style={[styles.stepSub, isPending && styles.stepSubPending]}>{step.sub}</Text>
                  </View>
                  {isDone && (
                    <View style={styles.stepStatusDone}>
                      <Text style={styles.stepStatusTextDone}>Done</Text>
                    </View>
                  )}
                  {isActive && (
                    <View style={styles.stepStatusActive}>
                      <Text style={styles.stepStatusTextActive}>Active</Text>
                    </View>
                  )}
                </View>
                {idx < STEPS.length - 1 && (
                  <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Documents Submitted */}
        {docs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('docsSubmitted')}</Text>
            {docs.map((doc, i) => (
              <View key={i} style={[styles.docRow, i === 0 && { borderTopWidth: 0 }]}>
                <View style={styles.docIconBox}>
                  <Text style={styles.docIconText}>📄</Text>
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.docDate}>
                    {doc.extractedAt
                      ? new Date(doc.extractedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </Text>
                </View>
                <View style={styles.docBadge}>
                  <Text style={styles.docBadgeText}>Done</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* What happens next */}
        <View style={styles.infoBox}>
          <View style={styles.infoIconRow}>
            <Text style={styles.infoIcon}>ℹ</Text>
            <Text style={styles.infoTitle}>What happens next?</Text>
          </View>
          <Text style={styles.infoText}>
            The agriculture officer will review your uploaded documents and verify your land records. This typically takes 2–5 working days. You will be notified once a decision is made.
          </Text>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing} activeOpacity={0.85}>
          {refreshing
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.refreshBtnText}>↻  Refresh Status</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

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
  topBarSpacer: { width: 90 },
  headerLogoWrap: { width: 220, height: 74, overflow: 'hidden' },
  headerLogo: { width: 220, height: 220, marginTop: -71 },
  refreshTopBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    width: 90, alignItems: 'center',
  },
  refreshTopText: {
    color: COLORS.primaryDark, fontSize: 12,
    fontFamily: 'Poppins', fontWeight: '500',
  },

  scroll: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 20 },

  heroCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(217,119,6,0.2)', borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14,
  },
  heroDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gold },
  heroBadgeText: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '600', color: COLORS.gold,
  },
  heroTitle: {
    fontSize: 20, fontFamily: 'Poppins', fontWeight: '600',
    color: '#FFFFFF', textAlign: 'center', marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 20, maxWidth: 260,
  },

  idCard: {
    backgroundColor: '#1A3D2B',
    borderRadius: RADIUS.lg, padding: 18,
    marginBottom: 14, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  idCardLeft: { flex: 1 },
  idBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  idDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  idLabel: {
    fontSize: 10, fontFamily: 'Poppins', fontWeight: '600',
    color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 1.2,
  },
  idValue: {
    fontSize: 22, fontFamily: 'Poppins', fontWeight: '600',
    color: '#FFFFFF', letterSpacing: 1, marginBottom: 4,
  },
  idMobile: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
  },
  idIconBox: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  idIconText: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '700',
    color: COLORS.gold, letterSpacing: 1,
  },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: RADIUS.lg, padding: 18,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14, fontFamily: 'Poppins', fontWeight: '600', color: '#1C1917',
  },
  cardBadge: {
    backgroundColor: '#FEF3C7', borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  cardBadgeText: {
    fontSize: 11, fontFamily: 'Poppins', fontWeight: '500', color: '#92400E',
  },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepCircleDone: { backgroundColor: '#F0FDF4', borderColor: COLORS.primary },
  stepCircleActive: { backgroundColor: '#FFF7ED', borderColor: COLORS.gold, borderWidth: 2 },
  stepCirclePending: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  stepCheckmark: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },
  stepIcon: { width: 20, height: 20, tintColor: COLORS.gold },
  stepCircleNum: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '500', color: '#CBD5E1',
  },

  stepInfo: { flex: 1, paddingTop: 6 },
  stepLabel: {
    fontSize: 14, fontFamily: 'Poppins', fontWeight: '500', color: '#CBD5E1',
  },
  stepLabelDone: { color: '#1C1917' },
  stepLabelActive: { color: '#1C1917', fontWeight: '600' },
  stepLabelPending: { color: '#CBD5E1' },
  stepSub: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', color: '#94A3B8', marginTop: 2,
  },
  stepSubPending: { color: '#CBD5E1' },

  stepStatusDone: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginTop: 6,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
  },
  stepStatusActive: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginTop: 6,
    backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A',
  },
  stepStatusTextDone: {
    fontSize: 11, fontFamily: 'Poppins', fontWeight: '600', color: COLORS.primary,
  },
  stepStatusTextActive: {
    fontSize: 11, fontFamily: 'Poppins', fontWeight: '600', color: '#92400E',
  },

  stepLine: {
    width: 1.5, height: 24, backgroundColor: '#E2E8F0', marginLeft: 17, marginVertical: 2,
  },
  stepLineDone: { backgroundColor: COLORS.primary },

  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  docIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  docIconText: { fontSize: 16 },
  docInfo: { flex: 1 },
  docName: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '500', color: '#1C1917', marginBottom: 2,
  },
  docDate: {
    fontSize: 11, fontFamily: 'Poppins', fontWeight: '400', color: '#94A3B8',
  },
  docBadge: {
    backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#BBF7D0',
  },
  docBadgeText: {
    fontSize: 11, fontFamily: 'Poppins', fontWeight: '500', color: COLORS.primary,
  },

  infoBox: {
    backgroundColor: '#FFFFFF', borderRadius: RADIUS.lg, padding: 16,
    marginBottom: 16, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  infoIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoIcon: { fontSize: 16, color: COLORS.primary },
  infoTitle: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '600', color: COLORS.primaryDark,
  },
  infoText: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '400',
    color: '#4B5563', lineHeight: 20,
  },

  refreshBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 15, alignItems: 'center', marginBottom: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  refreshBtnText: {
    color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins', fontWeight: '600',
  },

  logoutBtn: { paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: {
    color: '#94A3B8', fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
  },
});
