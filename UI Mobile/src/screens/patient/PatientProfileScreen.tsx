import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Switch,
  TouchableOpacity,
  Modal,
  Animated,
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
  const { colors: c, colorScheme, toggleTheme } = useTheme();
  const { user, enableBiometrics, disableBiometrics, isBiometricEnabled, biometricAvailable, logout } = useAuth();
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
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    fetchPatient();
    checkBiometricStatus();
  }, []);

  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
  };

  const handleLogout = () => {
    closeMenu();
    showDialog({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      icon: 'log-out-outline',
      iconColor: c.danger,
      iconBgColor: c.dangerSoft,
      actions: [
        { text: 'Cancel', variant: 'default', onPress: hideDialog },
        {
          text: 'Logout',
          variant: 'destructive',
          onPress: async () => {
            hideDialog();
            await logout();
          },
        },
      ],
    });
  };

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

      <View style={[styles.header, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: c.text }]}>My Profile</Text>
            <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>Edit your details</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7} style={styles.themeButton}>
              <Ionicons name={colorScheme === 'dark' ? 'sunny' : 'moon'} size={24} color={c.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openMenu} activeOpacity={0.7} style={styles.menuButton}>
              <Ionicons name="menu" size={28} color={c.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
      <LoadingOverlay visible={loading || saving} message={loading ? 'Loading profile...' : 'Saving...'} />
      <AppDialog {...dialogProps} />

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.menuOverlay} 
          onPress={closeMenu}
        >
          <Animated.View
            style={[
              styles.menuPanel,
              { 
                backgroundColor: c.surface,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Patient Details Section */}
            <View style={[styles.menuHeader, { borderBottomColor: c.border }]}>
              {patient && (
                <View style={styles.menuPatientInfo}>
                  <Avatar name={patient.fullName || mobileNumber || ''} size={56} />
                  <Text style={[styles.menuPatientName, { color: c.text }]}>{patient.fullName || 'Patient'}</Text>
                  <Text style={[styles.menuPatientId, { color: c.textSecondary }]}>ID: {patient.patientId}</Text>
                  <View style={styles.menuMetaRow}>
                    <Ionicons name="call" size={12} color={c.textTertiary} />
                    <Text style={[styles.menuMetaText, { color: c.textTertiary }]}>{mobileNumber || patient.mobileNumber}</Text>
                  </View>
                  {patient.registrationStatus && (
                    <View style={[styles.menuStatusBadge, { 
                      backgroundColor: patient.registrationStatus === 'Approved' ? c.successSoft : c.warningSoft 
                    }]}>
                      <Ionicons 
                        name={patient.registrationStatus === 'Approved' ? 'checkmark-circle' : 'time'} 
                        size={12} 
                        color={patient.registrationStatus === 'Approved' ? c.success : c.warning} 
                      />
                      <Text style={[styles.menuStatusText, { 
                        color: patient.registrationStatus === 'Approved' ? c.success : c.warning 
                      }]}>{patient.registrationStatus}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Menu Actions */}
            <View style={styles.menuActions}>
              {/* Theme Toggle */}
              <View style={styles.menuActionRow}>
                <View style={[styles.menuActionIcon, { backgroundColor: c.primarySoft }]}>
                  <Ionicons name={colorScheme === 'dark' ? 'moon' : 'sunny'} size={20} color={c.primary} />
                </View>
                <View style={styles.menuActionInfo}>
                  <Text style={[styles.menuActionLabel, { color: c.text }]}>Dark Mode</Text>
                  <Text style={[styles.menuActionDesc, { color: c.textTertiary }]}>
                    {colorScheme === 'dark' ? 'On' : 'Off'}
                  </Text>
                </View>
                <Switch
                  value={colorScheme === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: c.border, true: c.primarySoft }}
                  thumbColor={colorScheme === 'dark' ? c.primary : c.textTertiary}
                />
              </View>

              {/* Logout */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleLogout}
                style={[styles.menuActionRow, styles.logoutRow, { backgroundColor: c.dangerSoft }]}
              >
                <View style={[styles.menuActionIcon, { backgroundColor: c.danger }]}>
                  <Ionicons name="log-out-outline" size={20} color="#FFF" />
                </View>
                <View style={styles.menuActionInfo}>
                  <Text style={[styles.menuActionLabel, { color: c.danger }]}>Logout</Text>
                  <Text style={[styles.menuActionDesc, { color: c.danger, opacity: 0.7 }]}>
                    Sign out of your account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={c.danger} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  menuButton: {
    padding: spacing.sm,
  },
  themeButton: {
    padding: spacing.sm,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  menuHeader: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  menuPatientInfo: {
    alignItems: 'center',
  },
  menuPatientName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  menuPatientId: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  menuMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  menuMetaText: {
    fontSize: fontSize.xs,
  },
  menuStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  menuStatusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  menuActions: {
    flex: 1,
    paddingTop: spacing.md,
  },
  menuActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  menuActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuActionInfo: {
    flex: 1,
  },
  menuActionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  menuActionDesc: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  logoutRow: {
    marginHorizontal: spacing.lg,
    marginTop: 'auto',
    marginBottom: spacing.xl,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
  },
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
