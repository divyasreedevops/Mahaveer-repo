import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { AdminDrawerParamList, PatientDetails } from '@/types';
import { RegistrationStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { patientService } from '@/api';
import { Header, Card, CardContent, Button, Badge, EmptyState, Avatar, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

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

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPending();
    setRefreshing(false);
  };

  const handleStatusUpdate = (patient: PatientDetails, newStatus: RegistrationStatus) => {
    const action = newStatus === RegistrationStatus.APPROVED ? 'approve' : 'reject';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Patient`,
      `Are you sure you want to ${action} ${patient.fullName || 'this patient'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: newStatus === RegistrationStatus.REJECTED ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(patient.id);
            try {
              const result = await patientService.updatePatientStatus({
                id: patient.id,
                patientId: patient.patientId,
                registrationStatus: newStatus,
                fullName: patient.fullName || '',
                mobileNumber: patient.mobileNumber,
                email: patient.email || '',
                aadharNumber: patient.aadharNumber || '',
              });
              if (result.success) {
                setPatients(prev => prev.filter(p => p.id !== patient.id));
                showDialog({
                  title: 'Success',
                  message: result.message || `Patient ${action}ed successfully`,
                  icon: 'checkmark-circle',
                  iconColor: c.success,
                  iconBgColor: c.successSoft,
                  actions: [{ text: 'OK', variant: 'success', onPress: hideDialog }],
                });
              } else {
                showDialog({
                  title: 'Error',
                  message: result.message || `Failed to ${action} patient`,
                  icon: 'alert-circle',
                  iconColor: c.danger,
                  iconBgColor: c.dangerSoft,
                  actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
                });
              }
            } catch {
              showDialog({
                title: 'Error',
                message: `Failed to ${action} patient`,
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
          {item.aadharNumber && <DetailRow icon="card-outline" label="Aadhar" value={`****${item.aadharNumber.slice(-4)}`} />}
          {item.registrationDate && <DetailRow icon="calendar-outline" label="Registered" value={new Date(item.registrationDate).toLocaleDateString()} />}
        </View>

        <View style={s.actions}>
          <Button
            title="Reject"
            onPress={() => handleStatusUpdate(item, RegistrationStatus.REJECTED)}
            variant="destructive"
            size="sm"
            loading={actionLoading === item.id}
            style={{ flex: 1 }}
            icon={<Ionicons name="close" size={16} color="#FFF" />}
          />
          <Button
            title="Approve"
            onPress={() => handleStatusUpdate(item, RegistrationStatus.APPROVED)}
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
      <AppDialog {...dialogProps} />
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
});
