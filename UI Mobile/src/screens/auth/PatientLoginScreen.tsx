import React, { useState, useRef, useEffect } from 'react';
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
import { Button, Input, LoadingOverlay, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientLogin'>;

export const PatientLoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { loginPatient } = useAuth();
  const { colors: c, colorScheme } = useTheme();
  const s = styles(c);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const { showDialog, hideDialog, dialogProps } = useDialog();

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

  const validateMobile = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length !== 10) return 'Enter a valid 10-digit mobile number';
    if (!/^[6-9]/.test(cleaned)) return 'Mobile must start with 6-9';
    return '';
  };

  const handleSendOtp = async () => {
    const err = validateMobile(mobile);
    if (err) { setMobileError(err); return; }
    setMobileError('');
    setLoading(true);

    try {
      const result = await loginPatient(mobile.replace(/\D/g, ''), email || undefined);
      if (result.success) {
        if (result.message) {
          showDialog({
            title: 'OTP Sent',
            message: result.message,
            icon: 'checkmark-circle',
            iconColor: c.success,
            iconBgColor: c.successSoft,
            actions: [{ text: 'Continue', variant: 'primary', onPress: () => {
              hideDialog();
              navigation.navigate('PatientOtp', { mobileNumber: mobile.replace(/\D/g, ''), email: email || undefined });
            }}],
          });
        } else {
          navigation.navigate('PatientOtp', { mobileNumber: mobile.replace(/\D/g, ''), email: email || undefined });
        }
      } else {
        showDialog({
          title: 'Error',
          message: result.message || 'Failed to send OTP',
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
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.background} />
      <LoadingOverlay visible={loading} message="Sending OTP..." />
      <AppDialog {...dialogProps} />

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header - matching landing page */}
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
              <Ionicons name="heart" size={36} color={c.primary} />
            </View>
            <Text style={[s.headerTitle, { color: c.text }]}>Patient Portal</Text>
            <Text style={[s.headerSubtitle, { color: c.textSecondary }]}>Login with your mobile number</Text>
            <View style={[s.accentDivider, { backgroundColor: c.primary }]} />
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[s.formCard, shadows.lg, { backgroundColor: c.surface, opacity: cardAnim, transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
          <Text style={[s.formTitle, { color: c.text }]}>Get Started</Text>
          <Text style={[s.formSubtitle, { color: c.textSecondary }]}>We'll send you a one-time password to verify your identity</Text>

          <Input
            label="Mobile Number"
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChangeText={(text) => { setMobile(text.replace(/\D/g, '').slice(0, 10)); setMobileError(''); }}
            error={mobileError}
            keyboardType="phone-pad"
            maxLength={10}
            leftIcon={<Ionicons name="call-outline" size={20} color={c.textTertiary} />}
          />

          <Input
            label="Email (Optional)"
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={c.textTertiary} />}
          />

          <Button
            title="Send OTP"
            onPress={handleSendOtp}
            loading={loading}
            disabled={mobile.length < 10}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.sm }}
          />

          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={c.info} />
            <Text style={s.infoText}>
              A 6-digit OTP will be sent to your mobile number for verification
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
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
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: fontSize.sm,
    color: c.textSecondary,
    marginBottom: spacing['2xl'],
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: c.infoSoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.xs,
    color: c.info,
    flex: 1,
    lineHeight: 18,
  },
});
