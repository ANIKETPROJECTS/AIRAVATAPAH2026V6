import React from 'react';
import { View, Image, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../constants';

interface LogoHeaderProps {
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export function LogoHeader({ leftAction, rightAction }: LogoHeaderProps) {
  return (
    <View style={styles.topBar}>
      <View style={styles.side}>{leftAction ?? null}</View>
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/brand-logo-new.png')} style={styles.logo} />
      </View>
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{rightAction ?? null}</View>
    </View>
  );
}

interface PillButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  color?: string;
}

export function PillButton({ label, onPress, loading, color = COLORS.primaryDark }: PillButtonProps) {
  return (
    <TouchableOpacity style={styles.pill} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      {loading
        ? <ActivityIndicator size="small" color={color} />
        : <Text style={[styles.pillText, { color }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.backBtn} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.backIcon}>←</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  side: { width: 90, minHeight: 40, justifyContent: 'center' },
  logoWrap: { width: 220, height: 74, overflow: 'hidden' },
  logo: { width: 220, height: 220, marginTop: -71 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: 80,
  },
  pillText: { fontSize: 12, fontFamily: 'Poppins', fontWeight: '500' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  backIcon: { color: COLORS.primaryDark, fontSize: 18, fontWeight: '700', marginTop: -1 },
});
