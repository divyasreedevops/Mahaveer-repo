import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
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
import { useThemedStyles } from '@/hooks/useThemedStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminLogin'>;

export const AdminLoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { colors: c, colorScheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login({ username: username.trim(), password });
      if (result.success) {
        navigation.reset({ index: 0, routes: [{ name: 'AdminMain' }] });
      } else {
        showDialog({
          title: 'Login Failed',
          message: result.message || 'Invalid credentials. Please check your username and password.',
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
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.background} />
      <LoadingOverlay visible={loading} message="Signing in..." />
      <AppDialog {...dialogProps} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header - matching landing page */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.lg, backgroundColor: c.background }]}>
          <View style={[styles.decorCircle1, { backgroundColor: c.primarySoft }]} />
          <View style={[styles.decorCircle2, { backgroundColor: c.primarySoft }]} />
          <View style={[styles.decorCircle3, { backgroundColor: c.primarySoft }]} />

          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: c.surfaceHover }]}>
              <Ionicons name="arrow-back" size={22} color={c.textSecondary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>

          <View style={styles.headerContent}>
            <View style={[styles.iconCircle, { backgroundColor: c.primarySoft, borderColor: c.border }]}>
              <Ionicons name="shield-checkmark" size={36} color={c.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: c.text }]}>Admin Portal</Text>
            <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>Sign in to manage PharmaCare</Text>
            <View style={[styles.accentDivider, { backgroundColor: c.primary }]} />
          </View>
        </View>

        {/* Login Form */}
        <View style={[styles.formCard, shadows.lg, { backgroundColor: c.surface }]}>
          <Text style={[styles.formTitle, { color: c.text }]}>Welcome Back</Text>
          <Text style={[styles.formSubtitle, { color: c.textSecondary }]}>Enter your credentials to continue</Text>

          <Input
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChangeText={(text) => { setUsername(text); setErrors(prev => ({ ...prev, username: undefined })); }}
            error={errors.username}
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Ionicons name="person-outline" size={20} color={c.textTertiary} />}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => { setPassword(text); setErrors(prev => ({ ...prev, password: undefined })); }}
            error={errors.password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={c.textTertiary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.textTertiary} />
              </TouchableOpacity>
            }
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={!username || !password}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.sm }}
          />

          <View style={styles.secureNote}>
            <Ionicons name="lock-closed-outline" size={16} color={c.info} />
            <Text style={[styles.secureNoteText, { color: c.textTertiary }]}>
              Secure admin access
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any) => ({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: colors.background,
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
  headerContent: {
    alignItems: 'center' as const,
  },
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
    textAlign: 'center' as const,
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
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
  },
  formTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing['2xl'],
  },
  errorBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    flex: 1,
  },
  secureNote: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  secureNoteText: {
    fontSize: fontSize.xs,
  },
});
