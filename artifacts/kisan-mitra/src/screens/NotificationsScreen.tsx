import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, RADIUS, SHADOW, T } from '../constants';
import { Notification } from '../types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function notifEmoji(type: string): string {
  switch (type) {
    case 'approval':  return '✓';
    case 'rejection': return '✕';
    case 'scheme':    return 'SC';
    case 'subsidy':   return 'SB';
    case 'insurance': return 'IN';
    default:          return 'NT';
  }
}

function notifColor(type: string): string {
  switch (type) {
    case 'approval':  return COLORS.primary;
    case 'rejection': return COLORS.error;
    case 'scheme':    return COLORS.info;
    case 'subsidy':   return '#7C3AED';
    default:          return COLORS.gold;
  }
}

function notifTypeLabel(type: string): string {
  switch (type) {
    case 'approval':  return 'Approval';
    case 'rejection': return 'Rejection';
    case 'scheme':    return 'Scheme';
    case 'subsidy':   return 'Subsidy';
    case 'insurance': return 'Insurance';
    default:          return 'Notice';
  }
}

export default function NotificationsScreen() {
  const { state } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async () => {
    if (!state.mobile) return;
    try {
      const data = await api.getNotifications(state.mobile);
      setNotifs(data);
    } catch {}
  }, [state.mobile]);

  useEffect(() => {
    fetchNotifs().finally(() => setLoading(false));
  }, [fetchNotifs]);

  useFocusEffect(
    useCallback(() => { fetchNotifs(); }, [fetchNotifs]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifs();
    setRefreshing(false);
  }, [fetchNotifs]);

  async function markRead(id: string) {
    try {
      await api.markNotificationRead(id);
      setNotifs((prev) => prev.map((n) => n.notificationId === id ? { ...n, read: true } : n));
    } catch {}
  }

  async function markAllRead() {
    if (!state.mobile) return;
    try {
      await api.markAllRead(state.mobile);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  }

  const unreadCount = notifs.filter((n) => !n.read).length;

  const Header = (
    <View style={styles.topBar}>
      <View style={styles.topBarSide} />
      <View style={styles.headerLogoWrap}>
        <Image source={require('../../assets/brand-logo-new.png')} style={styles.headerLogo} />
      </View>
      <View style={[styles.topBarSide, { alignItems: 'flex-end' }]}>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        {Header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {Header}

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <View style={styles.unreadDotLarge} />
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {notifs.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.center}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔔</Text>
          </View>
          <Text style={styles.emptyTitle}>{t('noNotifications')}</Text>
          <Text style={styles.emptySub}>You will receive updates here when the admin takes action on your registration.</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item.notificationId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => {
            const color = notifColor(item.type);
            const abbr = notifEmoji(item.type);
            const typeLabel = notifTypeLabel(item.type);
            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                onPress={() => !item.read && markRead(item.notificationId)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
                  <Text style={[styles.iconCircleText, { color }]}>{abbr}</Text>
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTopRow}>
                    <View style={[styles.typePill, { backgroundColor: color + '15', borderColor: color + '40' }]}>
                      <Text style={[styles.typePillText, { color }]}>{typeLabel}</Text>
                    </View>
                    <View style={styles.timeRow}>
                      {!item.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
                      <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                  {!item.read && (
                    <Text style={[styles.tapHint, { color }]}>Tap to mark as read</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  topBarSide: { width: 100, justifyContent: 'center' },
  headerLogoWrap: { width: 220, height: 74, overflow: 'hidden' },
  headerLogo: { width: 220, height: 220, marginTop: -71 },

  markAllBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: '#F0FDF4',
    borderWidth: 1, borderColor: COLORS.primary,
  },
  markAllText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primary,
  },

  unreadBanner: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 18, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#BBF7D0',
  },
  unreadDotLarge: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.primary },
  unreadBannerText: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primaryDark,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },
  emptyBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#BBF7D0',
    marginBottom: 4,
  },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#374151',
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  list: { padding: 16, gap: 12 },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  notifCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    backgroundColor: '#FAFFFE',
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  iconCircleText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  notifContent: { flex: 1 },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typePill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  typePillText: {
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  notifTime: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  tapHint: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
});
