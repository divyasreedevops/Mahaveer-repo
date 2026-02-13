import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import type { PatientDrawerParamList, PatientDetails } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { patientService } from '@/api';
import { Header, Card, CardContent, Button, Badge, Avatar, LoadingOverlay, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

type Props = DrawerScreenProps<PatientDrawerParamList, 'Dashboard'>;

export const PatientDashboardScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mobileNumber, patientId } = route.params || {};
  const { logout, user } = useAuth();
  const { colors: c } = useTheme();
  const s = styles(c);

  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchPatient = async () => {
    try {
      const mobile = mobileNumber || user?.mobileNumber;
      if (!mobile) return;
      const result = await patientService.getPatientByMobileNumber(mobile);
      if (result.success && result.data) {
        setPatient(result.data);
      } else if (!result.success && result.message) {
        showDialog({
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
        message: 'Failed to load patient data. Please try again.',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPatient();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatient();
    setRefreshing(false);
  };

  const status = patient?.registrationStatus?.toLowerCase();
  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  // Prioritized KYC Workflow (matching Figma):
  // Check all 4 KYC fields — name, DOB, Aadhaar, income document
  const isKYCIncomplete = !patient?.fullName || patient.fullName.trim() === ''
    || !patient?.dob || patient.dob.trim() === ''
    || !patient?.aadharNumber || patient.aadharNumber.trim() === ''
    || !patient?.incomeDocumentUrl || patient.incomeDocumentUrl.trim() === '';

  // If KYC incomplete, show message to complete profile (regardless of approval status)
  if (isKYCIncomplete && patient) {
    return (
      <View style={[s.container, { backgroundColor: c.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={c.surface} />

        <Header
          title="Welcome"
          subtitle="Complete Your Profile"
          onMenuPress={() => navigation.openDrawer()}
          username={patient?.fullName || mobileNumber || user?.username}
          onAvatarPress={() => navigation.navigate('Profile', {
            mobileNumber: mobileNumber || user?.mobileNumber || '',
            patientId: patientId || patient?.patientId || '',
          })}
        />

        <ScrollView contentContainerStyle={s.content}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="elevated" style={s.statusCard}>
            <CardContent style={s.statusContent}>
              <View style={[s.statusIcon, { backgroundColor: c.warningSoft }]}>
                <Ionicons name="person-add" size={40} color={c.warning} />
              </View>
              <Text style={[s.statusTitle, { color: c.text }]}>Complete Your Profile</Text>
              <Text style={[s.statusDesc, { color: c.textSecondary }]}>
                Please complete your profile with your Aadhar card details to access all features.
              </Text>
              <Button
                title="Go to Profile"
                onPress={() => navigation.navigate('Profile', { 
                  mobileNumber: mobileNumber || user?.mobileNumber || '', 
                  patientId: patientId || patient?.patientId || '' 
                })}
                fullWidth
                size="lg"
                icon={<Ionicons name="arrow-forward" size={20} color="#FFF" />}
                style={{ marginTop: spacing.lg }}
              />
            </CardContent>
          </Card>
          </Animated.View>
        </ScrollView>
        <LoadingOverlay visible={loading} message="Loading profile..." />
        <AppDialog {...dialogProps} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.surface} />

      <Header
        title="My Dashboard"
        subtitle="Patient Portal"
        onMenuPress={() => navigation.openDrawer()}
        username={patient?.fullName || mobileNumber || user?.username}
        onAvatarPress={() => navigation.navigate('Profile', {
          mobileNumber: mobileNumber || user?.mobileNumber || '',
          patientId: patientId || patient?.patientId || '',
        })}
      />

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Patient Info Card */}
        {patient && (
          <Card variant="elevated" style={s.profileCard}>
            <CardContent style={s.profileContent}>
              <Avatar name={patient.fullName || mobileNumber || ''} size={60} />
              <View style={s.profileInfo}>
                <Text style={[s.profileName, { color: c.text }]}>{patient.fullName || 'Patient'}</Text>
                <Text style={[s.profileId, { color: c.textSecondary }]}>ID: {patient.patientId}</Text>
                <View style={s.profileMeta}>
                  <Ionicons name="call" size={14} color={c.textTertiary} />
                  <Text style={[s.profileMetaText, { color: c.textTertiary }]}>{patient.mobileNumber}</Text>
                </View>
              </View>
              <Badge
                variant={isApproved ? 'success' : isPending ? 'warning' : 'destructive'}
                dot
              >
                {patient.registrationStatus}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Status-based content */}
        {isPending && (
          <Card variant="elevated" style={s.statusCard}>
            <CardContent style={s.statusContent}>
              <View style={[s.statusIcon, { backgroundColor: c.warningSoft }]}>
                <Ionicons name="time" size={40} color={c.warning} />
              </View>
              <Text style={[s.statusTitle, { color: c.text }]}>Registration Pending</Text>
              <Text style={[s.statusDesc, { color: c.textSecondary }]}>
                Your registration is being reviewed by our admin team. You'll be notified once it's approved.
              </Text>
            </CardContent>
          </Card>
        )}

        {isRejected && (
          <Card variant="elevated" style={s.statusCard}>
            <CardContent style={s.statusContent}>
              <View style={[s.statusIcon, { backgroundColor: c.dangerSoft }]}>
                <Ionicons name="close-circle" size={40} color={c.danger} />
              </View>
              <Text style={[s.statusTitle, { color: c.text }]}>Registration Rejected</Text>
              <Text style={[s.statusDesc, { color: c.textSecondary }]}>
                Unfortunately, your registration was not approved. Please contact support for more information.
              </Text>
            </CardContent>
          </Card>
        )}

        {isApproved && (
          <>
            {/* Quick Actions */}
            <Text style={[s.sectionTitle, { color: c.text }]}>Services</Text>
            <View style={s.servicesGrid}>
              <ServiceCard
                icon="document-text-outline"
                label="Upload Prescription"
                desc="Upload your prescription for processing"
                color={c.primary}
                bgColor={c.primarySoft}
                onPress={() => navigation.navigate('PrescriptionUpload', { 
                  patientId: patient?.patientId || patientId || '', 
                  mobileNumber: patient?.mobileNumber || mobileNumber || '' 
                })}
              />
              <ServiceCard
                icon="receipt-outline"
                label="View Invoice"
                desc="Check your latest invoice"
                color="#7C3AED"
                bgColor="#F5F3FF"
                onPress={() => navigation.navigate('InvoiceView', { 
                  patientId: patient?.patientId || patientId || '', 
                  mobileNumber: patient?.mobileNumber || mobileNumber || '' 
                })}
              />
              <ServiceCard
                icon="calendar-outline"
                label="Pickup Slot"
                desc="View your medicine pickup schedule"
                color={c.success}
                bgColor={c.successSoft}
                onPress={() => navigation.navigate('SlotBooking', { 
                  patientId: patient?.patientId || patientId || '', 
                  mobileNumber: patient?.mobileNumber || mobileNumber || '' 
                })}
              />
              <ServiceCard
                icon="person-outline"
                label="My Profile"
                desc="View and edit your profile"
                color={c.warning}
                bgColor={c.warningSoft}
                onPress={() => navigation.navigate('Profile', { 
                  patientId: patient?.patientId || patientId || '', 
                  mobileNumber: patient?.mobileNumber || mobileNumber || '' 
                })}
              />
            </View>
          </>
        )}
        </Animated.View>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Loading profile..." />
      <AppDialog {...dialogProps} />
    </View>
  );
};

const ServiceCard: React.FC<{
  icon: string;
  label: string;
  desc: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}> = ({ icon, label, desc, color, bgColor, onPress }) => {
  const { colors: tc } = useTheme();
  const ss = serviceStyles(tc);
  return (
    <Card variant="elevated" style={ss.card}>
      <CardContent style={ss.content}>
        <View style={ss.touchable} onTouchEnd={onPress}>
          <View style={[ss.iconBg, { backgroundColor: bgColor }]}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
          <Text style={[ss.label, { color: tc.text }]}>{label}</Text>
          <Text style={[ss.desc, { color: tc.textTertiary }]}>{desc}</Text>
        </View>
      </CardContent>
    </Card>
  );
};

const serviceStyles = (tc: any) => ({
  card: { width: '48%' as unknown as number, marginBottom: spacing.md },
  content: { padding: spacing.md },
  touchable: { alignItems: 'center' as const },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: tc.text,
    textAlign: 'center' as const,
    marginBottom: 2,
  },
  desc: {
    fontSize: fontSize.xs,
    color: tc.textTertiary,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
});

const styles = (c: any) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  profileCard: { marginBottom: spacing.xl },
  profileContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
    padding: spacing.lg,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: c.text,
  },
  profileId: {
    fontSize: fontSize.xs,
    color: c.textSecondary,
    marginTop: 1,
  },
  profileMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 4,
  },
  profileMetaText: {
    fontSize: fontSize.xs,
    color: c.textTertiary,
  },
  statusCard: { marginBottom: spacing.xl },
  statusContent: {
    alignItems: 'center' as const,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.lg,
  },
  statusTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: c.text,
    marginBottom: spacing.sm,
  },
  statusDesc: {
    fontSize: fontSize.sm,
    color: c.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: c.text,
    marginBottom: spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    marginBottom: spacing.xl,
  },
});
