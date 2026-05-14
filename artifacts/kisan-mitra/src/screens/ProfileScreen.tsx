import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Alert, Platform, Image, Modal, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZE, RADIUS, SHADOW, T } from '../constants';
import { api } from '../api';
import type { RootStackParamList } from '../navigation/AppNavigator';

interface DocImage {
  docType: string;
  base64: string;
  mimeType: string;
  uploadedAt: string;
}

const DOC_LABELS: Record<string, string> = {
  aadhar: 'Aadhaar Card',
  bank_passbook: 'Bank Passbook',
  form7: 'Form 7 (7/12)',
  form12: 'Form 12 (Pik Pahani)',
  form8a: 'Form 8A',
};

const DOC_ICONS: Record<string, string> = {
  aadhar: 'AD',
  bank_passbook: 'BK',
  form7: 'F7',
  form12: 'F12',
  form8a: 'F8',
};

const DOC_COLORS: Record<string, string> = {
  aadhar: '#6366F1',
  bank_passbook: COLORS.info,
  form7: COLORS.gold,
  form12: COLORS.primary,
  form8a: '#0D9488',
};

const SKIP_KEYS = new Set([
  'rawText', 'html', 'photoBase64', 'photoMimeType', 'images',
  'transactions', 'tables', 'textBlocks', 'cropEntries',
  'ownershipEntries', 'holdings',
]);

const FIELD_LABEL_MAP: Record<string, string> = {
  name: 'Full Name', fullName: 'Full Name', aadhaarNumber: 'Aadhaar Number',
  vid: 'Virtual ID (VID)', dateOfBirth: 'Date of Birth', dob: 'Date of Birth',
  gender: 'Gender', fathersOrHusbandsName: 'Father / Husband', address: 'Address',
  pincode: 'Pincode', state: 'State', mobileNumber: 'Registered Mobile',
  issueDate: 'Issue Date', enrolmentNumber: 'Enrolment No.', bankName: 'Bank Name',
  branchName: 'Branch Name', branchAddress: 'Branch Address', ifsc: 'IFSC Code',
  ifscCode: 'IFSC Code', micr: 'MICR Code', micrCode: 'MICR Code',
  accountHolderName: 'Account Holder', nomineeName: 'Nominee',
  nomineeRelationship: 'Nominee Relation', email: 'Email', cifNumber: 'CIF Number',
  customerId: 'Customer ID', accountNumber: 'Account Number', accountType: 'Account Type',
  branchCode: 'Branch Code', accountOpeningDate: 'Opening Date',
  openingDate: 'Account Opening Date', currentBalance: 'Current Balance',
  village: 'Village', taluka: 'Taluka', district: 'District',
  surveyNumber: 'Survey Number', khateNumber: 'Khate Number', puId: 'PU ID',
  occupantClass: 'Occupant Class', ownerShare: 'Owner Share', ownerNames: 'Owner Names',
  modeOfAcquisition: 'Mode of Acquisition', totalArea: 'Total Area',
  landRevenueAssessment: 'Land Revenue', collectionCharges: 'Collection Charges',
  nonAgriculturalArea: 'Non-Agricultural Area', nonCultivatedArea: 'Non-Cultivated Area',
  tenantName: 'Tenant Name', tenantRent: 'Tenant Rent', otherRights: 'Other Rights',
  encumbrances: 'Encumbrances', lastMutationNumber: 'Last Mutation No.',
  lastMutationDate: 'Last Mutation Date', oldMutationNumbers: 'Old Mutation Nos.',
  pendingMutation: 'Pending Mutation', boundaryAndSurveyMarks: 'Boundary Marks',
  year: 'Year', reportDate: 'Report Date', khatedarAddress: 'Khatedar Address',
  totalAssessmentOrJudi: 'Total Assessment', totalDamageOnInheritedLand: 'Total Damage',
  totalZpLocalCess: 'ZP Local Cess', totalGpLocalCess: 'GP Local Cess',
  totalRecoveryAmount: 'Total Recovery', grandTotal: 'Grand Total', khatedarNames: 'Khatedar Names',
};

const ARRAY_FIELD_LABEL_MAP: Record<string, string> = {
  ownerNames: 'Owner Names', oldMutationNumbers: 'Old Mutation Nos.',
  khatedarNames: 'Khatedar Names', jointHolders: 'Joint Holders',
};

function humanLabel(key: string): string {
  if (FIELD_LABEL_MAP[key]) return FIELD_LABEL_MAP[key];
  if (ARRAY_FIELD_LABEL_MAP[key]) return ARRAY_FIELD_LABEL_MAP[key];
  return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

const DOC_SECTIONS: Array<{
  key: keyof NonNullable<NonNullable<ReturnType<typeof useAuth>['state']['farmer']>['ocr']>;
  label: string; icon: string; color: string;
}> = [
  { key: 'aadhar',   label: 'Aadhaar Card',          icon: 'AD',  color: '#6366F1' },
  { key: 'passbook', label: 'Bank Passbook',           icon: 'BK',  color: COLORS.info },
  { key: 'form7',    label: 'Form 7 — 7/12 Satbara',  icon: 'F7',  color: COLORS.gold },
  { key: 'form12',   label: 'Form 12 — Pik Pahani',   icon: 'F12', color: COLORS.primary },
  { key: 'form8a',   label: 'Form 8A — Dharana',      icon: 'F8',  color: '#0D9488' },
];

function v(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '—';
  const s = String(val).trim();
  return (!s || s === '—' || s === '-') ? '—' : s;
}

function InfoRow({ label, value, fullWidth }: { label: string; value?: string | number | null; fullWidth?: boolean }) {
  const disp = v(value);
  if (fullWidth) {
    return (
      <View style={rowStyles.fullRow}>
        <Text style={rowStyles.fullLabel}>{label}</Text>
        <Text style={[rowStyles.fullValue, disp === '—' && { color: COLORS.textMuted }]}>{disp}</Text>
      </View>
    );
  }
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, disp === '—' && { color: COLORS.textMuted }]} numberOfLines={3}>{disp}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  label: {
    flex: 1, paddingRight: 8,
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#9CA3AF',
  },
  value: {
    flex: 1.4, textAlign: 'right',
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
  },
  fullRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  fullLabel: {
    marginBottom: 4,
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#9CA3AF',
  },
  fullValue: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
  },
});

function SectionCard({ title, icon, color = COLORS.primary, subtitle, children }: {
  title: string; icon: string; color?: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardHeader}>
        <View style={[cardStyles.iconBox, { backgroundColor: color + '18' }]}>
          <Text style={[cardStyles.cardIcon, { color }]}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={cardStyles.cardSubtitle}>{subtitle}</Text> : null}
        </View>
        <View style={[cardStyles.accentLine, { backgroundColor: color }]} />
      </View>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 14, ...SHADOW.sm, borderWidth: 1, borderColor: '#EAECEF',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  accentLine: { width: 3, height: 32, borderRadius: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardIcon: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    marginTop: 1,
  },
});

function DocImageModal({ doc, onClose }: { doc: DocImage; onClose: () => void }) {
  const label = DOC_LABELS[doc.docType] ?? doc.docType;
  const imgSrc = `data:${doc.mimeType};base64,${doc.base64}`;
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primaryDark }}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.headerTitle}>{label}</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} activeOpacity={0.7}>
            <Text style={modalStyles.closeText}>✕ Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1, backgroundColor: '#111' }} contentContainerStyle={{ padding: 12 }}>
          <Image source={{ uri: imgSrc }} style={modalStyles.docImage} resizeMode="contain" />
          <Text style={modalStyles.uploadedAt}>
            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.primaryDark,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.gold,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  closeText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.white,
  },
  docImage: { width: '100%', height: undefined, aspectRatio: 0.707, borderRadius: RADIUS.md },
  uploadedAt: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 12,
  },
});

const LONG_KEYS = new Set(['address', 'branchAddress', 'boundaryAndSurveyMarks', 'khatedarAddress', 'otherRights', 'encumbrances', 'pendingMutation']);

function OcrDocSection({ sectionKey, label, icon, color, data }: {
  sectionKey: string; label: string; icon: string; color: string; data: Record<string, unknown>;
}) {
  const scalarEntries = Object.entries(data).filter(([k, val]) =>
    !SKIP_KEYS.has(k) && val !== null && val !== undefined &&
    String(val).trim() !== '' && String(val).trim() !== '—' &&
    !Array.isArray(val) && typeof val !== 'object'
  );
  const arrayEntries = Object.entries(data).filter(([k, val]) =>
    !SKIP_KEYS.has(k) && Array.isArray(val) && (val as unknown[]).length > 0
  );

  if (scalarEntries.length === 0 && arrayEntries.length === 0) return null;

  return (
    <SectionCard
      title={label} icon={icon} color={color}
      subtitle={`${scalarEntries.length + arrayEntries.length} field${scalarEntries.length + arrayEntries.length !== 1 ? 's' : ''} extracted`}
    >
      {scalarEntries.map(([k, val]) => (
        <InfoRow key={k} label={humanLabel(k)} value={String(val)} fullWidth={LONG_KEYS.has(k)} />
      ))}
      {arrayEntries.map(([k, val]) => (
        <View key={k} style={ocrStyles.arrayBlock}>
          <Text style={ocrStyles.arrayLabel}>{humanLabel(k)}</Text>
          <View style={ocrStyles.chips}>
            {(val as unknown[]).map((item, i) => (
              <View key={i} style={[ocrStyles.chip, { backgroundColor: color + '12', borderColor: color + '50' }]}>
                <Text style={[ocrStyles.chipText, { color }]}>{String(item)}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </SectionCard>
  );
}

const ocrStyles = StyleSheet.create({
  arrayBlock: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  arrayLabel: {
    marginBottom: 8,
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#9CA3AF',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  chipText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
});

export default function ProfileScreen() {
  const { state, logout, refreshFarmer } = useAuth();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const farmer = state.farmer;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [docImages, setDocImages] = useState<DocImage[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocImage | null>(null);

  const canViewDocs = farmer?.status === 'Active' || farmer?.status === 'Verified';

  const loadData = useCallback(() => {
    refreshFarmer();
    if (farmer?.farmerId && canViewDocs) {
      setLoadingDocs(true);
      api.getDocumentImages(farmer.farmerId)
        .then(data => setDocImages(data.documents ?? []))
        .catch(() => {})
        .finally(() => setLoadingDocs(false));
    }
  }, [farmer?.farmerId, canViewDocs]);

  useEffect(() => { loadData(); }, []);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const initials = (farmer?.name && farmer.name !== '—')
    ? farmer.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  async function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm(t('logoutConfirm') || 'Are you sure you want to logout?')) await logout();
      return;
    }
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => logout() },
    ]);
  }

  const ocr = farmer?.ocr;
  const hasAnyOcr = ocr && Object.values(ocr).some(val => val && typeof val === 'object' && Object.keys(val as object).length > 0);

  return (
    <SafeAreaView style={styles.safe}>
      {selectedDoc && <DocImageModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}

      <View style={styles.topBar}>
        <View style={styles.topBarSide} />
        <View style={styles.headerLogoWrap}>
          <Image source={require('../../assets/brand-logo-new.png')} style={styles.headerLogo} />
        </View>
        <View style={[styles.topBarSide, { alignItems: 'flex-end' }]}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.75}>
            <Text style={styles.settingsBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.farmerName}>{(farmer?.name && farmer.name !== '—') ? farmer.name : 'Farmer'}</Text>
          <Text style={styles.farmerMobile}>+91 {state.mobile}</Text>
          <View style={styles.heroBadgeRow}>
            {farmer?.farmerId && (
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>ID: {farmer.farmerId}</Text>
              </View>
            )}
            <View style={styles.kycBadge}>
              <Text style={styles.kycBadgeText}>✓ {t('kycVerified')}</Text>
            </View>
          </View>
        </View>

        {/* OCR sections or fallback */}
        {hasAnyOcr ? (
          DOC_SECTIONS.map(({ key, label, icon, color }) => {
            const data = ocr?.[key];
            if (!data || typeof data !== 'object') return null;
            return (
              <OcrDocSection key={key} sectionKey={key} label={label} icon={icon} color={color} data={data as Record<string, unknown>} />
            );
          })
        ) : (
          <SectionCard title={t('personalInfo')} icon="PR" color={COLORS.primary}>
            <InfoRow label={t('name')} value={farmer?.name} />
            <InfoRow label={t('aadhaar')} value={farmer?.aadhaar} />
            <InfoRow label={t('dob')} value={farmer?.dob} />
            <InfoRow label={t('gender')} value={farmer?.gender} />
            <InfoRow label={t('mobile')} value={state.mobile ? `+91 ${state.mobile}` : undefined} />
            {farmer?.fatherName && <InfoRow label="Father's Name" value={farmer.fatherName} />}
            {farmer?.address && <InfoRow label="Address" value={farmer.address} fullWidth />}
            {farmer?.village && <InfoRow label={t('village')} value={farmer.village} />}
            {farmer?.district && <InfoRow label={t('district') ?? 'District'} value={farmer.district} />}
            {farmer?.taluka && <InfoRow label={t('taluka')} value={farmer.taluka} />}
            {farmer?.surveyNumber && <InfoRow label={t('surveyNo')} value={farmer.surveyNumber} />}
            {farmer?.land && <InfoRow label={t('landArea')} value={`${farmer.land} हे.`} />}
            {farmer?.crop && <InfoRow label={t('crop')} value={farmer.crop} />}
            {farmer?.bankName && <InfoRow label={t('bank')} value={farmer.bankName} />}
            {farmer?.branchName && <InfoRow label={t('branch')} value={farmer.branchName} />}
            {farmer?.ifsc && <InfoRow label={t('ifsc')} value={farmer.ifsc} />}
            {farmer?.bankAccount && <InfoRow label={t('accountNo')} value={farmer.bankAccount} />}
          </SectionCard>
        )}

        {/* Document Images */}
        {canViewDocs && (
          <SectionCard title="My Documents" icon="DC" color={COLORS.gold}>
            {loadingDocs ? (
              <View style={styles.docsLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.docsLoadingText}>Loading documents…</Text>
              </View>
            ) : docImages.length === 0 ? (
              <View style={styles.docsEmpty}>
                <Text style={styles.docsEmptyText}>No document images available.</Text>
              </View>
            ) : (
              docImages.map((doc, i) => {
                const label = DOC_LABELS[doc.docType] ?? doc.docType;
                const icon = DOC_ICONS[doc.docType] ?? '?';
                const docColor = DOC_COLORS[doc.docType] ?? COLORS.gold;
                const imgSrc = `data:${doc.mimeType};base64,${doc.base64}`;
                return (
                  <TouchableOpacity key={i} style={styles.docCard} onPress={() => setSelectedDoc(doc)} activeOpacity={0.85}>
                    <Image source={{ uri: imgSrc }} style={styles.docThumbnail} resizeMode="cover" />
                    <View style={styles.docCardInfo}>
                      <View style={[styles.docIconBox, { backgroundColor: docColor + '18' }]}>
                        <Text style={[styles.docIconText, { color: docColor }]}>{icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docLabel}>{label}</Text>
                        <Text style={styles.docDate}>
                          {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      <View style={[styles.viewBtn, { backgroundColor: docColor }]}>
                        <Text style={styles.viewBtnText}>View</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </SectionCard>
        )}

        {/* Grievance Button */}
        <TouchableOpacity style={styles.grievanceBtn} onPress={() => navigation.navigate('Grievance')} activeOpacity={0.85}>
          <Text style={styles.grievanceBtnIcon}>📢</Text>
          <Text style={styles.grievanceBtnText}>{t('raiseGrievance')}</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Text style={styles.footerLogoText}>KS</Text>
          </View>
          <Text style={styles.footerTitle}>कृषी सुविधा</Text>
          <Text style={styles.footerText}>Govt. of Maharashtra  •  Agriculture & Farmers Welfare Dept.</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },

  topBar: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarSide: { width: 90, justifyContent: 'center' },
  headerLogoWrap: { width: 220, height: 74, overflow: 'hidden' },
  headerLogo: { width: 220, height: 220, marginTop: -71 },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary + '40',
  },
  settingsBtnText: { fontSize: 18, color: COLORS.primaryDark },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  profileHero: {
    backgroundColor: COLORS.primaryDark, borderRadius: 20, padding: 28,
    alignItems: 'center', marginBottom: 18, ...SHADOW.md,
  },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2.5, borderColor: COLORS.gold + '70',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarInner: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  farmerName: {
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  farmerMobile: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 16,
  },
  heroBadgeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  idBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  idBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#FFFFFF',
  },
  kycBadge: {
    backgroundColor: '#F0FDF4', borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.primary,
  },
  kycBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primary,
  },

  docsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  docsLoadingText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
  },
  docsEmpty: { paddingVertical: 12 },
  docsEmptyText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  docCard: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#EAECEF',
    marginBottom: 12, backgroundColor: '#FFFFFF', ...SHADOW.sm,
  },
  docThumbnail: { width: '100%', height: 150, backgroundColor: '#F5F5F5' },
  docCardInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  docIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docIconText: {
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  docLabel: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
  },
  docDate: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    marginTop: 2,
  },
  viewBtn: {
    borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7,
  },
  viewBtnText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#FFFFFF',
  },

  grievanceBtn: {
    backgroundColor: '#FFFBEB', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12, borderWidth: 1.5, borderColor: COLORS.gold, ...SHADOW.sm,
  },
  grievanceBtnIcon: { fontSize: 18 },
  grievanceBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.gold,
  },

  logoutBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: COLORS.error, ...SHADOW.sm,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.error,
  },

  footer: { alignItems: 'center', gap: 8, paddingTop: 8 },
  footerLogo: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary + '50',
  },
  footerLogoText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  footerTitle: {
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primaryDark,
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
