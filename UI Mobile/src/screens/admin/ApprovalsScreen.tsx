import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { AdminDrawerParamList, PatientDetails, IncomeLevel } from '@/types';
import { RegistrationStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { patientService, commonService } from '@/api';
import { Header, Card, CardContent, Button, Badge, EmptyState, Avatar, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

const FALLBACK_INCOME_OPTIONS: { key: string; label: string; defaultDiscount: number }[] = [
  { key: 'Low', label: 'Low Income', defaultDiscount: 80 },
  { key: 'Medium', label: 'Medium Income', defaultDiscount: 50 },
  { key: 'High', label: 'High Income', defaultDiscount: 20 },
];

export const ApprovalsScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const s = styles(c);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const [patients, setPatients] = useState<PatientDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Approval dialog state
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [incomeLevel, setIncomeLevel] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState('0');

  // Income levels from API
  const [apiIncomeLevels, setApiIncomeLevels] = useState<IncomeLevel[]>([]);

  const fetchPending = useCallback(async () => {
    try {
      const result = await patientService.getPatientsByStatus(RegistrationStatus.PENDING);
      if (result.success && result.data) {
        setPatients(result.data);
      } else {
        setPatients([]);
        if (result.message) showDialog({
          title: 'Error',
          message: result.message,
          icon: 'alert-circle',
          iconColor: c.danger,
          iconBgColor: c.dangerSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Failed to load pending approvals. Please try again.',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIncomeLevels = useCallback(async () => {
    try {
      const result = await commonService.getIncomeLevels();
      if (result.success && result.data) {
        setApiIncomeLevels(result.data);
      }
    } catch {
      // Silently fail - fallback options will be used
      if (__DEV__) console.log('[ApprovalsScreen] Failed to fetch income levels, using fallback options');
    }
  }, []);

  useEffect(() => { fetchPending(); fetchIncomeLevels(); }, [fetchPending, fetchIncomeLevels]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPending();
    setRefreshing(false);
  };

  // Build income level options: prefer API data, fallback to hardcoded
  const incomeLevelOptions = apiIncomeLevels.length > 0
    ? apiIncomeLevels.map(l => ({ key: l.incomeLevelName, label: l.incomeLevelName, defaultDiscount: l.discountPercentage }))
    : FALLBACK_INCOME_OPTIONS;

  const openApprovalModal = (patient: PatientDetails) => {
    setSelectedPatient(patient);
    const first = incomeLevelOptions[0];
    setIncomeLevel(first?.key || '');
    setDiscountPercentage(String(first?.defaultDiscount || 0));
    setApprovalModalVisible(true);
  };

  const handleIncomeLevelChange = (level: string) => {
    setIncomeLevel(level);
    const option = incomeLevelOptions.find(o => o.key === level);
    if (option) setDiscountPercentage(String(option.defaultDiscount));
  };

  const handleApproveConfirm = async () => {
    if (!selectedPatient) return;
    setApprovalModalVisible(false);
    setActionLoading(selectedPatient.id);
    try {
      // Step 1: Update registration status to Approved
      const result = await patientService.updatePatientStatus({
        ...selectedPatient,
        registrationStatus: RegistrationStatus.APPROVED,
      });
      if (!result.success) {
        showDialog({
          title: 'Error',
          message: result.message || 'Failed to approve patient',
          icon: 'alert-circle',
          iconColor: c.danger,
          iconBgColor: c.dangerSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
        setActionLoading(null);
        return;
      }

      // Step 2: Approve KYC with income level and discount
      const kycResult = await patientService.approveKyc({
        id: selectedPatient.id,
        incomeLevel,
        discountPercentage: Number(discountPercentage) || 0,
      });

      setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));

      if (kycResult.success) {
        showDialog({
          title: 'Patient Approved',
          message: `${selectedPatient.fullName || 'Patient'} approved with ${incomeLevel} income level and ${discountPercentage}% discount.`,
          icon: 'checkmark-circle',
          iconColor: c.success,
          iconBgColor: c.successSoft,
          actions: [{ text: 'OK', variant: 'success', onPress: hideDialog }],
        });
      } else {
        // Status updated but KYC failed - still approved, warn user
        showDialog({
          title: 'Partially Completed',
          message: `Patient approved, but income level assignment failed: ${kycResult.message || 'Unknown error'}. Please update manually.`,
          icon: 'warning',
          iconColor: c.warning,
          iconBgColor: c.warningSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Failed to approve patient',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (patient: PatientDetails) => {
    Alert.alert(
      'Reject Patient',
      `Are you sure you want to reject ${patient.fullName || 'this patient'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(patient.id);
            try {
              // Send full patient object with updated status per API spec
              const result = await patientService.updatePatientStatus({
                ...patient,
                registrationStatus: RegistrationStatus.REJECTED,
              });
              if (result.success) {
                setPatients(prev => prev.filter(p => p.id !== patient.id));
                showDialog({
                  title: 'Patient Rejected',
                  message: result.message || 'Patient rejected successfully',
                  icon: 'checkmark-circle',
                  iconColor: c.success,
                  iconBgColor: c.successSoft,
                  actions: [{ text: 'OK', variant: 'success', onPress: hideDialog }],
                });
              } else {
                showDialog({
                  title: 'Error',
                  message: result.message || 'Failed to reject patient',
                  icon: 'alert-circle',
                  iconColor: c.danger,
                  iconBgColor: c.dangerSoft,
                  actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
                });
              }
            } catch {
              showDialog({
                title: 'Error',
                message: 'Failed to reject patient',
                icon: 'alert-circle',
                iconColor: c.danger,
                iconBgColor: c.dangerSoft,
                actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
              });
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: PatientDetails }) => (
    <Card variant="elevated" style={s.card}>
      <CardContent style={s.cardBody}>
        <View style={s.cardTop}>
          <Avatar name={item.fullName || item.patientId} size={44} />
          <View style={s.cardInfo}>
            <Text style={[s.cardName, { color: c.text }]}>{item.fullName || 'Unnamed Patient'}</Text>
            <Text style={[s.cardId, { color: c.textSecondary }]}>ID: {item.patientId}</Text>
          </View>
          <Badge variant="warning" dot>Pending</Badge>
        </View>

        <View style={[s.detailsGrid, { backgroundColor: c.surfaceHover }]}>
          <DetailRow icon="call-outline" label="Mobile" value={item.mobileNumber} />
          {item.email && <DetailRow icon="mail-outline" label="Email" value={item.email} />}
          {item.aadharNumber && <DetailRow icon="card-outline" label="Aadhaar" value={`****${item.aadharNumber.slice(-4)}`} />}
          {item.registrationDate && <DetailRow icon="calendar-outline" label="Registered" value={new Date(item.registrationDate).toLocaleDateString()} />}
          {item.kycDocumentUrl && (
            <TouchableOpacity
              style={s.detailRow}
              activeOpacity={0.7}
              onPress={() => {
                if (item.kycDocumentUrl) {
                  Linking.openURL(item.kycDocumentUrl).catch(() => {
                    showDialog({
                      title: 'Error',
                      message: 'Could not open document URL.',
                      icon: 'alert-circle',
                      iconColor: c.danger,
                      iconBgColor: c.dangerSoft,
                      actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
                    });
                  });
                }
              }}
            >
              <Ionicons name="document-text-outline" size={16} color={c.primary} />
              <Text style={[s.detailLabel, { color: c.primary }]}>KYC Doc</Text>
              <Text style={[s.detailValue, { color: c.primary, textDecorationLine: 'underline' }]}>View Document</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.actions}>
          <Button
            title="Reject"
            onPress={() => handleReject(item)}
            variant="destructive"
            size="sm"
            loading={actionLoading === item.id}
            style={{ flex: 1 }}
            icon={<Ionicons name="close" size={16} color="#FFF" />}
          />
          <Button
            title="Approve"
            onPress={() => openApprovalModal(item)}
            variant="success"
            size="sm"
            loading={actionLoading === item.id}
            style={{ flex: 1 }}
            icon={<Ionicons name="checkmark" size={16} color="#FFF" />}
          />
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <Header
        title="Approvals"
        subtitle={`${patients.length} pending`}
        showBack
        onBackPress={() => navigation.navigate('Dashboard')}
        username={user?.username}
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-done-outline"
              title="All Caught Up!"
              description="No pending approvals at the moment"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Approval Dialog Modal */}
      <Modal visible={approvalModalVisible} transparent animationType="fade" onRequestClose={() => setApprovalModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: c.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={s.modalHeader}>
                <View style={[s.modalIconCircle, { backgroundColor: c.successSoft }]}>
                  <Ionicons name="checkmark-circle" size={28} color={c.success} />
                </View>
                <Text style={[s.modalTitle, { color: c.text }]}>Approve Patient</Text>
                <Text style={[s.modalSubtitle, { color: c.textSecondary }]}>
                  Review and set income-based discount
                </Text>
              </View>

              {/* Patient Info */}
              {selectedPatient && (
                <View style={[s.modalInfoBox, { backgroundColor: c.surfaceHover }]}>
                  <Text style={[s.modalInfoLabel, { color: c.textSecondary }]}>Name</Text>
                  <Text style={[s.modalInfoValue, { color: c.text }]}>{selectedPatient.fullName || 'N/A'}</Text>
                  <Text style={[s.modalInfoLabel, { color: c.textSecondary, marginTop: spacing.sm }]}>Mobile</Text>
                  <Text style={[s.modalInfoValue, { color: c.text }]}>{selectedPatient.mobileNumber}</Text>
                  {selectedPatient.aadharNumber && (
                    <>
                      <Text style={[s.modalInfoLabel, { color: c.textSecondary, marginTop: spacing.sm }]}>Aadhaar</Text>
                      <Text style={[s.modalInfoValue, { color: c.text }]}>****{selectedPatient.aadharNumber.slice(-4)}</Text>
                    </>
                  )}
                </View>
              )}

              {/* Income Level Selector */}
              <Text style={[s.fieldLabel, { color: c.text }]}>Income Level</Text>
              <View style={s.incomeLevelRow}>
                {incomeLevelOptions.map(opt => {
                  const isActive = incomeLevel === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => handleIncomeLevelChange(opt.key)}
                      activeOpacity={0.7}
                      style={[
                        s.incomeLevelBtn,
                        {
                          backgroundColor: isActive ? c.primary : c.surfaceHover,
                          borderColor: isActive ? c.primary : c.border,
                        },
                      ]}
                    >
                      <Text style={[s.incomeLevelText, { color: isActive ? '#FFF' : c.textSecondary }]}>
                        {opt.label}
                      </Text>
                      <Text style={[s.incomeLevelHint, { color: isActive ? 'rgba(255,255,255,0.7)' : c.textTertiary }]}>
                        {opt.defaultDiscount}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Discount % input */}
              <Text style={[s.fieldLabel, { color: c.text, marginTop: spacing.lg }]}>Discount Percentage</Text>
              <View style={[s.discountInputRow, { borderColor: c.inputBorder, backgroundColor: c.inputBackground }]}>
                <TextInput
                  value={discountPercentage}
                  onChangeText={(v) => setDiscountPercentage(v.replace(/[^0-9]/g, '').slice(0, 3))}
                  keyboardType="numeric"
                  maxLength={3}
                  style={[s.discountInput, { color: c.text }]}
                  placeholderTextColor={c.textTertiary}
                  placeholder="0"
                />
                <Text style={[s.discountSuffix, { color: c.textSecondary }]}>%</Text>
              </View>

              {/* Actions */}
              <View style={s.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => setApprovalModalVisible(false)}
                  variant="outline"
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Approve"
                  onPress={handleApproveConfirm}
                  variant="success"
                  size="md"
                  style={{ flex: 1 }}
                  icon={<Ionicons name="checkmark" size={18} color="#FFF" />}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AppDialog {...dialogProps} />
    </View>
  );
};

const DetailRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => {
  const { colors: tc } = useTheme();
  const s = styles(tc);
  return (
    <View style={s.detailRow}>
      <Ionicons name={icon as any} size={16} color={tc.textTertiary} />
      <Text style={[s.detailLabel, { color: tc.textTertiary }]}>{label}:</Text>
      <Text style={[s.detailValue, { color: tc.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
};

const styles = (c: any) => ({
  container: { flex: 1, backgroundColor: c.background },
  loader: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
  list: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  card: { marginBottom: spacing.md },
  cardBody: { padding: spacing.lg },
  cardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: c.text,
  },
  cardId: {
    fontSize: fontSize.xs,
    color: c.textSecondary,
    marginTop: 1,
  },
  detailsGrid: {
    backgroundColor: c.surfaceHover,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: c.textTertiary,
    width: 70,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: c.text,
    flex: 1,
    fontWeight: fontWeight.medium,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  /* Approval Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '85%' as any,
  },
  modalHeader: {
    alignItems: 'center' as const,
    marginBottom: spacing.xl,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  modalInfoBox: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  modalInfoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  modalInfoValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  incomeLevelRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  incomeLevelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center' as const,
  },
  incomeLevelText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  incomeLevelHint: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  discountInputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  discountInput: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    paddingVertical: spacing.md,
  },
  discountSuffix: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginLeft: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
