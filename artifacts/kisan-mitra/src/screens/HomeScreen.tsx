import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { Notification } from '../types';
import type { RootStackParamList, TabParamList } from '../navigation/AppNavigator';

const QUICK_ACTIONS = [
  { key: 'applyScheme',    abbr: 'SC', color: COLORS.primary,  bg: COLORS.primaryBg },
  { key: 'fileInsurance',  abbr: 'IN', color: COLORS.info,     bg: '#DBEAFE' },
  { key: 'raiseGrievance', abbr: 'GR', color: COLORS.gold,     bg: '#FEF3C7' },
  { key: 'checkSubsidy',   abbr: 'SB', color: '#7C3AED',       bg: '#F5F3FF' },
];

const FARM_STATS = [
  { key: 'land',     abbr: 'LA', label: 'totalLand',    color: COLORS.primary,  bg: COLORS.primaryBg },
  { key: 'crop',     abbr: 'CR', label: 'primaryCrop',  color: COLORS.gold,     bg: '#FEF3C7' },
  { key: 'village',  abbr: 'VL', label: 'location',     color: COLORS.info,     bg: '#DBEAFE' },
  { key: 'district', abbr: 'DT', label: 'district',     color: '#7C3AED',       bg: '#F5F3FF' },
];

export default function HomeScreen() {
  const { state, refreshFarmer } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const farmer = state.farmer;
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);
  const stackNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNav = useNavigation<BottomTabNavigationProp<TabParamList>>();

  const fetchRecentNotifs = useCallback(() => {
    if (state.mobile) {
      api.getNotifications(state.mobile)
        .then((n) => setRecentNotifs(n.slice(0, 3)))
        .catch(() => {});
    }
  }, [state.mobile]);

  useEffect(() => {
    fetchRecentNotifs();
    refreshFarmer();
  }, [fetchRecentNotifs]);

  useFocusEffect(
    useCallback(() => {
      fetchRecentNotifs();
      refreshFarmer();
    }, [fetchRecentNotifs]),
  );

  const initials = (farmer?.name && farmer.name !== '—')
    ? farmer.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  function handleQuickAction(key: string) {
    if (key === 'raiseGrievance') { stackNav.navigate('Grievance'); return; }
    if (key === 'applyScheme') { tabNav.navigate('Schemes', { initialTab: 'schemes' }); return; }
    if (key === 'fileInsurance') { tabNav.navigate('Schemes', { initialTab: 'insurance' }); return; }
    if (key === 'checkSubsidy') { tabNav.navigate('Schemes', { initialTab: 'subsidies' }); return; }
  }

  const greetName = farmer?.name && farmer.name !== '—' ? farmer.name.split(' ')[0] : '';

  function notifTypeColor(type: string) {
    if (type === 'approval') return COLORS.primary;
    if (type === 'rejection') return COLORS.error;
    if (type === 'scheme') return COLORS.info;
    if (type === 'subsidy') return '#7C3AED';
    return COLORS.gold;
  }
  function notifTypeAbbr(type: string) {
    if (type === 'approval') return '✓';
    if (type === 'rejection') return '✕';
    if (type === 'scheme') return 'SC';
    if (type === 'subsidy') return 'SB';
    return 'NT';
  }

  const farmStatValue = (key: string) => {
    if (!farmer) return '—';
    if (key === 'land') return farmer.land ? `${farmer.land} ha` : '—';
    if (key === 'crop') return (farmer.crop && farmer.crop !== '—') ? farmer.crop : '—';
    if (key === 'village') return (farmer.village && farmer.village !== '—') ? farmer.village : '—';
    if (key === 'district') return (farmer.district && farmer.district !== '—') ? farmer.district : '—';
    return '—';
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* White logo header */}
      <View style={styles.topBar}>
        <View style={styles.topBarSide} />
        <View style={styles.headerLogoWrap}>
          <Image source={require('../../assets/brand-logo-new.png')} style={styles.headerLogo} />
        </View>
        <View style={styles.topBarSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroText}>
              <Text style={styles.greeting}>
                {t('welcome')}{greetName ? `, ${greetName}` : ''}
              </Text>
              <Text style={styles.greetingSub}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>{t('activeStatus')}</Text>
            </View>
            {farmer?.farmerId && (
              <Text style={styles.farmerIdText}>ID: {farmer.farmerId}</Text>
            )}
          </View>
        </View>

        {/* Farm Summary */}
        <View style={styles.farmCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>{t('farmSummary')}</Text>
            <View style={styles.iconBox2L}>
              <Text style={styles.iconBox2LText}>FS</Text>
            </View>
          </View>
          <View style={styles.farmGrid}>
            {FARM_STATS.map((stat) => (
              <View key={stat.key} style={[styles.farmStat, { borderTopColor: stat.color }]}>
                <View style={[styles.statIconBox, { backgroundColor: stat.bg }]}>
                  <Text style={[styles.statIconText, { color: stat.color }]}>{stat.abbr}</Text>
                </View>
                <Text style={styles.statLabel}>{t(stat.label)}</Text>
                <Text style={[styles.statValue, { color: stat.color }]} numberOfLines={1}>
                  {farmStatValue(stat.key)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={[styles.actionBtn, { borderTopColor: a.color }]}
              onPress={() => handleQuickAction(a.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: a.bg }]}>
                <Text style={[styles.actionIconText, { color: a.color }]}>{a.abbr}</Text>
              </View>
              <Text style={styles.actionLabel}>{t(a.key)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Notifications */}
        {recentNotifs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>{t('recentNotifs')}</Text>
            </View>
            <View style={styles.notifList}>
              {recentNotifs.map((n) => {
                const color = notifTypeColor(n.type);
                const abbr = notifTypeAbbr(n.type);
                return (
                  <View key={n.notificationId} style={[styles.notifRow, !n.read && styles.notifRowUnread]}>
                    <View style={[styles.notifIconBox, { backgroundColor: color + '18' }]}>
                      <Text style={[styles.notifIconText, { color }]}>{abbr}</Text>
                    </View>
                    <View style={styles.notifInfo}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                    </View>
                    {!n.read && <View style={styles.unreadDot} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Weather Advisory */}
        <View style={styles.advisoryCard}>
          <View style={[styles.advisoryIconBox, { backgroundColor: '#FEF9C3' }]}>
            <Text style={[styles.advisoryIconText, { color: '#92400E' }]}>WA</Text>
          </View>
          <View style={styles.advisoryInfo}>
            <Text style={styles.advisoryTitle}>Weather Advisory</Text>
            <Text style={styles.advisoryText}>Good conditions for sowing this week. Moderate rainfall expected in your district.</Text>
          </View>
        </View>

        <View style={styles.brandingStrip}>
          <Text style={styles.brandingText}>Krushi Suvidha  •  Govt. of Maharashtra</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarSide: { width: 90 },
  headerLogoWrap: { width: 220, height: 74, overflow: 'hidden' },
  headerLogo: { width: 220, height: 220, marginTop: -71 },

  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },

  heroCard: {
    backgroundColor: COLORS.primaryDark, borderRadius: RADIUS.xl,
    padding: 20, marginBottom: 16, ...SHADOW.md,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  heroText: { flex: 1 },
  greeting: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  greetingSub: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.6)' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.gold + '60',
  },
  avatarText: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.white },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  statusPillText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  farmerIdText: { color: 'rgba(255,255,255,0.5)', fontSize: FONT_SIZE.xs, fontWeight: '600' },

  farmCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16,
    marginBottom: 20, ...SHADOW.sm,
  },
  section: { marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text },
  iconBox2L: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.primary + '40',
  },
  iconBox2LText: { fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },

  farmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  farmStat: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: 14, alignItems: 'center', gap: 6, borderTopWidth: 3, ...SHADOW.sm,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  statIconBox: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  statIconText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center', fontWeight: '600' },
  statValue: { fontSize: FONT_SIZE.sm, fontWeight: '800', textAlign: 'center' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionBtn: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, alignItems: 'center', gap: 10, ...SHADOW.sm, borderTopWidth: 3,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  actionIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionIconText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  actionLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, textAlign: 'center' },

  notifList: { gap: 10 },
  notifRow: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, ...SHADOW.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  notifRowUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  notifIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifIconText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  notifBody: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 16 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6 },

  advisoryCard: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.lg, padding: 16,
    flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.primaryLight,
  },
  advisoryIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  advisoryIconText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  advisoryInfo: { flex: 1 },
  advisoryTitle: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 4 },
  advisoryText: { fontSize: FONT_SIZE.sm, color: COLORS.primaryMid, lineHeight: 18 },

  brandingStrip: {
    alignItems: 'center', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4,
  },
  brandingText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5 },
});
