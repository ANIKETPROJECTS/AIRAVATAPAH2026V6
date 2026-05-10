import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { api, GrievanceRecord } from '../api';
import { COLORS, FONT_SIZE, RADIUS, SHADOW } from '../constants';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

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

function statusColor(s: string) {
  if (s === 'Resolved') return COLORS.primary;
  if (s === 'In Progress') return COLORS.info;
  if (s === 'Escalated') return COLORS.error;
  if (s === 'Rejected') return COLORS.error;
  return COLORS.gold;
}

export default function GrievanceScreen() {
  const navigation = useNavigation<NavProp>();
  const { state } = useAuth();
  const farmer = state.farmer;

  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myGrievances, setMyGrievances] = useState<GrievanceRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function selectCategory(cat: string) {
    setCategory(cat);
    if (cat !== 'Other') setCustomCategory('');
    setSubject(SUBJECT_MAP[cat] ?? '');
  }

  function loadGrievances() {
    if (!state.mobile) return;
    setLoadingList(true);
    api.getGrievances(state.mobile)
      .then(data => setMyGrievances(data))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }

  useEffect(() => {
    loadGrievances();
  }, [state.mobile, success]);

  async function pickAttachment() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const res = await fetch(asset.uri);
      const blob = await res.blob();
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1] ?? '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setAttachment({ name: asset.name ?? 'attachment', base64, mimeType: asset.mimeType ?? 'application/octet-stream' });
    } catch {
      Alert.alert('Error', 'Could not pick file. Please try again.');
    }
  }

  async function handleSubmit() {
    const effectiveCat = category === 'Other' ? (customCategory.trim() || 'Other') : category;
    if (!effectiveCat) { Alert.alert('Required', 'Please select a category.'); return; }
    if (!subject.trim()) { Alert.alert('Required', 'Please enter a subject.'); return; }
    if (!description.trim()) { Alert.alert('Required', 'Please describe your grievance.'); return; }

    setSubmitting(true);
    try {
      await api.submitGrievance({
        mobile: state.mobile ?? '',
        farmerId: farmer?.farmerId ?? null,
        farmerName: farmer?.name ?? null,
        category,
        customCategory: category === 'Other' ? customCategory.trim() : undefined,
        subject: subject.trim(),
        description: description.trim(),
        attachments: attachment ? [attachment] : [],
      });
      setSuccess(true);
      setCategory('');
      setCustomCategory('');
      setSubject('');
      setDescription('');
      setAttachment(null);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleView(grievanceId: string) {
    navigation.navigate('GrievanceDetail', { grievanceId, editMode: false });
  }

  function handleEdit(grievanceId: string) {
    navigation.navigate('GrievanceDetail', { grievanceId, editMode: true });
  }

  function handleDelete(grievance: GrievanceRecord) {
    Alert.alert(
      'Delete Grievance',
      `Are you sure you want to delete this grievance?\n\n"${grievance.subject}"\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(grievance.grievanceId);
            try {
              await api.deleteGrievance(grievance.grievanceId);
              setMyGrievances(prev => prev.filter(g => g.grievanceId !== grievance.grievanceId));
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not delete. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle}>कृषी सुविधा</Text>
          <Text style={styles.topBarSub}>Raise Grievance / तक्रार नोंदवा</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {success && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✅  Your grievance has been submitted successfully! We will review it shortly.</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📢  New Grievance</Text>

          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.chipWrap}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => selectCategory(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {category === 'Other' && (
            <TextInput
              style={styles.input}
              placeholder="Describe the category..."
              placeholderTextColor={COLORS.textMuted}
              value={customCategory}
              onChangeText={setCustomCategory}
            />
          )}

          <Text style={[styles.label, { marginTop: 16 }]}>Subject <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Brief subject of your grievance"
            placeholderTextColor={COLORS.textMuted}
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Please describe your grievance in detail. Include dates, officer names, or any relevant reference numbers."
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={Platform.OS === 'web' ? 5 : undefined}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Attachment <Text style={styles.optional}>(optional)</Text></Text>
          {attachment ? (
            <View style={styles.attachmentRow}>
              <Text style={styles.attachmentIcon}>📎</Text>
              <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
              <TouchableOpacity onPress={() => setAttachment(null)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.attachBtn} onPress={pickAttachment} activeOpacity={0.8}>
              <Text style={styles.attachBtnText}>📎  Attach File / Image</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (submitting || !category || !subject.trim() || !description.trim()) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !category || !subject.trim() || !description.trim()}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.submitBtnText}>📤  Submit Grievance</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋  My Previous Grievances</Text>
          {loadingList ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
          ) : myGrievances.length === 0 ? (
            <Text style={styles.emptyText}>No grievances filed yet.</Text>
          ) : (
            myGrievances.map(g => (
              <View key={g.grievanceId} style={styles.grievanceRow}>
                <View style={styles.grievanceHeader}>
                  <Text style={styles.grievanceId}>{g.grievanceId}</Text>
                  <View style={[styles.statusPill, { backgroundColor: statusColor(g.status) + '20', borderColor: statusColor(g.status) + '60' }]}>
                    <Text style={[styles.statusPillText, { color: statusColor(g.status) }]}>{g.status}</Text>
                  </View>
                </View>
                <Text style={styles.grievanceSubject} numberOfLines={1}>{g.subject}</Text>
                <Text style={styles.grievanceMeta}>{g.category}  •  {new Date(g.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleView(g.grievanceId)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnText}>👁 View</Text>
                  </TouchableOpacity>

                  {g.status === 'Open' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnEdit]}
                      onPress={() => handleEdit(g.grievanceId)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, styles.actionBtnEditText]}>✏️ Edit</Text>
                    </TouchableOpacity>
                  )}

                  {(g.status === 'Open' || g.status === 'Rejected') && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDelete]}
                      onPress={() => handleDelete(g)}
                      disabled={deletingId === g.grievanceId}
                      activeOpacity={0.8}
                    >
                      {deletingId === g.grievanceId
                        ? <ActivityIndicator size="small" color={COLORS.error} />
                        : <Text style={[styles.actionBtnText, styles.actionBtnDeleteText]}>🗑 Delete</Text>
                      }
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

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
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 18,
    marginBottom: 14, ...SHADOW.sm,
  },
  cardTitle: { fontSize: FONT_SIZE.base, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 14 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  required: { color: COLORS.error },
  optional: { color: COLORS.textMuted, fontWeight: '400' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
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
  attachBtn: {
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
    borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
  },
  attachBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.primaryDark, fontWeight: '600' },
  attachmentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  attachmentIcon: { fontSize: 18 },
  attachmentName: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.primaryDark, fontWeight: '600' },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.errorLight,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: COLORS.error, fontSize: FONT_SIZE.xs, fontWeight: '800' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: 20, ...SHADOW.sm,
  },
  submitBtnDisabled: { backgroundColor: COLORS.textMuted },
  submitBtnText: { color: COLORS.white, fontSize: FONT_SIZE.base, fontWeight: '800' },
  successBanner: {
    backgroundColor: '#DCFCE7', borderRadius: RADIUS.md, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  successText: { color: COLORS.primaryDark, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', paddingVertical: 16 },
  grievanceRow: {
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  grievanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  grievanceId: { fontSize: FONT_SIZE.xs, fontFamily: 'monospace', color: COLORS.textMuted, fontWeight: '700' },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1,
  },
  statusPillText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  grievanceSubject: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  grievanceMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  actionBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.primary },
  actionBtnEdit: { backgroundColor: '#FFFBEB', borderColor: '#D97706' },
  actionBtnEditText: { color: '#D97706' },
  actionBtnDelete: { backgroundColor: '#FFF1F2', borderColor: COLORS.error },
  actionBtnDeleteText: { color: COLORS.error },
});
