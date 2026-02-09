import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
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
import { Header, Card, CardContent, Badge, SearchBar, EmptyState, Avatar } from '@/components';
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

  const [patients, setPatients] = useState<PatientDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState<RegistrationStatus>(RegistrationStatus.APPROVED);
  const [search, setSearch] = useState('');

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

  const filtered = patients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      p.patientId?.toLowerCase().includes(q) ||
      p.mobileNumber?.includes(q)
    );
  });

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
                <Text style={[s.detailValue, { color: c.text }]}>Aadhar: ****{item.aadharNumber.slice(-4)}</Text>
              </View>
            )}
            {item.registrationDate && (
              <View style={s.detailRow}>
                <Ionicons name="time-outline" size={14} color={c.textTertiary} />
                <Text style={[s.detailValue, { color: c.text }]}>Reg: {new Date(item.registrationDate).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
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
});
