import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { patientService } from '@/api';
import { Button, OtpInput, LoadingOverlay, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientOtp'>;

export const PatientOtpScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mobileNumber, email } = route.params;
  const insets = useSafeAreaInsets();
  const { verifyOtp, loginPatient } = useAuth();
  const { colors: c, colorScheme } = useTheme();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const { showDialog, hideDialog, dialogProps } = useDialog();


  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const result = await verifyOtp(mobileNumber, otp);
      if (result.success) {
        // Check patient profile completeness
        const patientResult = await patientService.getPatientByMobileNumber(mobileNumber);
        const patient = patientResult.data;
        const status = patient?.registrationStatus?.toLowerCase();

        if (!patient?.aadharNumber || !patient?.fullName) {
          // Incomplete profile - go to details
          navigation.reset({
            index: 0,
            routes: [{ name: 'PatientDetails', params: { mobileNumber, patientId: result.patientId, isFirstLogin: true } }],
          });
        } else if (status === 'approved') {
          // Approved with complete profile - go to dashboard
          navigation.reset({
            index: 0,
            routes: [{ name: 'PatientMain', params: { mobileNumber, patientId: result.patientId || patient.patientId } }],
          });
        } else {
          // Pending or rejected - go to dashboard to see status
          navigation.reset({
            index: 0,
            routes: [{ name: 'PatientMain', params: { mobileNumber, patientId: result.patientId || patient.patientId } }],
          });
        }
      } else {
        setOtp('');
        showDialog({
          title: 'Verification Failed',
          message: result.message || 'Invalid OTP. Please check and try again.',
          icon: 'alert-circle',
          iconColor: c.warning,
          iconBgColor: c.warningSoft,
          actions: [{ text: 'Try Again', variant: 'primary', onPress: hideDialog }],
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

  const handleResend = async () => {
    setResendTimer(30);
    try {
      const result = await loginPatient(mobileNumber);
      if (result.success) {
        showDialog({
          title: 'OTP Resent',
          message: result.message || 'A new OTP has been sent to your mobile',
          icon: 'send',
          iconColor: c.success,
          iconBgColor: c.successSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      } else {
        showDialog({
          title: 'Failed to Resend',
          message: result.message || 'Could not resend OTP. Please try again.',
          icon: 'alert-circle',
          iconColor: c.danger,
          iconBgColor: c.dangerSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Failed to resend OTP. Please check your connection.',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    }
  };

  const maskedMobile = `${mobileNumber.slice(0, 3)}****${mobileNumber.slice(-3)}`;

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.spring(cardAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const s = styles(c);

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.background} />

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={[s.header, { paddingTop: insets.top + spacing.lg, backgroundColor: c.background, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[s.decorCircle1, { backgroundColor: c.primarySoft }]} />
          <View style={[s.decorCircle2, { backgroundColor: c.primarySoft }]} />
          <View style={[s.decorCircle3, { backgroundColor: c.primarySoft }]} />

          <View style={s.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backButton, { backgroundColor: c.surfaceHover }]}>
              <Ionicons name="arrow-back" size={22} color={c.textSecondary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>

          <View style={s.headerContent}>
            <View style={[s.iconCircle, { backgroundColor: c.primarySoft, borderColor: c.border }]}>
              <Ionicons name="keypad" size={32} color={c.primary} />
            </View>
            <Text style={[s.headerTitle, { color: c.text }]}>Verify OTP</Text>
            <Text style={[s.headerSubtitle, { color: c.textSecondary }]}>Sent to {maskedMobile}</Text>
            <View style={[s.accentDivider, { backgroundColor: c.primary }]} />
          </View>
        </Animated.View>

        <Animated.View style={[s.formCard, shadows.lg, { backgroundColor: c.surface, opacity: cardAnim, transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
          <Text style={[s.formTitle, { color: c.text }]}>Enter Verification Code</Text>
          <Text style={[s.formSubtitle, { color: c.textSecondary }]}>We've sent a 6-digit code to your mobile</Text>

          <View style={s.otpContainer}>
            <OtpInput value={otp} onChange={setOtp} />
          </View>

          <Button
            title="Verify & Continue"
            onPress={handleVerify}
            loading={loading}
            disabled={otp.length !== 6}
            fullWidth
            size="lg"
          />

          <View style={s.resendRow}>
            <Text style={[s.resendText, { color: c.textSecondary }]}>Didn't receive the code?</Text>
            {resendTimer > 0 ? (
              <Text style={s.timerText}>Resend in {resendTimer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={s.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Verifying..." />
      <AppDialog {...dialogProps} />
    </KeyboardAvoidingView>
  );
};

const styles = (c: any) => ({
  flex: { flex: 1, backgroundColor: c.background },
  scrollContent: { flexGrow: 1 },
  header: {
    backgroundColor: c.background,
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  headerTopRow: {
    flexDirection: 'row' as const,
    width: '100%' as const,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  decorCircle1: {
    position: 'absolute' as const,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.5,
    top: -50,
    right: -30,
  },
  decorCircle2: {
    position: 'absolute' as const,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.35,
    bottom: -20,
    left: -25,
  },
  decorCircle3: {
    position: 'absolute' as const,
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.4,
    top: 30,
    left: 15,
  },
  headerContent: { alignItems: 'center' as const },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.md,
    borderWidth: 2,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  accentDivider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center' as const,
    marginTop: spacing.lg,
    opacity: 0.8,
  },
  formCard: {
    backgroundColor: c.surface,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: c.text,
    textAlign: 'center' as const,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: fontSize.sm,
    color: c.textSecondary,
    textAlign: 'center' as const,
    marginBottom: spacing['3xl'],
  },
  otpContainer: {
    marginBottom: spacing['3xl'],
    alignItems: 'center' as const,
  },
  resendRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  resendText: {
    fontSize: fontSize.sm,
    color: c.textSecondary,
  },
  timerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: c.textTertiary,
  },
  resendLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: c.primary,
  },
});
