import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { AdminDrawerParamList, PatientDetails } from '@/types';
import { RegistrationStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { patientService } from '@/api';
import { Header, Card, CardContent, Badge, SearchBar, EmptyState, Avatar, Button, AppDialog, Input } from '@/components';
import { useDialog } from '@/hooks';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

const statusTabs = [
  { key: RegistrationStatus.APPROVED, label: 'Approved', variant: 'success' as const },
  { key: RegistrationStatus.PENDING, label: 'Pending', variant: 'warning' as const },
  { key: RegistrationStatus.REJECTED, label: 'Rejected', variant: 'destructive' as const },
];

export const PatientsScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const s = styles(c);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const [patients, setPatients] = useState<PatientDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState<RegistrationStatus>(RegistrationStatus.APPROVED);
  const [search, setSearch] = useState('');

  // Edit patient modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPatient, setEditPatient] = useState<PatientDetails | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', mobileNumber: '', email: '', dob: '' });
  const [editSaving, setEditSaving] = useState(false);

  const fetchPatients = useCallback(async (status: RegistrationStatus) => {
    setLoading(true);
    try {
      const result = await patientService.getPatientsByStatus(status);
      if (result.success && result.data) {
        setPatients(result.data);
      } else {
        setPatients([]);
      }
    } catch (error: any) {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(activeStatus); }, [activeStatus, fetchPatients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatients(activeStatus);
    setRefreshing(false);
  };

  const openEditModal = (patient: PatientDetails) => {
    setEditPatient(patient);
    setEditForm({
      fullName: patient.fullName || '',
      mobileNumber: patient.mobileNumber || '',
      email: patient.email || '',
      dob: patient.dob || '',
    });
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!editPatient) return;
    setEditSaving(true);
    try {
      const updatedPatient: Partial<PatientDetails> = {
        ...editPatient,
        fullName: editForm.fullName,
        mobileNumber: editForm.mobileNumber,
        email: editForm.email,
        dob: editForm.dob,
      };
      const result = await patientService.updatePatient(updatedPatient);
      setEditModalVisible(false);
      if (result.success) {
        // Refresh list to show updated data
        await fetchPatients(activeStatus);
        showDialog({
          title: 'Changes Saved',
          message: result.message || `Patient "${editForm.fullName}" details have been updated.`,
          icon: 'checkmark-circle',
          iconColor: c.success,
          iconBgColor: c.successSoft,
          actions: [{ text: 'OK', variant: 'success', onPress: hideDialog }],
        });
      } else {
        showDialog({
          title: 'Update Failed',
          message: result.message || 'Failed to update patient details. Please try again.',
          icon: 'alert-circle',
          iconColor: c.danger,
          iconBgColor: c.dangerSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } catch {
      setEditModalVisible(false);
      showDialog({
        title: 'Error',
        message: 'An unexpected error occurred while updating patient details.',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    } finally {
      setEditSaving(false);
    }
  };

  const filtered = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      p.patientId?.toLowerCase().includes(q) ||
      p.mobileNumber?.includes(q)
    );
  });

  /** Capsule label for income level */
  const IncomeBadge: React.FC<{ level?: string }> = ({ level }) => {
    if (!level) return null;
    const variant = level === 'low' ? 'success' : level === 'medium' ? 'warning' : 'destructive';
    return <Badge variant={variant}>{level.charAt(0).toUpperCase() + level.slice(1)}</Badge>;
  };

  const renderItem = ({ item }: { item: PatientDetails }) => {
    const statusVariant = activeStatus === RegistrationStatus.APPROVED ? 'success'
      : activeStatus === RegistrationStatus.PENDING ? 'warning' : 'destructive';

    return (
      <Card variant="elevated" style={s.card}>
        <CardContent style={s.cardBody}>
          <View style={s.cardTop}>
            <Avatar name={item.fullName || item.patientId} size={40} />
            <View style={s.cardInfo}>
              <Text style={[s.cardName, { color: c.text }]}>{item.fullName || 'Unnamed Patient'}</Text>
              <Text style={[s.cardId, { color: c.textSecondary }]}>ID: {item.patientId}</Text>
            </View>
            <Badge variant={statusVariant}>{activeStatus}</Badge>
          </View>

          <View style={[s.detailsGrid, { backgroundColor: c.surfaceHover }]}>
            <View style={s.detailRow}>
              <Ionicons name="call-outline" size={14} color={c.textTertiary} />
              <Text style={[s.detailValue, { color: c.text }]}>{item.mobileNumber}</Text>
            </View>
            {item.email && (
              <View style={s.detailRow}>
                <Ionicons name="mail-outline" size={14} color={c.textTertiary} />
                <Text style={[s.detailValue, { color: c.text }]} numberOfLines={1}>{item.email}</Text>
              </View>
            )}
            {item.dob && (
              <View style={s.detailRow}>
                <Ionicons name="calendar-outline" size={14} color={c.textTertiary} />
                <Text style={[s.detailValue, { color: c.text }]}>DOB: {new Date(item.dob).toLocaleDateString()}</Text>
              </View>
            )}
            {item.aadharNumber && (
              <View style={s.detailRow}>
                <Ionicons name="card-outline" size={14} color={c.textTertiary} />
                <Text style={[s.detailValue, { color: c.text }]}>Aadhaar: ****{item.aadharNumber.slice(-4)}</Text>
              </View>
            )}
            {item.registrationDate && (
              <View style={s.detailRow}>
                <Ionicons name="time-outline" size={14} color={c.textTertiary} />
                <Text style={[s.detailValue, { color: c.text }]}>Reg: {new Date(item.registrationDate).toLocaleDateString()}</Text>
              </View>
            )}
            {/* Income Level & Discount — new fields */}
            {item.incomeLevel && (
              <View style={s.detailRow}>
                <Ionicons name="wallet-outline" size={14} color={c.textTertiary} />
                <Text style={[s.detailValue, { color: c.text }]}>Income: </Text>
                <IncomeBadge level={item.incomeLevel} />
              </View>
            )}
            {item.discountPercentage != null && (
              <View style={s.detailRow}>
                <Ionicons name="pricetag-outline" size={14} color={c.success} />
                <Text style={[s.detailValue, { color: c.success, fontWeight: fontWeight.semibold }]}>
                  Discount: {item.discountPercentage}%
                </Text>
              </View>
            )}
          </View>

          {/* Edit button for approved patients */}
          {activeStatus === RegistrationStatus.APPROVED && (
            <TouchableOpacity
              style={[s.editBtn, { borderColor: c.border }]}
              activeOpacity={0.7}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="create-outline" size={16} color={c.primary} />
              <Text style={[s.editBtnText, { color: c.primary }]}>Edit Patient</Text>
            </TouchableOpacity>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <Header
        title="Patients"
        subtitle={`${filtered.length} ${activeStatus.toLowerCase()}`}
        showBack
        onBackPress={() => navigation.navigate('Dashboard')}
        username={user?.username}
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      {/* Status Tabs */}
      <View style={[s.tabsContainer, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View style={[s.tabs, { backgroundColor: c.surfaceHover }]}>
          {statusTabs.map((tab) => {
            const isActive = activeStatus === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveStatus(tab.key)}
                activeOpacity={0.7}
                style={[s.tab, isActive && { backgroundColor: c.primary }]}
              >
                <Text style={[s.tabText, { color: isActive ? '#FFF' : c.textSecondary }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, ID, or mobile..."
          style={{ marginTop: spacing.md }}
        />
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No Patients Found"
              description={search ? 'Try a different search term' : `No ${activeStatus.toLowerCase()} patients`}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Edit Patient Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: c.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={s.modalHeader}>
                <View style={[s.modalIconCircle, { backgroundColor: c.primarySoft }]}>
                  <Ionicons name="create-outline" size={28} color={c.primary} />
                </View>
                <Text style={[s.modalTitle, { color: c.text }]}>Edit Patient</Text>
              </View>

              <Input
                label="Full Name"
                placeholder="Full name"
                value={editForm.fullName}
                onChangeText={(v) => setEditForm(prev => ({ ...prev, fullName: v }))}
                leftIcon={<Ionicons name="person-outline" size={18} color={c.textTertiary} />}
              />
              <Input
                label="Mobile Number"
                placeholder="Mobile"
                value={editForm.mobileNumber}
                onChangeText={(v) => setEditForm(prev => ({ ...prev, mobileNumber: v }))}
                keyboardType="phone-pad"
                leftIcon={<Ionicons name="call-outline" size={18} color={c.textTertiary} />}
              />
              <Input
                label="Email"
                placeholder="Email"
                value={editForm.email}
                onChangeText={(v) => setEditForm(prev => ({ ...prev, email: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={18} color={c.textTertiary} />}
              />
              <Input
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                value={editForm.dob}
                onChangeText={(v) => setEditForm(prev => ({ ...prev, dob: v }))}
                leftIcon={<Ionicons name="calendar-outline" size={18} color={c.textTertiary} />}
              />

              <View style={s.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => setEditModalVisible(false)}
                  variant="outline"
                  size="md"
                  style={{ flex: 1 }}
                  disabled={editSaving}
                />
                <Button
                  title={editSaving ? 'Saving...' : 'Save Changes'}
                  onPress={handleEditSave}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                  loading={editSaving}
                  icon={!editSaving ? <Ionicons name="checkmark" size={18} color="#FFF" /> : undefined}
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

const styles = (c: any) => ({
  container: { flex: 1, backgroundColor: c.background },
  loader: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  tabs: {
    flexDirection: 'row' as const,
    backgroundColor: c.surfaceHover,
    borderRadius: borderRadius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center' as const,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: c.textSecondary,
  },
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
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: c.text,
    flex: 1,
  },
  editBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  editBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  /* Edit Modal */
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
  modalActions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
