import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { patientService } from '@/api';
import { Button, Input, Card, CardContent, LoadingOverlay, AppDialog, Header } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientDetails'>;

/** Format raw digits into XXXX XXXX XXXX for display */
const formatAadhaar = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) parts.push(digits.slice(i, i + 4));
  return parts.join(' ');
};

export const PatientDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mobileNumber, patientId } = route.params;
  const { colors: c } = useTheme();
  const { updateUser, user } = useAuth();
  const s = styles(c);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    aadharNumber: '',
    dob: '',
  });
  const [incomeDocument, setIncomeDocument] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch patient data on load to check KYC status
  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      const result = await patientService.getPatientByMobileNumber(mobileNumber);
      if (result.success && result.data) {
        const patient = result.data;
        setKycStatus(patient.kycStatus || '');
        setForm({
          fullName: patient.fullName || '',
          email: patient.email || '',
          aadharNumber: patient.aadharNumber || '',
          dob: patient.dob ? patient.dob.split('T')[0] : '',
        });
      }
    } catch {
      // Ignore error - first time setup
    } finally {
      setInitialLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleAadhaarChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 12);
    updateField('aadharNumber', digits);
  };

  const handleDateSelect = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && date) {
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      updateField('dob', formattedDate);
      setSelectedDate(date);
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const pickIncomeDocument = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showDialog({
          title: 'Permission Needed',
          message: 'Please grant gallery access to upload your income document.',
          icon: 'alert-circle',
          iconColor: c.warning,
          iconBgColor: c.warningSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setIncomeDocument(result.assets[0]);
        setErrors(prev => ({ ...prev, incomeDocument: '' }));
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Failed to pick document. Please try again.',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (form.aadharNumber.length !== 12 || !/^\d{12}$/.test(form.aadharNumber))
      newErrors.aadharNumber = 'Aadhaar must be 12 digits';
    if (!form.dob) newErrors.dob = 'Date of birth is required';
    if (!incomeDocument) newErrors.incomeDocument = 'Income document is required for KYC';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Build kycDocument payload for React Native FormData
      let kycFile: any = undefined;
      if (incomeDocument) {
        kycFile = {
          uri: incomeDocument.uri,
          type: incomeDocument.mimeType || 'image/jpeg',
          name: incomeDocument.fileName || 'kyc_document.jpg',
        };
      }

      const result = await patientService.updatePatient({
        patientId: patientId || '',
        mobileNumber,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        aadharNumber: form.aadharNumber,
        dob: form.dob,
      }, kycFile);
      if (result.success) {
        // Mark profile as complete in auth state
        updateUser({ username: form.fullName.trim(), isProfileComplete: true });

        showDialog({
          title: 'Profile & KYC Submitted!',
          message: 'Your profile and income document have been submitted for admin review. You now have access to the patient dashboard.',
          icon: 'checkmark-circle',
          iconColor: c.success,
          iconBgColor: c.successSoft,
          actions: [{
            text: 'Go to Dashboard',
            variant: 'success',
            onPress: () => {
              hideDialog();
              navigation.reset({
                index: 0,
                routes: [{ name: 'PatientMain', params: { mobileNumber, patientId: patientId || '' } }],
              });
            },
          }],
        });
      } else {
        showDialog({
          title: 'Update Failed',
          message: result.message || 'Failed to submit profile. Please try again.',
          icon: 'alert-circle',
          iconColor: c.danger,
          iconBgColor: c.dangerSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Something went wrong. Please try again.',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    } finally {
      setLoading(false);
    }
  };

  // If KYC is Approved, show status screen
  if (!initialLoading && kycStatus === 'Approved') {
    return (
      <View style={[s.flex, { backgroundColor: c.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={c.surface} />
        <Header
          title="Profile Status"
          subtitle="Your KYC submission"
          showBack
          onBackPress={() => navigation.goBack()}
          username={user?.username || form.fullName.trim() || undefined}
        />
        <View style={s.statusContainer}>
          <View style={[s.statusIconCircle, { backgroundColor: c.successSoft }]}>
            <Ionicons 
              name="checkmark-circle" 
              size={64} 
              color={c.success} 
            />
          </View>
          <Text style={[s.statusTitle, { color: c.text }]}>
            Profile Approved
          </Text>
          <Text style={[s.statusMessage, { color: c.textSecondary }]}>
            Your profile and KYC documents have been verified by admin.
          </Text>
          <Button
            title="Go to Dashboard"
            onPress={() => navigation.replace('PatientMain', { mobileNumber, patientId: patientId || '' })}
            size="lg"
            icon={<Ionicons name="home" size={20} color="#FFF" />}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.flex, { backgroundColor: c.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.surface} />
      
      <Header
        title={kycStatus === 'Pending Approval' ? 'Update Profile & KYC' : kycStatus === '' ? 'Personal Details & KYC' : 'Update Profile'}
        subtitle={kycStatus === 'Pending Approval' ? 'Pending admin approval - You can update details' : kycStatus === '' ? 'Complete your profile' : 'Edit your information'}
        showBack
        onBackPress={() => navigation.goBack()}
        username={user?.username || form.fullName.trim() || undefined}
      />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Pending Approval Banner */}
          {kycStatus === 'Pending Approval' && (
            <View style={[s.infoBox, { backgroundColor: c.warningSoft, marginBottom: spacing.lg }]}>
              <Ionicons name="time-outline" size={20} color={c.warning} />
              <Text style={[s.infoText, { color: c.warning }]}>
                Your profile is under admin review. You can still update your details if needed.
              </Text>
            </View>
          )}
          
          <Card variant="elevated" style={s.formCard}>\n            <CardContent>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={form.fullName}
                onChangeText={(v) => updateField('fullName', v)}
                error={errors.fullName}
                leftIcon={<Ionicons name="person-outline" size={18} color={c.textTertiary} />}
              />

              <Input
                label="Email (Optional)"
                placeholder="your@email.com"
                value={form.email}
                onChangeText={(v) => updateField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Ionicons name="mail-outline" size={18} color={c.textTertiary} />}
              />

              <Input
                label="Aadhaar Number"
                placeholder="XXXX XXXX XXXX"
                value={formatAadhaar(form.aadharNumber)}
                onChangeText={handleAadhaarChange}
                error={errors.aadharNumber}
                keyboardType="numeric"
                maxLength={14}
                leftIcon={<Ionicons name="card-outline" size={18} color={c.textTertiary} />}
                hint="Your 12-digit Unique Identification Number"
              />

              <Pressable onPress={() => setShowDatePicker(true)}>
                <View pointerEvents="none">
                  <Input
                    label="Date of Birth"
                    placeholder="YYYY-MM-DD"
                    value={form.dob}
                    onChangeText={(v) => updateField('dob', v)}
                    error={errors.dob}
                    leftIcon={<Ionicons name="calendar-outline" size={18} color={c.textTertiary} />}
                    hint="Tap to select your date of birth"
                    editable={false}
                  />
                </View>
              </Pressable>

              {/* Income Document Upload */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[s.uploadLabel, { color: c.text }]}>Income Document *</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={pickIncomeDocument}
                  style={[
                    s.uploadBox,
                    {
                      borderColor: errors.incomeDocument ? c.danger : c.inputBorder,
                      backgroundColor: c.inputBackground,
                    },
                  ]}
                >
                  {incomeDocument ? (
                    <View style={s.uploadPreview}>
                      <Image
                        source={{ uri: incomeDocument.uri }}
                        style={s.previewImage}
                        resizeMode="cover"
                      />
                      <View style={s.uploadPreviewInfo}>
                        <Text style={[s.uploadFileName, { color: c.text }]} numberOfLines={1}>
                          {incomeDocument.fileName || 'Income Document'}
                        </Text>
                        <Text style={[s.uploadChangeText, { color: c.primary }]}>Tap to change</Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={22} color={c.success} />
                    </View>
                  ) : (
                    <View style={s.uploadPlaceholder}>
                      <View style={[s.uploadIconCircle, { backgroundColor: c.primarySoft }]}>
                        <Ionicons name="document-text-outline" size={28} color={c.primary} />
                      </View>
                      <Text style={[s.uploadTitle, { color: c.text }]}>Upload Income Proof</Text>
                      <Text style={[s.uploadHint, { color: c.textTertiary }]}>
                        BPL card, income certificate, or salary slip
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {errors.incomeDocument && (
                  <Text style={[s.uploadError, { color: c.danger }]}>{errors.incomeDocument}</Text>
                )}
              </View>

              <View style={[s.infoBox, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={c.primary} />
                <Text style={[s.infoText, { color: c.primary }]}>
                  Your information is secure and will be used for verification purposes only. An admin will review your registration and KYC documents.
                </Text>
              </View>

              <Button
                title={kycStatus === '' ? 'Submit Profile & KYC' : 'Update Profile'}
                onPress={handleSubmit}
                loading={loading}
                fullWidth
                size="lg"
                icon={<Ionicons name="checkmark-circle" size={20} color="#FFF" />}
              />
            </CardContent>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <LoadingOverlay visible={loading} message="Submitting..." />
      <AppDialog {...dialogProps} />

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateSelect}
          maximumDate={new Date()}
          textColor={c.text}
        />
      )}
    </View>
  );
};

const styles = (c: any) => ({
  flex: { flex: 1 },
  statusContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing['2xl'],
    gap: spacing.xl,
  },
  statusIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statusTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center' as const,
  },
  statusMessage: {
    fontSize: fontSize.md,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  scrollContent: { 
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  formCard: {
    marginBottom: spacing['2xl'],
  },
  uploadLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed' as const,
    overflow: 'hidden' as const,
  },
  uploadPlaceholder: {
    alignItems: 'center' as const,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  uploadHint: {
    fontSize: fontSize.xs,
    textAlign: 'center' as const,
  },
  uploadPreview: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    gap: spacing.md,
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  uploadPreviewInfo: {
    flex: 1,
  },
  uploadFileName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  uploadChangeText: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  uploadError: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  infoBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: c.primarySoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.xs,
    color: c.primary,
    flex: 1,
    lineHeight: 18,
  },
});
