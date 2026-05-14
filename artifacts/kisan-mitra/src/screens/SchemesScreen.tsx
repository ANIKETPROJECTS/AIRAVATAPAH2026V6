import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, TextInput, ActivityIndicator, Alert, Modal, ScrollView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { COLORS, RADIUS, SHADOW, T } from '../constants';
import { Scheme, InsuranceSubsidy, Application, REQUIRED_DOCUMENTS, DocumentTypeId, DocUploadState } from '../types';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';

type SchemeFilter = 'ALL' | 'CENTRAL' | 'STATE';
type EligibilityFilter = 'ALL' | 'ELIGIBLE' | 'PARTIAL' | 'NOT_ELIGIBLE';
type Tab = 'schemes' | 'insurance' | 'subsidies';

function getEligibilityText(eligibility: Scheme['eligibility']): string {
  if (!eligibility) return '';
  if (typeof eligibility === 'string') return eligibility;
  const parts: string[] = [];
  if (eligibility.summary) parts.push(eligibility.summary);
  if (Array.isArray(eligibility.familyCriteria)) parts.push(...eligibility.familyCriteria);
  if (Array.isArray(eligibility.exclusions)) parts.push(...eligibility.exclusions);
  if (Array.isArray(eligibility.parameters)) {
    eligibility.parameters.forEach(p => parts.push(`${p.parameter}: ${p.rule}`));
  }
  return parts.join(' ');
}

function formatEligibilityForDisplay(eligibility: Scheme['eligibility']): string {
  if (!eligibility) return '';
  if (typeof eligibility === 'string') return eligibility;
  const lines: string[] = [];
  if (eligibility.summary) lines.push(eligibility.summary);
  if (Array.isArray(eligibility.familyCriteria) && eligibility.familyCriteria.length > 0) {
    lines.push('Criteria: ' + eligibility.familyCriteria.join(', '));
  }
  if (Array.isArray(eligibility.exclusions) && eligibility.exclusions.length > 0) {
    lines.push('Exclusions: ' + eligibility.exclusions.slice(0, 3).join(', '));
  }
  return lines.join('\n');
}

function isEligibleScheme(scheme: Scheme, crop?: string, land?: string | number): boolean {
  const e = getEligibilityText(scheme.eligibility).toLowerCase();
  if (!e) return true;
  if (crop && crop !== '—' && e.includes(crop.toLowerCase())) return true;
  if (land) {
    const acres = parseFloat(String(land));
    if (!isNaN(acres)) {
      const minMatch = e.match(/(\d+(\.\d+)?)\s*(ha|acre|hectare)/);
      if (minMatch) {
        const minVal = parseFloat(minMatch[1]);
        if (acres >= minVal) return true;
      }
    }
  }
  return false;
}

function isEligibleItem(item: InsuranceSubsidy, crop?: string, land?: string | number): boolean {
  const eligible = item.eligibility?.toLowerCase() ?? '';
  if (item.crops && item.crops.length > 0 && crop && crop !== '—') {
    if (item.crops.some((c) => c.toLowerCase().includes(crop.toLowerCase()) || crop.toLowerCase().includes(c.toLowerCase()))) return true;
  }
  if (crop && crop !== '—' && eligible.includes(crop.toLowerCase())) return true;
  if (land) {
    const acres = parseFloat(String(land));
    if (!isNaN(acres)) {
      if (item.minLand !== undefined && acres >= item.minLand) return true;
    }
  }
  return !item.crops || item.crops.length === 0;
}

const APP_STATUS_COLOR: Record<string, string> = {
  Pending:        '#D97706',
  'Under Review': '#2563EB',
  Approved:       '#16A34A',
  Rejected:       '#DC2626',
  Settled:        '#0D9488',
};

const APP_STATUS_LABEL: Record<string, string> = {
  Pending:        'Pending Review',
  'Under Review': 'Under Review',
  Approved:       'Approved ✓',
  Rejected:       'Rejected',
  Settled:        'Settled ✓',
};

const APP_STATUS_ICON: Record<string, string> = {
  Pending:        '○',
  'Under Review': '◎',
  Approved:       '✓',
  Rejected:       '✕',
  Settled:        '₹',
};

const APP_STATUS_DESC: Record<string, { en: string; hi: string; mr: string }> = {
  Pending:        { en: 'Your application has been submitted and is awaiting review by the district officer.', hi: 'आपका आवेदन सफलतापूर्वक जमा हो गया है और जिला अधिकारी द्वारा समीक्षा की प्रतीक्षा है।', mr: 'तुमचा अर्ज यशस्वीरित्या सादर केला गेला आहे आणि जिल्हा अधिकाऱ्याच्या पुनरावलोकनाची प्रतीक्षा आहे.' },
  'Under Review': { en: 'Your application is currently being reviewed by the district officer.', hi: 'आपका आवेदन वर्तमान में जिला अधिकारी द्वारा समीक्षा में है।', mr: 'तुमचा अर्ज सध्या जिल्हा अधिकाऱ्याद्वारे पुनरावलोकनाधीन आहे.' },
  Approved:       { en: 'Congratulations! Your application has been approved.', hi: 'बधाई! आपका आवेदन स्वीकृत हो गया है।', mr: 'अभिनंदन! तुमचा अर्ज मंजूर झाला आहे.' },
  Rejected:       { en: 'Your application has been rejected. You may re-apply or contact the office for details.', hi: 'आपका आवेदन अस्वीकृत कर दिया गया है। आप पुनः आवेदन कर सकते हैं।', mr: 'तुमचा अर्ज नाकारला गेला आहे. तुम्ही पुन्हा अर्ज करू शकता.' },
  Settled:        { en: 'Your claim has been settled. Funds will be transferred to your registered bank account.', hi: 'आपका दावा निपटा दिया गया है।', mr: 'तुमचा दावा निकाला गेला आहे.' },
};

export default function SchemesScreen() {
  const { state } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<TabParamList, 'Schemes'>>();
  const t = (k: string) => (T[state.lang] ?? T['en'])[k] ?? k;
  const farmer = state.farmer;
  const crop = farmer?.crop;
  const land = farmer?.land;

  const routeInitialTab = (route.params as { initialTab?: Tab } | undefined)?.initialTab;
  const [tab, setTab] = useState<Tab>(routeInitialTab ?? 'schemes');

  useEffect(() => {
    if (routeInitialTab) setTab(routeInitialTab);
  }, [routeInitialTab]);

  useEffect(() => {
    setEligFilter('ALL');
    setFilter('ALL');
    setSearch('');
  }, [tab]);

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [insuranceItems, setInsuranceItems] = useState<InsuranceSubsidy[]>([]);
  const [subsidyItems, setSubsidyItems] = useState<InsuranceSubsidy[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [filter, setFilter] = useState<SchemeFilter>('ALL');
  const [eligFilter, setEligFilter] = useState<EligibilityFilter>('ALL');
  const [search, setSearch] = useState('');
  const [successModal, setSuccessModal] = useState<{ schemeName: string; applicationId: string } | null>(null);
  const [statusModal, setStatusModal] = useState<{ app: Application; reapplyFn?: () => void } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const mobile = farmer?.mobile ?? state.mobile;
      const [schemesRes, insuranceRes, subsidyRes, appsRes] = await Promise.all([
        api.getSchemes(),
        api.getInsuranceSubsidies({ type: 'Insurance', limit: 50 }),
        api.getInsuranceSubsidies({ type: 'Subsidy', limit: 50 }),
        mobile ? api.getMyApplications(mobile) : Promise.resolve<Application[]>([]),
      ]);
      setSchemes(schemesRes);
      setInsuranceItems(insuranceRes.items);
      setSubsidyItems(subsidyRes.items);
      setMyApplications(appsRes);
    } catch {
      setSchemes([]); setInsuranceItems([]); setSubsidyItems([]);
    } finally {
      setLoading(false);
    }
  }, [farmer?.mobile, state.mobile]);

  const refreshApplications = useCallback(async () => {
    const mobile = farmer?.mobile ?? state.mobile;
    if (!mobile) return;
    try {
      const appsRes = await api.getMyApplications(mobile);
      setMyApplications(appsRes);
    } catch {}
  }, [farmer?.mobile, state.mobile]);

  const handlePullRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadData(); } finally { setRefreshing(false); }
  }, [loadData]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { refreshApplications(); }, [refreshApplications]));

  const handleManualRefresh = useCallback(() => { handlePullRefresh(); }, [handlePullRefresh]);

  const getApplicationForItem = (itemId: string, type: 'scheme' | 'subsidy' | 'insurance'): Application | undefined =>
    myApplications.find(a => a.type === type && (a.schemeId === itemId || a.schemeName === itemId));

  // ── Document upload modal state
  const [docModal, setDocModal] = useState<{
    visible: boolean; itemId: string; itemName: string;
    appType: 'scheme' | 'subsidy' | 'insurance'; itemType?: string | null;
    requiredDocIds: DocumentTypeId[]; pendingEligible: boolean; pendingEligibilityText: string;
  } | null>(null);
  const [modalDocStates, setModalDocStates] = useState<Record<string, DocUploadState>>({});
  const pollingRef = useRef<Record<string, boolean>>({});

  function setModalDoc(id: DocumentTypeId, patch: Partial<DocUploadState>) {
    setModalDocStates(prev => ({ ...prev, [id]: { ...(prev[id] ?? { status: 'idle' }), ...patch } }));
  }

  async function pollModalDoc(docId: DocumentTypeId, requestId: string) {
    pollingRef.current[docId] = true;
    for (let i = 0; i < 60; i++) {
      if (!pollingRef.current[docId]) break;
      await new Promise(r => setTimeout(r, 4000));
      try {
        const result = await api.pollExtraction(requestId);
        if (result.status === 'complete') { setModalDoc(docId, { status: 'done' }); pollingRef.current[docId] = false; return; }
        if (result.status === 'error') { setModalDoc(docId, { status: 'error', error: result.error ?? 'Processing failed' }); pollingRef.current[docId] = false; return; }
      } catch {}
    }
    setModalDoc(docId, { status: 'error', error: 'Timed out. Please re-upload.' });
    pollingRef.current[docId] = false;
  }

  async function pickAndUploadModalDoc(docId: DocumentTypeId) {
    const mobile = farmer?.mobile ?? state.mobile;
    if (!mobile) return;
    setModalDoc(docId, { status: 'picking', error: undefined });
    try {
      let fileUri = '', fileName = `${docId}.pdf`, fileMime = 'application/pdf';
      if (Platform.OS === 'web') {
        const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: false });
        if (result.canceled || !result.assets?.[0]) { setModalDoc(docId, { status: 'idle' }); return; }
        const asset = result.assets[0]; fileUri = asset.uri; fileName = asset.name ?? fileName; fileMime = asset.mimeType ?? fileMime;
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission needed', 'Please allow access to your photos.'); setModalDoc(docId, { status: 'idle' }); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsMultipleSelection: false });
        if (result.canceled || !result.assets?.[0]) { setModalDoc(docId, { status: 'idle' }); return; }
        const asset = result.assets[0]; fileUri = asset.uri; fileName = `${docId}.jpg`; fileMime = 'image/jpeg';
      }
      setModalDoc(docId, { status: 'uploading', fileName });
      const submitResult = await api.uploadDocument(fileUri, fileName, fileMime, docId, mobile);
      setModalDoc(docId, { status: 'processing', requestId: submitResult.request_id });
      pollModalDoc(docId, submitResult.request_id);
    } catch (err) {
      setModalDoc(docId, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed.' });
    }
  }

  function mapSchemeDocToType(docStr: string): DocumentTypeId | null {
    const d = docStr.toLowerCase();
    if (d.includes('aadhar') || d.includes('aadhaar') || d.includes('identity') || d.includes('uid')) return 'aadhar';
    if (d.includes('bank') || d.includes('passbook') || d.includes('account')) return 'bank_passbook';
    if (d.includes('7/12') || d.includes('form 7') || d.includes('satbara') || d.includes('land record') || d.includes('form7')) return 'form7';
    if (d.includes('pik pahani') || d.includes('form 12') || d.includes('form12') || d.includes('crop inspection')) return 'form12';
    if (d.includes('8a') || d.includes('8-a') || d.includes('holding register') || d.includes('form8')) return 'form8a';
    return null;
  }

  function getRequiredDocIds(item: Scheme | InsuranceSubsidy, currentTab: Tab): DocumentTypeId[] {
    if (currentTab === 'schemes') {
      const docs = (item as Scheme).documents ?? [];
      if (docs.length === 0) return ['aadhar', 'form7'];
      const mapped = docs.map(mapSchemeDocToType).filter(Boolean) as DocumentTypeId[];
      return mapped.length > 0 ? mapped : ['aadhar', 'form7'];
    }
    return ['aadhar', 'bank_passbook'];
  }

  function getMissingDocIds(requiredDocIds: DocumentTypeId[]): DocumentTypeId[] {
    const totalUploaded = Math.max((farmer?.docs ?? []).length, farmer?.documentsCount ?? 0);
    if (totalUploaded >= 5) return [];
    const uploadedSections = new Set((farmer?.docs ?? []).map(d => d.section));
    return requiredDocIds.filter(id => !uploadedSections.has(id));
  }

  async function proceedWithApply(
    type: 'scheme' | 'subsidy' | 'insurance', itemId: string, itemName: string,
    itemType?: string | null, docIds: DocumentTypeId[] = [],
  ) {
    if (!farmer) return;
    const mobile = farmer.mobile ?? state.mobile;
    if (!mobile) return;
    setApplying(itemId);
    try {
      const rejectedApp = myApplications.find(
        a => a.type === type && (a.schemeId === itemId || a.schemeName === itemName) && a.status === 'Rejected',
      );
      let app: Application;
      if (rejectedApp) {
        app = await api.reapplyApplication(rejectedApp.applicationId);
        setMyApplications(prev => prev.map(a => a.applicationId === app.applicationId ? app : a));
      } else {
        app = await api.applyForScheme({
          type, farmerId: farmer.farmerId, farmerName: farmer.name ?? null, mobile,
          district: farmer.district ?? null, village: farmer.village ?? null,
          schemeId: itemId, schemeName: itemName, schemeType: itemType ?? null,
          crop: farmer.crop ?? null, land: farmer.land != null ? parseFloat(String(farmer.land)) : null,
          documentRefs: docIds,
        });
        setMyApplications(prev => [...prev, app]);
      }
      setStatusModal(null);
      setSuccessModal({ schemeName: itemName, applicationId: app.applicationId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed';
      if (msg.includes('Already applied')) {
        Alert.alert('Already Applied', 'You have already submitted an application for this scheme.', [{ text: 'OK' }]);
        await loadData();
      } else {
        Alert.alert('Error', 'Could not submit application. Please try again.', [{ text: 'OK' }]);
      }
    } finally {
      setApplying(null);
    }
  }

  async function handleApply(
    type: 'scheme' | 'subsidy' | 'insurance', item: Scheme | InsuranceSubsidy,
    itemType?: string | null, eligible?: boolean, eligibilityText?: string, currentTab?: Tab,
  ) {
    if (!farmer) return;
    const itemId = item.id;
    const itemName = item.name;
    const requiredDocIds = getRequiredDocIds(item, currentTab ?? 'schemes');
    const missingDocIds = getMissingDocIds(requiredDocIds);
    if (missingDocIds.length > 0) {
      const initStates: Record<string, DocUploadState> = {};
      requiredDocIds.forEach(id => {
        const alreadyUploaded = (farmer.docs ?? []).some(d => d.section === id);
        initStates[id] = { status: alreadyUploaded ? 'done' : 'idle' };
      });
      setModalDocStates(initStates);
      setDocModal({ visible: true, itemId, itemName, appType: type, itemType, requiredDocIds, pendingEligible: eligible ?? true, pendingEligibilityText: eligibilityText ?? '' });
      return;
    }
    proceedWithApply(type, itemId, itemName, itemType, requiredDocIds);
  }

  function handleKnowMore(item: Scheme | InsuranceSubsidy, currentTab: Tab, existingApp?: Application) {
    navigation.navigate('SchemeDetail', {
      itemJson: JSON.stringify(item),
      tabType: currentTab,
      existingAppJson: existingApp ? JSON.stringify(existingApp) : undefined,
    });
  }

  function getEligibilityCategory(_item: Scheme | InsuranceSubsidy, _itemTab: Tab): EligibilityFilter {
    const uploadedCount = Math.max((farmer?.docs ?? []).length, farmer?.documentsCount ?? 0);
    if (uploadedCount >= 5) return 'ELIGIBLE';
    if (uploadedCount > 0) return 'PARTIAL';
    return 'NOT_ELIGIBLE';
  }

  const filteredSchemes = schemes.filter((s) => {
    if (filter !== 'ALL' && s.type !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (eligFilter !== 'ALL' && getEligibilityCategory(s, 'schemes') !== eligFilter) return false;
    return true;
  });
  const filteredInsurance = insuranceItems.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (eligFilter !== 'ALL' && getEligibilityCategory(s, 'insurance') !== eligFilter) return false;
    return true;
  });
  const filteredSubsidies = subsidyItems.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (eligFilter !== 'ALL' && getEligibilityCategory(s, 'subsidies') !== eligFilter) return false;
    return true;
  });

  const displayBenefit = (scheme: Scheme) => scheme.benefit ?? scheme.benefits ?? '';

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'schemes',   label: state.lang === 'hi' ? 'योजनाएं' : state.lang === 'mr' ? 'योजना' : 'Schemes',   count: schemes.length },
    { id: 'insurance', label: state.lang === 'hi' ? 'बीमा' : state.lang === 'mr' ? 'विमा' : 'Insurance', count: insuranceItems.length },
    { id: 'subsidies', label: state.lang === 'hi' ? 'सब्सिडी' : state.lang === 'mr' ? 'अनुदान' : 'Subsidies', count: subsidyItems.length },
  ];

  const SCHEME_FILTERS: { id: SchemeFilter; label: string }[] = [
    { id: 'ALL',     label: 'All' },
    { id: 'CENTRAL', label: t('centralScheme') },
    { id: 'STATE',   label: t('stateScheme') },
  ];

  const ELIGIBILITY_FILTERS: { id: EligibilityFilter; label: string; color: string }[] = [
    { id: 'ALL',         label: state.lang === 'hi' ? 'सभी' : 'All',         color: COLORS.primaryDark },
    { id: 'ELIGIBLE',    label: state.lang === 'hi' ? 'पात्र' : 'Eligible',   color: '#16A34A' },
    { id: 'PARTIAL',     label: state.lang === 'hi' ? 'आंशिक' : 'Partial',    color: '#D97706' },
    { id: 'NOT_ELIGIBLE',label: state.lang === 'hi' ? 'अपात्र' : 'Not Eligible', color: '#DC2626' },
  ];

  const currentItems = tab === 'schemes' ? filteredSchemes : tab === 'insurance' ? filteredInsurance : filteredSubsidies;
  const emptyMsg = tab === 'insurance'
    ? (state.lang === 'hi' ? 'कोई बीमा योजना नहीं' : state.lang === 'mr' ? 'कोणताही विमा नाही' : 'No insurance schemes')
    : tab === 'subsidies'
    ? (state.lang === 'hi' ? 'कोई सब्सिडी नहीं' : state.lang === 'mr' ? 'कोणतेही अनुदान नाही' : 'No subsidies')
    : t('noSchemes');

  const TopBar = (
    <View style={styles.topBar}>
      <View style={styles.topBarSide} />
      <View style={styles.headerLogoWrap}>
        <Image source={require('../../assets/brand-logo-new.png')} style={styles.headerLogo} />
      </View>
      <View style={[styles.topBarSide, { alignItems: 'flex-end' }]}>
        <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshBtn} activeOpacity={0.7} disabled={refreshing}>
          <Text style={[styles.refreshBtnText, refreshing && { opacity: 0.4 }]}>↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        {TopBar}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {TopBar}

      {/* Sticky header: eligibility banner + tabs + search + filters */}
      <View style={styles.stickyHeader}>
        {crop && crop !== '—' && (
          <View style={styles.eligibilityBanner}>
            <View style={styles.eligDot} />
            <Text style={styles.eligibilityText}>
              {state.lang === 'hi' ? `${crop} किसानों के लिए योजनाएं` : state.lang === 'mr' ? `${crop} शेतकऱ्यांसाठी योजना` : `Personalized for ${crop} farmers`}
            </Text>
          </View>
        )}

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {TABS.map((tb) => (
            <TouchableOpacity key={tb.id} style={[styles.tabBtn, tab === tb.id && styles.tabBtnActive]} onPress={() => setTab(tb.id)} activeOpacity={0.8}>
              <Text style={[styles.tabText, tab === tb.id && styles.tabTextActive]}>{tb.label}</Text>
              <View style={[styles.tabCount, tab === tb.id && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, tab === tb.id && styles.tabCountTextActive]}>{tb.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>○</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={state.lang === 'hi' ? 'खोजें...' : state.lang === 'mr' ? 'शोधा...' : 'Search schemes…'}
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClear}>
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Scheme type filter */}
        {tab === 'schemes' && (
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {SCHEME_FILTERS.map((f) => (
                <TouchableOpacity key={f.id} style={[styles.filterChip, filter === f.id && styles.filterChipActive]} onPress={() => setFilter(f.id)}>
                  <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.filterDivider} />
              <Text style={styles.countChip}>{filteredSchemes.length} found</Text>
            </ScrollView>
          </View>
        )}

        {/* Eligibility filter */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {ELIGIBILITY_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.eligChip, eligFilter === f.id && { backgroundColor: f.color + '18', borderColor: f.color }]}
                onPress={() => setEligFilter(f.id)}
              >
                <Text style={[styles.eligChipText, eligFilter === f.id && { color: f.color }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
            {tab !== 'schemes' && (
              <Text style={styles.countChip}>
                {tab === 'insurance' ? filteredInsurance.length : filteredSubsidies.length} found
              </Text>
            )}
          </ScrollView>
        </View>
      </View>

      {currentItems.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>{tab === 'insurance' ? '◈' : tab === 'subsidies' ? '₹' : '☰'}</Text>
          </View>
          <Text style={styles.emptyTitle}>{emptyMsg}</Text>
          <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
        </View>
      ) : (
        <FlatList
          data={currentItems as any[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handlePullRefresh}
          renderItem={({ item }) => {
            const appType: 'scheme' | 'subsidy' | 'insurance' = tab === 'schemes' ? 'scheme' : tab === 'insurance' ? 'insurance' : 'subsidy';
            const existingApp = getApplicationForItem(item.id, appType);
            const isApplyingThis = applying === item.id;
            const eligible = tab === 'schemes'
              ? isEligibleScheme(item as Scheme, crop, land)
              : isEligibleItem(item as InsuranceSubsidy, crop, land);
            const benefit = tab === 'schemes' ? displayBenefit(item as Scheme) : (item as InsuranceSubsidy).benefit;
            const isState = tab === 'schemes' ? (item as Scheme).type === 'STATE' : (item as InsuranceSubsidy).region !== 'Central';
            const itemType = tab === 'schemes' ? (item as Scheme).type : undefined;

            return (
              <View style={[styles.card, item.status === 'Closed' && styles.cardClosed, eligible && !existingApp && styles.cardEligible]}>

                {existingApp && (
                  <View style={[styles.statusBanner, { backgroundColor: `${APP_STATUS_COLOR[existingApp.status] ?? '#6B7280'}12`, borderColor: `${APP_STATUS_COLOR[existingApp.status] ?? '#6B7280'}50` }]}>
                    <Text style={[styles.statusBannerText, { color: APP_STATUS_COLOR[existingApp.status] ?? '#6B7280' }]}>
                      {APP_STATUS_ICON[existingApp.status] ?? '○'} {APP_STATUS_LABEL[existingApp.status] ?? existingApp.status} · {existingApp.applicationId}
                    </Text>
                  </View>
                )}

                {!existingApp && eligible && (
                  <View style={styles.eligBadge}>
                    <Text style={styles.eligBadgeText}>✓ {state.lang === 'hi' ? 'आप पात्र हैं' : state.lang === 'mr' ? 'तुम्ही पात्र आहात' : 'You may be eligible'}</Text>
                  </View>
                )}

                <View style={styles.cardHead}>
                  <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.typeBadge, isState ? styles.stateBadge : styles.centralBadge]}>
                      <Text style={[styles.typeBadgeText, isState ? styles.stateText : styles.centralText]}>
                        {isState ? t('stateScheme') : t('centralScheme')}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, item.status === 'Active' ? styles.activePill : styles.closedPill]}>
                      <Text style={[styles.statusPillText, item.status === 'Active' ? styles.activePillText : styles.closedPillText]}>
                        {item.status === 'Active' ? t('active') : t('closed')}
                      </Text>
                    </View>
                  </View>
                </View>

                {item.description && <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>}

                <View style={styles.metaRow}>
                  {benefit ? <View style={styles.metaItem}><Text style={styles.metaLabel}>₹</Text><Text style={styles.metaValue} numberOfLines={1}>{benefit}</Text></View> : null}
                  {item.deadline && <View style={styles.metaItem}><Text style={styles.metaLabel}>📅</Text><Text style={styles.metaValue}>{item.deadline}</Text></View>}
                  {(item as InsuranceSubsidy).crops && (item as InsuranceSubsidy).crops!.length > 0 && (
                    <View style={styles.metaItem}><Text style={styles.metaLabel}>🌾</Text><Text style={styles.metaValue} numberOfLines={1}>{(item as InsuranceSubsidy).crops!.join(', ')}</Text></View>
                  )}
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.knowMoreBtn} onPress={() => handleKnowMore(item, tab, existingApp)}>
                    <Text style={styles.knowMoreText}>{t('knowMore')}</Text>
                  </TouchableOpacity>

                  {item.status !== 'Closed' && !existingApp && (
                    <TouchableOpacity
                      style={[styles.applyBtn, isApplyingThis && styles.applyBtnDisabled]}
                      disabled={isApplyingThis}
                      onPress={() => handleApply(appType, item as Scheme | InsuranceSubsidy, itemType, eligible, tab === 'schemes' ? formatEligibilityForDisplay((item as Scheme).eligibility) : (item as InsuranceSubsidy).eligibility ?? '', tab)}
                    >
                      {isApplyingThis
                        ? <ActivityIndicator size="small" color={COLORS.white} />
                        : <Text style={styles.applyBtnText}>{state.lang === 'hi' ? 'आवेदन करें' : state.lang === 'mr' ? 'अर्ज करा' : 'Apply Now'}</Text>
                      }
                    </TouchableOpacity>
                  )}

                  {item.status !== 'Closed' && existingApp && (
                    <TouchableOpacity
                      style={[styles.statusBtn, { backgroundColor: `${APP_STATUS_COLOR[existingApp.status] ?? '#6B7280'}15`, borderWidth: 1.5, borderColor: `${APP_STATUS_COLOR[existingApp.status] ?? '#6B7280'}50` }]}
                      onPress={() => setStatusModal({
                        app: existingApp,
                        reapplyFn: existingApp.status === 'Rejected'
                          ? () => handleApply(appType, item as Scheme | InsuranceSubsidy, itemType, eligible, undefined, tab)
                          : undefined,
                      })}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.statusBtnText, { color: APP_STATUS_COLOR[existingApp.status] ?? '#6B7280' }]}>
                        {APP_STATUS_ICON[existingApp.status] ?? '○'} Status
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Success Modal */}
      {successModal && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setSuccessModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.successSheet}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successEmoji}>✓</Text>
              </View>
              <Text style={styles.successTitle}>
                {state.lang === 'hi' ? 'आवेदन सफल!' : state.lang === 'mr' ? 'अर्ज यशस्वी!' : 'Application Submitted!'}
              </Text>
              <Text style={styles.successSchemeName} numberOfLines={2}>{successModal.schemeName}</Text>
              <Text style={styles.successBody}>
                {state.lang === 'hi'
                  ? 'आपका आवेदन सफलतापूर्वक जमा कर दिया गया है। जिला अधिकारी इसकी समीक्षा करेंगे।'
                  : state.lang === 'mr'
                  ? 'तुमचा अर्ज यशस्वीरित्या सादर केला गेला आहे. जिल्हा अधिकारी त्याचे पुनरावलोकन करतील.'
                  : 'Your application has been submitted. The district officer will review it shortly.'}
              </Text>
              <View style={styles.successIdBox}>
                <Text style={styles.successIdLabel}>{state.lang === 'hi' ? 'आवेदन ID' : state.lang === 'mr' ? 'अर्ज ID' : 'Application ID'}</Text>
                <Text style={styles.successIdValue}>{successModal.applicationId}</Text>
              </View>
              <TouchableOpacity style={styles.successCloseBtn} onPress={() => setSuccessModal(null)} activeOpacity={0.85}>
                <Text style={styles.successCloseBtnText}>{state.lang === 'hi' ? 'ठीक है' : state.lang === 'mr' ? 'ठीक आहे' : 'Great, Got it!'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Status Modal */}
      {statusModal && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setStatusModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.sheetModal}>
              <View style={styles.sheetHandle} />
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{state.lang === 'hi' ? 'आवेदन स्थिति' : state.lang === 'mr' ? 'अर्जाची स्थिती' : 'Application Status'}</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>{statusModal.app.schemeName}</Text>
                </View>
                <TouchableOpacity onPress={() => setStatusModal(null)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.statusBigBadge, { backgroundColor: `${APP_STATUS_COLOR[statusModal.app.status] ?? '#6B7280'}12`, borderColor: APP_STATUS_COLOR[statusModal.app.status] ?? '#6B7280' }]}>
                <Text style={styles.statusBigIcon}>{APP_STATUS_ICON[statusModal.app.status] ?? '📋'}</Text>
                <Text style={[styles.statusBigLabel, { color: APP_STATUS_COLOR[statusModal.app.status] ?? '#6B7280' }]}>
                  {APP_STATUS_LABEL[statusModal.app.status] ?? statusModal.app.status}
                </Text>
              </View>

              <Text style={styles.statusDesc}>
                {APP_STATUS_DESC[statusModal.app.status]?.[state.lang as 'en' | 'hi' | 'mr'] ?? APP_STATUS_DESC[statusModal.app.status]?.en ?? ''}
              </Text>

              <View style={styles.statusMeta}>
                <View style={styles.statusMetaRow}>
                  <Text style={styles.statusMetaLabel}>{state.lang === 'hi' ? 'आवेदन ID' : 'Application ID'}</Text>
                  <Text style={styles.statusMetaValue}>{statusModal.app.applicationId}</Text>
                </View>
                <View style={styles.statusMetaDivider} />
                <View style={styles.statusMetaRow}>
                  <Text style={styles.statusMetaLabel}>{state.lang === 'hi' ? 'आवेदन की तारीख' : 'Applied On'}</Text>
                  <Text style={styles.statusMetaValue}>{new Date(statusModal.app.appliedAt).toLocaleDateString('en-IN')}</Text>
                </View>
                {(statusModal.app.adminNotes || statusModal.app.adminReply) && (
                  <>
                    <View style={styles.statusMetaDivider} />
                    <View style={styles.statusAdminReply}>
                      <Text style={[styles.statusMetaLabel, statusModal.app.status === 'Rejected' && { color: '#DC2626' }]}>
                        {statusModal.app.status === 'Rejected'
                          ? (state.lang === 'hi' ? '✕ अस्वीकृति का कारण' : '✕ Reason for Rejection')
                          : (state.lang === 'hi' ? 'अधिकारी टिप्पणी' : 'Officer Reply')}
                      </Text>
                      <Text style={[styles.statusAdminReplyText, statusModal.app.status === 'Rejected' && { color: '#DC2626' }]}>
                        {statusModal.app.adminNotes ?? statusModal.app.adminReply}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.modalFooter}>
                {statusModal.reapplyFn && (
                  <TouchableOpacity
                    style={[styles.footerBtn, { backgroundColor: COLORS.primary }]}
                    onPress={() => { setStatusModal(null); statusModal.reapplyFn?.(); }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.footerBtnText, { color: '#FFFFFF' }]}>
                      {state.lang === 'hi' ? 'पुनः आवेदन करें' : state.lang === 'mr' ? 'पुन्हा अर्ज करा' : 'Re-apply'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.footerBtn, { backgroundColor: '#F3F4F6' }]} onPress={() => setStatusModal(null)} activeOpacity={0.85}>
                  <Text style={[styles.footerBtnText, { color: '#374151' }]}>{state.lang === 'hi' ? 'बंद करें' : 'Close'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Document Upload Modal */}
      {docModal && (
        <Modal visible={docModal.visible} animationType="slide" transparent onRequestClose={() => setDocModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.sheetModal}>
              <View style={styles.sheetHandle} />
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{state.lang === 'hi' ? 'दस्तावेज़ अपलोड करें' : 'Upload Required Documents'}</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>{docModal.itemName}</Text>
                </View>
                <TouchableOpacity onPress={() => setDocModal(null)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalNote}>
                {state.lang === 'hi'
                  ? 'नीचे दिए गए दस्तावेज़ इस योजना के लिए आवश्यक हैं। अपलोड करने के बाद आवेदन करें।'
                  : 'The following documents are required. Upload any missing ones, then proceed to apply.'}
              </Text>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {docModal.requiredDocIds.map(docId => {
                  const docDef = REQUIRED_DOCUMENTS.find(d => d.id === docId);
                  if (!docDef) return null;
                  const ds = modalDocStates[docId] ?? { status: 'idle' };
                  const isDone = ds.status === 'done';
                  const isWorking = ds.status === 'uploading' || ds.status === 'processing' || ds.status === 'picking';
                  const docLabel = state.lang === 'hi' ? docDef.labelHi : state.lang === 'mr' ? docDef.labelMr : docDef.label;
                  return (
                    <View key={docId} style={[styles.docUploadCard, isDone && styles.docUploadCardDone]}>
                      <View style={styles.docUploadLeft}>
                        <Text style={styles.docUploadIcon}>{docDef.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.docUploadLabel}>{docLabel}</Text>
                          {ds.status === 'error' && <Text style={styles.docUploadError}>{ds.error}</Text>}
                          {ds.status === 'uploading' && <Text style={styles.docUploadStatus}>Uploading…</Text>}
                          {ds.status === 'processing' && <Text style={[styles.docUploadStatus, { color: COLORS.gold }]}>Processing…</Text>}
                          {isDone && <Text style={[styles.docUploadStatus, { color: COLORS.primary }]}>{state.lang === 'hi' ? '✓ अपलोड हो गया' : '✓ Uploaded'}</Text>}
                        </View>
                      </View>
                      {isDone ? (
                        <View style={styles.docDoneBadge}><Text style={styles.docDoneText}>✓</Text></View>
                      ) : (
                        <TouchableOpacity style={[styles.docUploadBtn, isWorking && { opacity: 0.6 }]} disabled={isWorking} onPress={() => pickAndUploadModalDoc(docId)}>
                          {isWorking
                            ? <ActivityIndicator size="small" color={COLORS.white} />
                            : <Text style={styles.docUploadBtnText}>{state.lang === 'hi' ? 'अपलोड' : 'Upload'}</Text>
                          }
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.modalFooter}>
                {(() => {
                  const allDone = docModal.requiredDocIds.every(id => (modalDocStates[id]?.status ?? 'idle') === 'done');
                  const anyUploaded = docModal.requiredDocIds.some(id => (modalDocStates[id]?.status ?? 'idle') === 'done');
                  return (
                    <TouchableOpacity
                      style={[styles.footerBtn, { backgroundColor: anyUploaded ? COLORS.primary : '#E5E7EB' }]}
                      disabled={!anyUploaded}
                      onPress={() => {
                        const uploadedDocIds = docModal.requiredDocIds.filter(id => (modalDocStates[id]?.status ?? 'idle') === 'done');
                        setDocModal(null);
                        if (!allDone && !docModal.pendingEligible) {
                          Alert.alert(
                            state.lang === 'hi' ? 'पात्रता नोटिस' : 'Eligibility Notice',
                            state.lang === 'hi'
                              ? 'आप पूरी तरह पात्र नहीं हो सकते, फिर भी आवेदन जमा किया जाएगा।'
                              : 'You may not fully qualify, but your application will be submitted for review.',
                            [
                              { text: state.lang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
                              { text: state.lang === 'hi' ? 'फिर भी आवेदन करें' : 'Apply Anyway', onPress: () => proceedWithApply(docModal.appType, docModal.itemId, docModal.itemName, docModal.itemType, uploadedDocIds) },
                            ],
                          );
                        } else {
                          proceedWithApply(docModal.appType, docModal.itemId, docModal.itemName, docModal.itemType, uploadedDocIds);
                        }
                      }}
                    >
                      <Text style={[styles.footerBtnText, { color: anyUploaded ? '#FFFFFF' : '#9CA3AF' }]}>
                        {state.lang === 'hi' ? 'आवेदन करें' : state.lang === 'mr' ? 'अर्ज करा' : 'Submit Application'}
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },

  topBar: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  topBarSide: { width: 90 },
  headerLogoWrap: { width: 220, height: 74, overflow: 'hidden' },
  headerLogo: { width: 220, height: 220, marginTop: -71 },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  refreshBtnText: { fontSize: 22, color: COLORS.primary },

  stickyHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#EAECEF',
    paddingBottom: 10,
  },
  eligibilityBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#BBF7D0',
  },
  eligDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  eligibilityText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primaryDark,
  },

  tabRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10, gap: 6 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#EAECEF', backgroundColor: '#FAFAFA',
  },
  tabBtnActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  tabText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#6B7280',
  },
  tabTextActive: { color: '#FFFFFF', fontWeight: '500' },
  tabCount: {
    minWidth: 22, height: 18, borderRadius: 9,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabCountText: {
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#6B7280',
  },
  tabCountTextActive: { color: '#FFFFFF' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 12, marginTop: 10,
    backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#EAECEF',
  },
  searchIcon: { fontSize: 16, color: '#9CA3AF' },
  searchInput: {
    flex: 1, fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#1A1A2E',
  },
  searchClear: { padding: 2 },
  searchClearText: { fontSize: 14, color: '#9CA3AF' },

  filterRow: { marginTop: 8 },
  filterScroll: { paddingHorizontal: 12, gap: 6 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: '#EAECEF', backgroundColor: '#FAFAFA',
  },
  filterChipActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  filterChipText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#6B7280',
  },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '500' },
  filterDivider: { width: 1, height: '100%', backgroundColor: '#EAECEF', marginHorizontal: 4 },
  countChip: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#9CA3AF',
    alignSelf: 'center',
  },
  eligChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: '#EAECEF', backgroundColor: '#FAFAFA',
  },
  eligChipText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#6B7280',
  },

  emptyBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0FDF4', borderWidth: 2, borderColor: '#BBF7D0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyIcon: { fontSize: 28, color: COLORS.primary },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#374151',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  list: { padding: 14, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    ...SHADOW.sm, borderWidth: 1, borderColor: '#EAECEF',
  },
  cardClosed: { opacity: 0.65 },
  cardEligible: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },

  statusBanner: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, marginBottom: 10,
  },
  statusBannerText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  eligBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.primary + '50', marginBottom: 10, alignSelf: 'flex-start',
  },
  eligBadgeText: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primary,
  },

  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  cardName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
    lineHeight: 20,
  },
  badgeRow: { gap: 5, alignItems: 'flex-end' },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  stateBadge: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  centralBadge: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  stateText: { color: '#2563EB' },
  centralText: { color: '#D97706' },
  statusPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  activePill: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  closedPill: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  statusPillText: {
    fontSize: 10,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  activePillText: { color: COLORS.primary },
  closedPillText: { color: '#9CA3AF' },

  cardDesc: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 10,
  },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: 12, color: '#9CA3AF' },
  metaValue: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#4B5563',
    maxWidth: 160,
  },

  cardActions: { flexDirection: 'row', gap: 8 },
  knowMoreBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#EAECEF', backgroundColor: '#FAFAFA',
  },
  knowMoreText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#374151',
  },
  applyBtn: {
    flex: 1.2, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  statusBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetModal: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 32, maxHeight: '90%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseBtnText: { fontSize: 14, color: '#6B7280' },
  modalNote: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalScroll: { maxHeight: 300, marginBottom: 16 },
  modalFooter: { gap: 10, paddingTop: 8 },
  footerBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  footerBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },

  statusBigBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 16, borderWidth: 2, marginBottom: 14,
  },
  statusBigIcon: { fontSize: 24 },
  statusBigLabel: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  statusDesc: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  statusMeta: {
    backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 8,
  },
  statusMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  statusMetaLabel: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#9CA3AF',
  },
  statusMetaValue: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
  },
  statusMetaDivider: { height: 1, backgroundColor: '#EAECEF' },
  statusAdminReply: { paddingVertical: 8 },
  statusAdminReplyText: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#374151',
    marginTop: 4,
    lineHeight: 18,
  },

  docUploadCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  docUploadCardDone: { opacity: 0.85 },
  docUploadLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  docUploadIcon: { fontSize: 22 },
  docUploadLabel: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#1A1A2E',
  },
  docUploadError: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: COLORS.error,
    marginTop: 2,
  },
  docUploadStatus: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },
  docDoneBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  docDoneText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primary,
  },
  docUploadBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  docUploadBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#FFFFFF',
  },

  successSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 28, paddingBottom: 40, paddingTop: 30, alignItems: 'center',
  },
  successIconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0FDF4',
    borderWidth: 3, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  successEmoji: {
    fontSize: 30,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primary,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSchemeName: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  successBody: {
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '300',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successIdBox: {
    width: '100%', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 6, marginBottom: 20,
  },
  successIdLabel: {
    fontSize: 11,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#9CA3AF',
  },
  successIdValue: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: COLORS.primaryDark,
  },
  successCloseBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 40, alignItems: 'center',
  },
  successCloseBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
