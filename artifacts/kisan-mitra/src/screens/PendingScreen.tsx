import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Platform,
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
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>कृषी सुविधा</Text>
          <Text style={styles.topBarSub}>Application Status</Text>
        </View>
        <TouchableOpacity style={styles.refreshTopBtn} onPress={handleRefresh} disabled={refreshing}>
          {refreshing
            ? <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
            : <Text style={styles.refreshTopText}>↻  Refresh</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status Hero */}
        <View style={styles.statusHero}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>Under Review</Text>
          </View>
          <Text style={styles.title}>{t('pendingTitle')}</Text>
          <Text style={styles.subtitle}>{t('pendingSubtitle')}</Text>
        </View>

        {/* Farmer ID Card */}
        {!!farmer?.farmerId && (
          <View style={styles.idCard}>
            <View>
              <Text style={styles.idLabel}>{t('farmerId')}</Text>
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
          <Text style={styles.cardTitle}>Application Timeline</Text>
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
                    {isDone
                      ? <Text style={styles.stepCircleTextDone}>✓</Text>
                      : <Text style={[styles.stepCircleNum, isActive && styles.stepCircleNumActive]}>
                          {step.num}
                        </Text>
                    }
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
                  {(isDone || isActive) && (
                    <View style={[styles.stepStatus, isDone ? styles.stepStatusDone : styles.stepStatusActive]}>
                      <Text style={[styles.stepStatusText, isDone ? styles.stepStatusTextDone : styles.stepStatusTextActive]}>
                        {isDone ? 'Done' : 'Active'}
                      </Text>
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
                  <Text style={styles.docIconText}>Doc</Text>
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
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            The agriculture officer will review your uploaded documents and verify your land records. This typically takes 2–5 working days. You will be notified once a decision is made.
          </Text>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} disabled={refreshing} activeOpacity={0.85}>
          {refreshing
            ? <ActivityIndicator color={COLORS.primary} />
            : <Text style={styles.refreshBtnText}>Refresh Status</Text>}
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
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16, fontFamily: 'Poppins', fontWeight: '600', color: COLORS.gold,
  },
  topBarSub: {
    fontSize: 11, fontFamily: 'Poppins', fontWeight: '400',
    color: 'rgba(255,255,255,0.55)', marginTop: 1,
  },
  refreshTopBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  refreshTopText: {
    color: 'rgba(255,255,255,0.8)', fontSize: 13,
    fontFamily: 'Poppins', fontWeight: '400',
  },

  scroll: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 20 },

  statusHero: { alignItems: 'center', marginBottom: 20 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#FEF3C7', borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.gold,
  },
  statusBadgeText: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '500', color: '#92400E',
  },
  title: {
    fontSize: 22, fontFamily: 'Poppins', fontWeight: '500',
    color: COLORS.primaryDark, textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    color: '#6B7280', textAlign: 'center', lineHeight: 20, maxWidth: 280,
  },

  idCard: {
    backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.lg, padding: 18,
    marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  idLabel: {
    fontSize: 10, fontFamily: 'Poppins', fontWeight: '500',
    color: COLORS.gold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6,
  },
  idValue: {
    fontSize: 24, fontFamily: 'Poppins', fontWeight: '500',
    color: '#FFFFFF', letterSpacing: 0.5, marginBottom: 4,
  },
  idMobile: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
    color: 'rgba(255,255,255,0.55)',
  },
  idIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  idIconText: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '600',
    color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5,
  },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: RADIUS.lg, padding: 18,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: {
    fontSize: 14, fontFamily: 'Poppins', fontWeight: '500',
    color: '#1C1917', marginBottom: 18,
  },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepCircleDone: { backgroundColor: '#F0FDF4', borderColor: COLORS.primary },
  stepCircleActive: { backgroundColor: '#FEF3C7', borderColor: COLORS.gold },
  stepCirclePending: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  stepCircleTextDone: {
    fontSize: 14, color: COLORS.primary, fontWeight: '500',
  },
  stepCircleNum: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '500', color: '#94A3B8',
  },
  stepCircleNumActive: { color: COLORS.gold },

  stepInfo: { flex: 1, paddingTop: 4 },
  stepLabel: {
    fontSize: 14, fontFamily: 'Poppins', fontWeight: '500', color: '#94A3B8',
  },
  stepLabelDone: { color: '#1C1917' },
  stepLabelActive: { color: '#1C1917' },
  stepLabelPending: { color: '#CBD5E1' },
  stepSub: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', color: '#94A3B8', marginTop: 2,
  },
  stepSubPending: { color: '#CBD5E1' },

  stepStatus: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, marginTop: 6, flexShrink: 0,
  },
  stepStatusDone: { backgroundColor: '#F0FDF4' },
  stepStatusActive: { backgroundColor: '#FEF3C7' },
  stepStatusText: { fontSize: 11, fontFamily: 'Poppins', fontWeight: '500' },
  stepStatusTextDone: { color: COLORS.primary },
  stepStatusTextActive: { color: COLORS.gold },

  stepLine: {
    width: 1.5, height: 22, backgroundColor: '#E2E8F0', marginLeft: 15, marginVertical: 3,
  },
  stepLineDone: { backgroundColor: COLORS.primary },

  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  docIconBox: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  docIconText: {
    fontSize: 9, fontFamily: 'Poppins', fontWeight: '600',
    color: COLORS.primary, letterSpacing: 0.3,
  },
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
    backgroundColor: '#F0FDF4', borderRadius: RADIUS.lg, padding: 16,
    marginBottom: 16, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 13, fontFamily: 'Poppins', fontWeight: '500',
    color: COLORS.primaryDark, marginBottom: 8,
  },
  infoText: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '400',
    color: '#166534', lineHeight: 20,
  },

  refreshBtn: {
    backgroundColor: '#FFFFFF', borderRadius: RADIUS.lg,
    paddingVertical: 15, alignItems: 'center', marginBottom: 10,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  refreshBtnText: {
    color: COLORS.primary, fontSize: 14,
    fontFamily: 'Poppins', fontWeight: '500',
  },

  logoutBtn: { paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: {
    color: '#94A3B8', fontSize: 13, fontFamily: 'Poppins', fontWeight: '400',
  },
});
