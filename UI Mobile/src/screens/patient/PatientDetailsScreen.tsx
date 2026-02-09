import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { patientService } from '@/api';
import { Button, Input, Card, CardContent, LoadingOverlay, AppDialog } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useDialog } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientDetails'>;

export const PatientDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mobileNumber, patientId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const { updateUser } = useAuth();
  const s = styles(c);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    aadharNumber: '',
    dob: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0 = personal, 1 = identity

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (form.aadharNumber.length !== 12 || !/^\d{12}$/.test(form.aadharNumber))
      newErrors.aadharNumber = 'Aadhar must be 12 digits';
    if (!form.dob) newErrors.dob = 'Date of birth is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await patientService.updatePatient({
        patientId: patientId || '',
        mobileNumber,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        aadharNumber: form.aadharNumber,
        dob: form.dob,
      });
      if (result.success) {
        // Mark profile as complete in auth state
        updateUser({ username: form.fullName.trim(), isProfileComplete: true });

        showDialog({
          title: 'Profile Submitted!',
          message: 'Your profile has been submitted for approval. You now have access to the patient dashboard.',
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

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={c.primary} />
      <LoadingOverlay visible={loading} message="Submitting..." />
      <AppDialog {...dialogProps} />

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[s.header, { paddingTop: insets.top + spacing.xl, backgroundColor: c.primary }]}>
          {/* Decorative elements */}
          <View style={s.decorCircle1} />
          <View style={s.decorCircle2} />

          <View style={s.headerContent}>
            <View style={s.stepIndicator}>
              <View style={[s.stepDot, step >= 0 && s.stepActive]} />
              <View style={[s.stepLine, step >= 1 && s.stepLineActive]} />
              <View style={[s.stepDot, step >= 1 && s.stepActive]} />
              <View style={[s.stepLine, step >= 2 && s.stepLineActive]} />
              <View style={[s.stepDot, step >= 2 && s.stepActive]} />
            </View>
            <Text style={s.headerTitle}>Complete Your Profile</Text>
            <Text style={s.headerSubtitle}>We need a few more details to get you started</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Card variant="elevated" style={s.formCard}>
            <CardContent>
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
                label="Aadhar Number"
                placeholder="12-digit Aadhar number"
                value={form.aadharNumber}
                onChangeText={(v) => updateField('aadharNumber', v.replace(/\D/g, '').slice(0, 12))}
                error={errors.aadharNumber}
                keyboardType="numeric"
                maxLength={12}
                leftIcon={<Ionicons name="card-outline" size={18} color={c.textTertiary} />}
                hint="Your 12-digit Unique Identification Number"
              />

              <Input
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                value={form.dob}
                onChangeText={(v) => updateField('dob', v)}
                error={errors.dob}
                leftIcon={<Ionicons name="calendar-outline" size={18} color={c.textTertiary} />}
                hint="Format: YYYY-MM-DD (e.g., 1990-01-15)"
              />

              <View style={[s.infoBox, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={c.primary} />
                <Text style={[s.infoText, { color: c.primary }]}>
                  Your information is secure and will be used for verification purposes only. An admin will review your registration.
                </Text>
              </View>

              <Button
                title="Submit Profile"
                onPress={handleSubmit}
                loading={loading}
                fullWidth
                size="lg"
                icon={<Ionicons name="checkmark-circle" size={20} color="#FFF" />}
              />
            </CardContent>
          </Card>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (c: any) => ({
  flex: { flex: 1, backgroundColor: c.background },
  scrollContent: { flexGrow: 1 },
  header: {
    backgroundColor: c.primary,
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  decorCircle1: {
    position: 'absolute' as const,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -30,
    right: -20,
  },
  decorCircle2: {
    position: 'absolute' as const,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -10,
    left: -15,
  },
  headerContent: { alignItems: 'center' as const },
  stepIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xl,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepActive: {
    backgroundColor: '#FFF',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.xs,
  },
  stepLineActive: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: '#FFF',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  formCard: {
    marginHorizontal: spacing.xl,
    marginTop: -24,
    marginBottom: spacing['2xl'],
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
