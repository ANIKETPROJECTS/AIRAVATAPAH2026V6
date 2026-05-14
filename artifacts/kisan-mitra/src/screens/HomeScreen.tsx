import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, RADIUS, SHADOW, T } from '../constants';
import { Notification } from '../types';
import type { RootStackParamList, TabParamList } from '../navigation/AppNavigator';

const QUICK_ACTIONS = [
  { key: 'applyScheme',    icon: require('../../assets/icon-action-schemes.png'),   color: COLORS.primary,  bg: '#F0FDF4' },
  { key: 'fileInsurance',  icon: require('../../assets/icon-action-insurance.png'), color: COLORS.info,     bg: '#EFF6FF' },
  { key: 'raiseGrievance', icon: require('../../assets/icon-action-grievance.png'), color: COLORS.gold,     bg: '#FFFBEB' },
  { key: 'checkSubsidy',   icon: require('../../assets/icon-action-subsidy.png'),   color: '#7C3AED',       bg: '#F5F3FF' },
];

const FARM_STATS = [
  { key: 'land',     icon: require('../../assets/icon-farm-land.png'),     label: 'totalLand' },
  { key: 'crop',     icon: require('../../assets/icon-farm-crop.png'),     label: 'primaryCrop' },
  { key: 'village',  icon: require('../../assets/icon-farm-village.png'),  label: 'location' },
  { key: 'district', icon: require('../../assets/icon-farm-district.png'), label: 'district' },
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
      {/* Header */}
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
              <Image
                source={require('../../assets/icon-namaste.png')}
                tintColor="#FFFFFF"
                style={styles.avatarIcon}
              />
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
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('farmSummary')}</Text>
          <View style={styles.farmGrid}>
            {FARM_STATS.map((stat) => (
              <View key={stat.key} style={styles.farmStat}>
                <Image source={stat.icon} style={styles.statIcon} />
                <Text style={styles.statLabel}>{t(stat.label)}</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                  {farmStatValue(stat.key)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
        </View>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={[styles.actionBtn, { backgroundColor: a.bg }]}
              onPress={() => handleQuickAction(a.key)}
              activeOpacity={0.8}
            >
              <Image source={a.icon} style={styles.actionIcon} />
              <Text style={[styles.actionLabel, { color: a.color }]}>{t(a.key)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Notifications */}
        {recentNotifs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('recentNotifs')}</Text>
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
                    {!n.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Weather Advisory */}
        <View style={styles.weatherCard}>
          <Image source={require('../../assets/icon-weather.png')} style={styles.weatherIcon} />
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherTitle}>Weather Advisory</Text>
            <Text style={styles.weatherText}>Good conditions for sowing this week. Moderate rainfall expected in your district.</Text>
          </View>
        </View>

        <View style={styles.brandingStrip}>
          <Text style={styles.brandingText}>Krushi Suvidha  •  Govt. of Maharashtra</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },

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

  /* Hero */
  heroCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    ...SHADOW.md,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  heroText: { flex: 1 },
  greeting: {
    fontSize: 22,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: COLORS.white,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  greetingSub: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: 'rgba(255,255,255,0.55)',
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.gold + '70',
  },
  avatarIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  statusPillText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  farmerIdText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
  },

  /* Card wrapper */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    ...SHADOW.sm,
  },

  sectionHeader: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
    marginBottom: 14,
    letterSpacing: 0.2,
  },

  /* Farm Summary */
  farmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  farmStat: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  statIcon: { width: 44, height: 44, resizeMode: 'contain' },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
    textAlign: 'center',
  },

  /* Quick Actions */
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  actionBtn: {
    width: '47%',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  actionIcon: { width: 46, height: 46, resizeMode: 'contain' },
  actionLabel: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Notifications */
  notifList: { gap: 10 },
  notifRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  notifRowUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary, backgroundColor: '#F0FDF4' },
  notifIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  notifIconText: { fontSize: 12, fontFamily: 'Poppins', fontWeight: '600' },
  notifInfo: { flex: 1 },
  notifTitle: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
    marginBottom: 3,
  },
  notifBody: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#6B7280',
    lineHeight: 17,
  },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },

  /* Weather Advisory */
  weatherCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  weatherIcon: { width: 56, height: 56, resizeMode: 'contain' },
  weatherInfo: { flex: 1 },
  weatherTitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1E40AF',
    marginBottom: 4,
  },
  weatherText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#3B82F6',
    lineHeight: 18,
  },

  /* Branding */
  brandingStrip: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAECEF',
    marginTop: 4,
  },
  brandingText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },
});
