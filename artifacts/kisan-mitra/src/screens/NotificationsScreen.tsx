import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, ActivityIndicator, RefreshControl, ScrollView, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
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

function notifAbbr(type: string): string {
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
    useCallback(() => {
      fetchNotifs();
    }, [fetchNotifs]),
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
          <Text style={styles.unreadBannerText}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      {notifs.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.center}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          <View style={styles.emptyIconBox}>
            <Text style={styles.emptyIconText}>NT</Text>
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
            const abbr = notifAbbr(item.type);
            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                onPress={() => !item.read && markRead(item.notificationId)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
                  <Text style={[styles.iconBoxText, { color }]}>{abbr}</Text>
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTopRow}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                    {!item.read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
                  </View>
                  <Text style={styles.notifBody} numberOfLines={3}>{item.body}</Text>
                  <View style={styles.notifFooter}>
                    <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
                    {!item.read && (
                      <View style={[styles.tapToRead, { borderColor: color }]}>
                        <Text style={[styles.tapToReadText, { color }]}>Tap to mark read</Text>
                      </View>
                    )}
                  </View>
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
  safe: { flex: 1, backgroundColor: COLORS.background },

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
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primary,
  },
  markAllText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },

  unreadBanner: {
    backgroundColor: COLORS.primaryBg, paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  unreadDotLarge: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  unreadBannerText: { fontSize: FONT_SIZE.sm, color: COLORS.primaryDark, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primaryLight,
  },
  emptyIconText: { fontSize: 16, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textSecondary },
  emptySub: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  list: { padding: 16, gap: 10 },
  notifCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start', ...SHADOW.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  notifCardUnread: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconBoxText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  notifContent: { flex: 1 },
  notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { flex: 1, fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.text },
  unreadDot: { width: 9, height: 9, borderRadius: 5, marginLeft: 8 },
  notifBody: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 8 },
  notifFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  tapToRead: { borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  tapToReadText: { fontSize: 10, fontWeight: '700' },
});
