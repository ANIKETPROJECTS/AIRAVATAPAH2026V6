import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api, GrievanceRecord } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW } from '../constants';
import { RootStackParamList } from '../navigation/AppNavigator';

const CATEGORIES = [
  'Subsidy Delay',
  'Wrong Beneficiary',
  'Document Issue',
  'Officer Misconduct',
  'Technical Error',
  'Portal/App Issue',
  'Other',
];

const SUBJECT_MAP: Record<string, string> = {
  'Subsidy Delay': 'My subsidy amount has not been credited',
  'Wrong Beneficiary': 'I have been incorrectly listed as wrong beneficiary',
  'Document Issue': 'There is an issue with my submitted documents',
  'Officer Misconduct': 'I would like to report officer misconduct',
  'Technical Error': 'I am facing a technical error in the system',
  'Portal/App Issue': 'I am facing issues with the app or portal',
  'Other': '',
};

type RouteType = RouteProp<RootStackParamList, 'GrievanceDetail'>;

function statusColor(s: string) {
  if (s === 'Resolved') return COLORS.primary;
  if (s === 'In Progress') return COLORS.info;
  if (s === 'Escalated') return COLORS.error;
  if (s === 'Rejected') return COLORS.error;
  return COLORS.gold;
}

export default function GrievanceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { grievanceId, editMode: initialEditMode = false } = route.params;

  const [grievance, setGrievance] = useState<GrievanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [editCategory, setEditCategory] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGrievance();
  }, [grievanceId]);

  async function loadGrievance() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getGrievanceById(grievanceId);
      setGrievance(data);
      setEditCategory(data.category);
      setEditSubject(data.subject);
      setEditDescription(data.description);
    } catch {
      setError('Could not load grievance details. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectCategory(cat: string) {
    setEditCategory(cat);
    if (SUBJECT_MAP[cat]) {
      setEditSubject(SUBJECT_MAP[cat]);
    }
  }

  async function handleSave() {
    if (!editSubject.trim()) { Alert.alert('Required', 'Please enter a subject.'); return; }
    if (!editDescription.trim()) { Alert.alert('Required', 'Please describe your grievance.'); return; }
    setSaving(true);
    try {
      const updated = await api.updateGrievance(grievanceId, {
        category: editCategory,
        subject: editSubject.trim(),
        description: editDescription.trim(),
      });
      setGrievance(updated);
      setIsEditing(false);
      Alert.alert('Success', 'Your grievance has been updated.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Grievance Details</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !grievance) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Grievance Details</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: COLORS.error, textAlign: 'center', fontSize: FONT_SIZE.sm, marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadGrievance}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canEdit = grievance.status === 'Open';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle}>कृषी सुविधा</Text>
          <Text style={styles.topBarSub}>Grievance Details / तक्रार तपशील</Text>
        </View>
        {canEdit && !isEditing && (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ID + Status row */}
        <View style={styles.card}>
          <View style={styles.idRow}>
            <Text style={styles.grId}>{grievance.grievanceId}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor(grievance.status) + '20', borderColor: statusColor(grievance.status) + '60' }]}>
              <Text style={[styles.statusPillText, { color: statusColor(grievance.status) }]}>{grievance.status}</Text>
            </View>
          </View>
          <Text style={styles.metaDate}>Filed: {new Date(grievance.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>

        {/* Edit form OR view */}
        {isEditing ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✏️  Edit Grievance</Text>

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipWrap}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, editCategory === cat && styles.chipActive]}
                  onPress={() => handleSelectCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, editCategory === cat && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Subject <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={editSubject}
              onChangeText={setEditSubject}
              placeholder="Brief subject of your grievance"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Description <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Describe your grievance in detail..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={Platform.OS === 'web' ? 5 : undefined}
              textAlignVertical="top"
            />

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.saveBtn, (saving || !editSubject.trim() || !editDescription.trim()) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving || !editSubject.trim() || !editDescription.trim()}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>💾 Save Changes</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Details card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📋  Grievance Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{grievance.category}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Subject</Text>
                <Text style={styles.detailValue}>{grievance.subject}</Text>
              </View>
              <View style={styles.divider} />

              <Text style={styles.detailLabel}>Description</Text>
              <Text style={[styles.detailValue, { marginTop: 6 }]}>{grievance.description}</Text>
            </View>

            {/* Rejection reason */}
            {grievance.status === 'Rejected' && grievance.rejectionReason && (
              <View style={[styles.card, styles.rejectedCard]}>
                <Text style={styles.rejectedTitle}>❌  Rejection Reason</Text>
                <Text style={styles.rejectedText}>{grievance.rejectionReason}</Text>
              </View>
            )}

            {/* Admin reply */}
            {grievance.adminReply ? (
              <View style={[styles.card, styles.replyCard]}>
                <Text style={styles.replyTitle}>💬  Response from Agriculture Department</Text>
                <Text style={styles.replyText}>{grievance.adminReply}</Text>
                {grievance.resolvedAt && (
                  <Text style={styles.resolvedDate}>
                    ✅ Resolved on {new Date(grievance.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                )}
              </View>
            ) : grievance.status === 'Open' ? (
              <View style={[styles.card, styles.pendingCard]}>
                <Text style={styles.pendingText}>⏳  Your grievance is under review. We will respond shortly.</Text>
              </View>
            ) : null}

            {/* Assigned officer */}
            {grievance.assignedTo && (
              <View style={styles.card}>
                <Text style={styles.detailLabel}>Assigned Officer</Text>
                <Text style={[styles.detailValue, { marginTop: 4 }]}>{grievance.assignedTo}</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    backgroundColor: COLORS.primaryDark, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  topBarTitle: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.gold },
  topBarSub: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  editBtnText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 18,
    marginBottom: 14, ...SHADOW.sm,
  },
  cardTitle: { fontSize: FONT_SIZE.base, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 14 },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  grId: { fontSize: FONT_SIZE.sm, fontFamily: 'monospace', fontWeight: '700', color: COLORS.textMuted },
  statusPill: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1,
  },
  statusPillText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priorityPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1 },
  priorityHigh: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  priorityMed: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  priorityLow: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  priorityText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  priorityHighText: { color: '#DC2626' },
  priorityMedText: { color: '#D97706' },
  priorityLowText: { color: '#16A34A' },
  metaDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  detailLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 8 },
  replyCard: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  replyTitle: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 8 },
  replyText: { fontSize: FONT_SIZE.sm, color: COLORS.text, lineHeight: 22 },
  resolvedDate: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '700', marginTop: 10 },
  rejectedCard: { backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3' },
  rejectedTitle: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: '#DC2626', marginBottom: 8 },
  rejectedText: { fontSize: FONT_SIZE.sm, color: '#7F1D1D', lineHeight: 22 },
  pendingCard: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  pendingText: { fontSize: FONT_SIZE.sm, color: '#92400E', fontWeight: '600' },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  required: { color: COLORS.error },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.primaryBg,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  chipText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.primaryDark },
  chipTextActive: { color: COLORS.white },
  input: {
    borderWidth: 1.5, borderColor: '#D1D5DB', borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: FONT_SIZE.sm,
    color: COLORS.text, backgroundColor: '#FAFAFA',
  },
  textarea: { minHeight: 100, paddingTop: 12 },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  saveBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 14, alignItems: 'center', ...SHADOW.sm,
  },
  saveBtnDisabled: { backgroundColor: COLORS.textMuted },
  saveBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '800' },
  cancelBtn: {
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  retryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  retryBtnText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
});
