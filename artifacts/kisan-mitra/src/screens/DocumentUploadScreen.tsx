import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, Platform, Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { RADIUS, T } from '../constants';
import { REQUIRED_DOCUMENTS, DocUploadState, DocUploadStatus, DocumentTypeId } from '../types';

interface Props {
  isReupload?: boolean;
  onCancelReupload?: () => void;
}

export default function DocumentUploadScreen({ isReupload, onCancelReupload }: Props) {
  const { state, updateFarmer, logout } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;

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

  const [docStates, setDocStates] = useState<Record<DocumentTypeId, DocUploadState>>({
    aadhar: { status: 'idle' },
    bank_passbook: { status: 'idle' },
    form7: { status: 'idle' },
    form12: { status: 'idle' },
    form8a: { status: 'idle' },
  });
  const [submitting, setSubmitting] = useState(false);

  function setDoc(id: DocumentTypeId, patch: Partial<DocUploadState>) {
    setDocStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const mobile = state.mobile ?? '';
  const allDone = REQUIRED_DOCUMENTS.every((d) => docStates[d.id].status === 'done');
  const doneCount = REQUIRED_DOCUMENTS.filter((d) => docStates[d.id].status === 'done').length;
  const canSubmit = doneCount >= 1;
  const pct = (doneCount / REQUIRED_DOCUMENTS.length) * 100;

  async function pollUntilDone(docId: DocumentTypeId, requestId: string) {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      try {
        const result = await api.pollExtraction(requestId);
        if (result.status === 'complete') { setDoc(docId, { status: 'done' }); return; }
        if (result.status === 'error') { setDoc(docId, { status: 'error', error: result.error ?? 'Processing failed' }); return; }
      } catch { /* keep polling */ }
    }
    setDoc(docId, { status: 'error', error: 'Processing timed out. Please re-upload.' });
  }

  async function pickAndUpload(docId: DocumentTypeId) {
    if (!mobile) { Alert.alert('Error', 'Session expired. Please login again.'); return; }
    setDoc(docId, { status: 'picking', error: undefined });
    try {
      let fileUri = '', fileName = `${docId}.pdf`, fileMime = 'application/pdf';
      if (Platform.OS === 'web') {
        const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: false });
        if (result.canceled || !result.assets?.[0]) { setDoc(docId, { status: 'idle' }); return; }
        const asset = result.assets[0];
        fileUri = asset.uri; fileName = asset.name ?? fileName; fileMime = asset.mimeType ?? fileMime;
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission needed', 'Please allow access to your photos.'); setDoc(docId, { status: 'idle' }); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: false });
        if (result.canceled || !result.assets?.[0]) { setDoc(docId, { status: 'idle' }); return; }
        const asset = result.assets[0];
        fileUri = asset.uri; fileName = `${docId}.jpg`; fileMime = 'image/jpeg';
      }
      setDoc(docId, { status: 'uploading', fileName });
      const submitResult = await api.uploadDocument(fileUri, fileName, fileMime, docId, mobile);
      const requestId = submitResult.request_id;
      setDoc(docId, { status: 'processing', requestId });
      pollUntilDone(docId, requestId);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setDoc(docId, { status: 'error', error: errMsg });
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const farmer = await api.submitRegistration(mobile);
      updateFarmer(farmer);
    } catch {
      updateFarmer({ farmerId: '', mobile, name: '—', status: 'Pending', addedAt: new Date().toISOString() });
    } finally {
      setSubmitting(false);
    }
  }

  function statusInfo(s: DocUploadStatus): { label: string; color: string; bg: string } {
    switch (s) {
      case 'done':       return { label: '✓ अपलोड झाले',    color: '#16A34A', bg: '#F0FDF4' };
      case 'uploading':  return { label: 'अपलोड होत आहे…',  color: '#2563EB', bg: '#EFF6FF' };
      case 'processing': return { label: 'प्रक्रिया होत आहे…', color: '#D97706', bg: '#FFFBEB' };
      case 'error':      return { label: 'अयशस्वी',          color: '#DC2626', bg: '#FEF2F2' };
      case 'picking':    return { label: 'निवडत आहे…',       color: '#6B7280', bg: '#F9FAFB' };
      default:           return { label: 'अपलोड बाकी',       color: '#6B7280', bg: '#F1F5F9' };
    }
  }

  const docLabel = (d: typeof REQUIRED_DOCUMENTS[0]) =>
    state.lang === 'hi' ? d.labelHi : state.lang === 'mr' ? d.labelMr : d.label;

  const reuploadTitle =
    state.lang === 'mr' ? 'कागदपत्रे पुन्हा अपलोड करा' :
    state.lang === 'hi' ? 'दस्तावेज़ पुनः अपलोड करें' : 'Re-upload Documents';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topBar}>
        {isReupload && onCancelReupload ? (
          <TouchableOpacity onPress={onCancelReupload} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.headerLogoWrap}>
          <Image
            source={require('../../assets/brand-logo-new.png')}
            style={styles.headerLogo}
          />
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Re-upload banner */}
        {isReupload && (
          <View style={styles.reuploadBanner}>
            <Text style={styles.reuploadBannerIcon}>🔄</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.reuploadBannerTitle}>{reuploadTitle}</Text>
              <Text style={styles.reuploadBannerSub}>
                नाकारण्याचे कारण वाचा आणि योग्य कागदपत्रे अपलोड करा.
              </Text>
            </View>
          </View>
        )}

        {/* Hero */}
        {!isReupload && (
          <View style={styles.heroSection}>
            <Image
              source={require('../../assets/icon-docs.png')}
              style={styles.heroIcon}
              resizeMode="contain"
            />
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>शेतकरी नोंदणी</Text>
              <Text style={styles.heroTitleEn}>Farmer Registration</Text>
              <Text style={styles.heroSub}>
                नोंदणीसाठी 5 कागदपत्रे अपलोड करा. आमचे AI आपले तपशील आपोआप वाचेल.
              </Text>
            </View>
          </View>
        )}

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>कागदपत्र अपलोड प्रगती</Text>
            <Text style={styles.progressCount}>
              <Text style={styles.progressDone}>{doneCount}</Text>
              <Text style={styles.progressOf}> / {REQUIRED_DOCUMENTS.length}</Text>
            </Text>
          </View>
          <View style={styles.segmentRow}>
            {REQUIRED_DOCUMENTS.map((d, i) => (
              <View
                key={d.id}
                style={[styles.segment, i < doneCount && styles.segmentDone]}
              />
            ))}
          </View>
          <Text style={styles.progressSub}>
            {doneCount === 0
              ? 'अद्याप कोणतेही कागदपत्र अपलोड केले नाही'
              : doneCount === REQUIRED_DOCUMENTS.length
              ? 'सर्व कागदपत्रे अपलोड झाली आहेत!'
              : `${REQUIRED_DOCUMENTS.length - doneCount} कागदपत्रे बाकी आहेत`}
          </Text>
        </View>

        {/* Document Cards */}
        <View style={styles.docList}>
          {REQUIRED_DOCUMENTS.map((doc, index) => {
            const ds = docStates[doc.id];
            const si = statusInfo(ds.status);
            const isBusy = ds.status === 'uploading' || ds.status === 'processing' || ds.status === 'picking';
            const isDone = ds.status === 'done';
            const isError = ds.status === 'error';

            return (
              <View key={doc.id} style={[styles.docRow, isDone && styles.docRowDone]}>
                <View style={styles.docNumCol}>
                  <View style={[styles.docNum, isDone && styles.docNumDone]}>
                    <Text style={[styles.docNumText, isDone && styles.docNumTextDone]}>
                      {isDone ? '✓' : `${index + 1}`}
                    </Text>
                  </View>
                  {index < REQUIRED_DOCUMENTS.length - 1 && (
                    <View style={[styles.docConnector, index < doneCount - 1 && styles.docConnectorDone]} />
                  )}
                </View>
                <View style={styles.docBody}>
                  <View style={styles.docTopRow}>
                    <View style={styles.docTextCol}>
                      <Text style={styles.docName}>{docLabel(doc)}</Text>
                      <Text style={styles.docDesc} numberOfLines={1}>{doc.description}</Text>
                      <View style={[styles.statusPill, { backgroundColor: si.bg }]}>
                        <Text style={[styles.statusPillText, { color: si.color }]}>{si.label}</Text>
                      </View>
                      {isError && ds.error && (
                        <Text style={styles.errorText} numberOfLines={2}>{ds.error}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.uploadBtn, isDone && styles.uploadBtnDone, isBusy && styles.uploadBtnBusy]}
                      onPress={() => pickAndUpload(doc.id)}
                      disabled={isBusy}
                      activeOpacity={0.8}
                    >
                      {isBusy
                        ? <ActivityIndicator size="small" color="#FFFFFF" />
                        : <>
                            <Text style={styles.uploadBtnIcon}>{isDone ? '↑' : isError ? '↻' : '↑'}</Text>
                            <Text style={styles.uploadBtnLabel}>
                              {isDone ? 'पुन्हा' : 'अपलोड'}
                            </Text>
                          </>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Tip boxes */}
        {!canSubmit && (
          <View style={styles.infoCard}>
            <View style={styles.infoTitleRow}>
              <Image source={require('../../assets/icon-info2.png')} style={styles.infoIcon} resizeMode="contain" />
              <Text style={styles.infoTitle}>महत्त्वाची माहिती</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>किमान 1 कागदपत्र अपलोड करा, मग नोंदणी सबमिट करा</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>स्वीकृत फॉर्मेट: JPG, PNG, PDF</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>AI आपले तपशील आपोआप काढेल — फॉर्म भरण्याची गरज नाही</Text>
            </View>
          </View>
        )}

        {canSubmit && !allDone && (
          <View style={[styles.infoCard, { backgroundColor: '#FFFBEB' }]}>
            <View style={styles.infoTitleRow}>
              <Text style={{ fontSize: 16 }}>💡</Text>
              <Text style={[styles.infoTitle, { color: '#92400E' }]}>आंशिक अपलोड</Text>
            </View>
            <Text style={[styles.infoText, { color: '#92400E', paddingLeft: 0 }]}>
              {`${doneCount} / ${REQUIRED_DOCUMENTS.length} कागदपत्रे अपलोड झाली. तुम्ही आता सबमिट करू शकता किंवा आणखी कागदपत्रे अपलोड करू शकता.`}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.submitBtnText}>
                {isReupload
                  ? `पुन्हा सबमिट करा  →`
                  : `नोंदणी सबमिट करा  →${!allDone ? `  (${doneCount}/${REQUIRED_DOCUMENTS.length})` : ''}`}
              </Text>}
        </TouchableOpacity>

        {isReupload && onCancelReupload && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancelReupload}>
            <Text style={styles.cancelText}>← स्थिती पानावर परत जा</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

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
  backBtn: { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: '#14532D', fontWeight: '400' },
  headerLogoWrap: { width: 250, height: 74, overflow: 'hidden' },
  headerLogo: { width: 250, height: 250, marginTop: -65 },
  logoutBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: '#D1D5DB',
  },
  logoutText: { fontSize: 12, fontFamily: 'Poppins', fontWeight: '500', color: '#374151' },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },

  reuploadBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#FFF7ED', borderRadius: 14, padding: 16,
    marginBottom: 18, borderWidth: 1.5, borderColor: '#FED7AA',
  },
  reuploadBannerIcon: { fontSize: 26 },
  reuploadBannerTitle: { fontSize: 15, fontFamily: 'Poppins', fontWeight: '600', color: '#9A3412', marginBottom: 4 },
  reuploadBannerSub: { fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', color: '#C2410C', lineHeight: 18 },

  heroSection: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 20, paddingHorizontal: 2,
  },
  heroIcon: { width: 52, height: 52, flexShrink: 0 },
  heroTextCol: { flex: 1 },
  heroTitle: { fontSize: 18, fontFamily: 'Poppins', fontWeight: '600', color: '#000000', marginBottom: 1 },
  heroTitleEn: { fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', color: '#6B7280', marginBottom: 6 },
  heroSub: {
    fontSize: 12, fontFamily: 'Poppins', fontWeight: '400',
    color: '#374151', lineHeight: 18,
  },

  progressSection: {
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  progressLabel: { fontSize: 12, fontFamily: 'Poppins', fontWeight: '500', color: '#000000' },
  progressCount: {},
  progressDone: { fontSize: 22, fontFamily: 'Poppins', fontWeight: '600', color: '#16A34A' },
  progressOf: { fontSize: 14, fontFamily: 'Poppins', fontWeight: '400', color: '#6B7280' },
  segmentRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#E5E7EB' },
  segmentDone: { backgroundColor: '#16A34A' },
  progressSub: { fontSize: 11, fontFamily: 'Poppins', fontWeight: '400', color: '#6B7280' },

  docList: { gap: 0, marginBottom: 20 },

  docRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  docRowDone: {},

  docNumCol: { width: 36, alignItems: 'center' },
  docNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  docNumDone: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  docNumText: { fontSize: 12, fontFamily: 'Poppins', fontWeight: '600', color: '#6B7280' },
  docNumTextDone: { color: '#FFFFFF' },
  docConnector: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: 4 },
  docConnectorDone: { backgroundColor: '#16A34A' },

  docBody: { flex: 1, paddingLeft: 12 },
  docTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  docTextCol: { flex: 1 },

  docName: { fontSize: 14, fontFamily: 'Poppins', fontWeight: '500', color: '#000000', marginBottom: 2 },
  docDesc: { fontSize: 11, fontFamily: 'Poppins', fontWeight: '400', color: '#6B7280', marginBottom: 6, lineHeight: 16 },

  statusPill: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusPillText: { fontSize: 11, fontFamily: 'Poppins', fontWeight: '500' },
  errorText: { fontSize: 11, fontFamily: 'Poppins', color: '#DC2626', marginTop: 4, lineHeight: 16 },

  uploadBtn: {
    backgroundColor: '#16A34A', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    alignItems: 'center', minWidth: 60, gap: 2,
    flexShrink: 0,
  },
  uploadBtnDone: { backgroundColor: '#15803D' },
  uploadBtnBusy: { backgroundColor: '#D97706' },
  uploadBtnIcon: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  uploadBtnLabel: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Poppins', fontWeight: '500' },

  infoCard: {
    backgroundColor: '#16A34A', borderRadius: 14, padding: 16, marginBottom: 18,
  },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoIcon: { width: 18, height: 18, tintColor: '#FFFFFF' },
  infoTitle: { fontSize: 13, fontFamily: 'Poppins', fontWeight: '600', color: '#FFFFFF' },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  infoBullet: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, lineHeight: 20 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Poppins', fontWeight: '400', color: '#FFFFFF', lineHeight: 19 },

  submitBtn: {
    backgroundColor: '#16A34A', borderRadius: RADIUS.full,
    paddingVertical: 18, alignItems: 'center', marginBottom: 12,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  submitBtnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins', fontWeight: '600' },

  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: '#6B7280', fontSize: 14, fontFamily: 'Poppins', fontWeight: '400' },

});
