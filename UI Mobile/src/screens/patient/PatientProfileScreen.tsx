import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerScreenProps } from '@react-navigation/drawer';
import type { PatientDrawerParamList, PatientDetails } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { patientService } from '@/api';
import { Header, Button, Input, Card, CardContent, Avatar, LoadingOverlay, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme';

type Props = DrawerScreenProps<PatientDrawerParamList, 'Profile'>;

export const PatientProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mobileNumber, patientId } = route.params || {};
  const { colors: c } = useTheme();
  const { user, enableBiometrics, disableBiometrics, isBiometricEnabled, biometricAvailable } = useAuth();
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    aadharNumber: '',
    dob: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    fetchPatient();
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const enabled = await isBiometricEnabled();
    setBiometricEnabled(enabled);
  };

  const fetchPatient = async () => {
    try {
      const mobile = mobileNumber || user?.mobileNumber;
      if (!mobile) return;
      const result = await patientService.getPatientByMobileNumber(mobile);
      if (result.success && result.data) {
        setPatient(result.data);
        setForm({
          fullName: result.data.fullName || '',
          email: result.data.email || '',
          aadharNumber: result.data.aadharNumber || '',
          dob: result.data.dob ? result.data.dob.split('T')[0] : '',
        });
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Failed to load profile',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.aadharNumber || form.aadharNumber.length !== 12 || !/^\d{12}$/.test(form.aadharNumber)) {
      newErrors.aadharNumber = 'Aadhar must be 12 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await patientService.updatePatient({
        id: patient?.id,
        patientId: patientId || patient?.patientId || '',
        mobileNumber: mobileNumber || patient?.mobileNumber || '',
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        aadharNumber: form.aadharNumber,
        dob: form.dob || undefined,
        registrationStatus: patient?.registrationStatus || 'Pending',
        status: patient?.status,
        createdBy: patient?.createdBy,
        createdDate: patient?.createdDate,
        updatedDate: new Date().toISOString(),
        updatedBy: patient?.updatedBy,
      });
      if (result.success) {
        showDialog({
          title: 'Success',
          message: 'Profile updated successfully',
          icon: 'checkmark-circle',
          iconColor: c.success,
          iconBgColor: c.successSoft,
          actions: [{
            text: 'OK',
            variant: 'success',
            onPress: () => {
              hideDialog();
              navigation.navigate('Dashboard', {
                mobileNumber: mobileNumber || user?.mobileNumber || '',
                patientId: patientId || patient?.patientId || '',
              });
            },
          }],
        });
        await fetchPatient();
      } else {
        showDialog({
          title: 'Error',
          message: result.message || 'Failed to update profile',
          icon: 'alert-circle',
          iconColor: c.danger,
          iconBgColor: c.dangerSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Something went wrong',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Enable biometrics
      const success = await enableBiometrics();
      if (success) {
        setBiometricEnabled(true);
        showDialog({
          title: 'Success',
          message: 'Biometric login enabled. You can now use fingerprint/face ID to login quickly.',
          icon: 'finger-print',
          iconColor: c.success,
          iconBgColor: c.successSoft,
          actions: [{ text: 'Great!', variant: 'success', onPress: hideDialog }],
        });
      } else {
        showDialog({
          title: 'Failed',
          message: 'Could not enable biometric authentication. Please try again.',
          icon: 'alert-circle',
          iconColor: c.warning,
          iconBgColor: c.warningSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } else {
      // Disable biometrics
      await disableBiometrics();
      setBiometricEnabled(false);
      showDialog({
        title: 'Success',
        message: 'Biometric login disabled.',
        icon: 'finger-print',
        iconColor: c.textSecondary,
        iconBgColor: c.surfaceHover,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={c.surface} />
      <LoadingOverlay visible={loading || saving} message={loading ? 'Loading profile...' : 'Saving...'} />
      <AppDialog {...dialogProps} />

      <Header
        title="My Profile"
        subtitle="Edit your details"
        showBack
        onBackPress={() => navigation.goBack()}
        username={patient?.fullName || mobileNumber || user?.username}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Avatar Card */}
        {patient && (
          <Card variant="elevated" style={styles.avatarCard}>
            <CardContent style={styles.avatarContent}>
              <Avatar name={patient.fullName || mobileNumber || ''} size={72} />
              <Text style={[styles.patientName, { color: c.text }]}>{patient.fullName || 'Patient'}</Text>
              <Text style={[styles.patientId, { color: c.textSecondary }]}>ID: {patient.patientId}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="call" size={14} color={c.textTertiary} />
                <Text style={[styles.metaText, { color: c.textTertiary }]}>{mobileNumber || patient.mobileNumber}</Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Edit Form */}
        <Card variant="elevated" style={styles.formCard}>
          <CardContent>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Personal Information</Text>

            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={form.fullName}
              onChangeText={(v) => updateField('fullName', v)}
              error={errors.fullName}
              leftIcon={<Ionicons name="person-outline" size={18} color={c.textTertiary} />}
            />

            <Input
              label="Email"
              placeholder="your@email.com"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color={c.textTertiary} />}
            />

            <Input
              label="Aadhar Number"
              placeholder="12-digit Aadhar number"
              value={form.aadharNumber}
              onChangeText={(v) => updateField('aadharNumber', v.replace(/\D/g, '').slice(0, 12))}
              error={errors.aadharNumber}
              keyboardType="numeric"
              maxLength={12}
              leftIcon={<Ionicons name="card-outline" size={18} color={c.textTertiary} />}
            />

            <Input
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={form.dob}
              onChangeText={(v) => updateField('dob', v)}
              leftIcon={<Ionicons name="calendar-outline" size={18} color={c.textTertiary} />}
              hint="Format: YYYY-MM-DD"
            />

            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={saving}
              fullWidth
              size="lg"
              icon={<Ionicons name="checkmark-circle" size={20} color="#FFF" />}
            />
          </CardContent>
        </Card>

        {/* Security Settings */}
        {biometricAvailable && (
          <Card variant="elevated" style={styles.securityCard}>
            <CardContent>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Security Settings</Text>
              <View style={styles.biometricRow}>
                <View style={styles.biometricInfo}>
                  <View style={[styles.biometricIcon, { backgroundColor: c.primarySoft }]}>
                    <Ionicons name="finger-print" size={24} color={c.primary} />
                  </View>
                  <View style={styles.biometricText}>
                    <Text style={[styles.biometricLabel, { color: c.text }]}>Biometric Login</Text>
                    <Text style={[styles.biometricDesc, { color: c.textSecondary }]}>
                      Use fingerprint or face ID for quick login
                    </Text>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: c.border, true: c.primarySoft }}
                  thumbColor={biometricEnabled ? c.primary : c.textTertiary}
                />
              </View>
            </CardContent>
          </Card>
        )}

        {/* Registration Info */}
        {patient && (
          <Card variant="outlined" style={styles.infoCard}>
            <CardContent>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Registration Info</Text>
              <InfoRow icon="shield-outline" label="Status" value={patient.registrationStatus || 'N/A'} colors={c} />
              <InfoRow icon="time-outline" label="Registered" value={patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString() : 'N/A'} colors={c} />
              <InfoRow icon="calendar-outline" label="DOB" value={patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Not set'} colors={c} last />
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string; colors: any; last?: boolean }> = ({ icon, label, value, colors: c, last }) => (
  <View style={[infoStyles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
    <Ionicons name={icon as any} size={18} color={c.textTertiary} />
    <Text style={[infoStyles.label, { color: c.textSecondary }]}>{label}</Text>
    <Text style={[infoStyles.value, { color: c.text }]}>{value}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  avatarCard: { marginBottom: spacing.lg },
  avatarContent: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  patientName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  patientId: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  metaText: {
    fontSize: fontSize.sm,
  },
  formCard: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  securityCard: { marginBottom: spacing.lg },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  biometricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricText: {
    flex: 1,
  },
  biometricLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  biometricDesc: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  infoCard: { marginBottom: spacing.lg },
});
