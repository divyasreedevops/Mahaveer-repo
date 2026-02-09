import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { AdminDrawerParamList } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { userService } from '@/api';
import { Header, Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

const ROLES = ['admin', 'staff', 'patient'];

export const UserManagementScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const s = styles(c);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    username: '',
    password: '',
    email: '',
    role: 'staff',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('staff');

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstname.trim()) newErrors.firstname = 'First name is required';
    if (!form.lastname.trim()) newErrors.lastname = 'Last name is required';
    if (form.username.trim().length < 3) newErrors.username = 'Username must be 3+ characters';
    if (form.password.length < 8) newErrors.password = 'Password must be 8+ characters';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Valid email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await userService.createUser({
        ...form,
        role: selectedRole,
        status: 'Active',
      });
      if (result.success) {
        showDialog({
          title: 'Success',
          message: result.message || 'User created successfully',
          icon: 'checkmark-circle',
          iconColor: c.success,
          iconBgColor: c.successSoft,
          actions: [{ text: 'OK', variant: 'success', onPress: hideDialog }],
        });
        setForm({ firstname: '', lastname: '', username: '', password: '', email: '', role: 'staff' });
      } else {
        showDialog({
          title: 'Create Failed',
          message: result.message || 'Failed to create user. Please check the details.',
          icon: 'alert-circle',
          iconColor: c.danger,
          iconBgColor: c.dangerSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Failed to create user. Please try again.',
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
      <AppDialog {...dialogProps} />
      <Header
        title="User Management"
        subtitle="Create new users"
        showBack
        onBackPress={() => navigation.navigate('Dashboard')}
        username={user?.username}
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
            <CardDescription>Add a new admin or staff member to the system</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Selector */}
            <Text style={[s.fieldLabel, { color: c.text }]}>Role</Text>
            <View style={s.roleSelector}>
              {ROLES.map((role) => {
                const isActive = selectedRole === role;
                return (
                  <View
                    key={role}
                    style={[s.roleChip, { borderColor: isActive ? c.primary : c.border, backgroundColor: isActive ? c.primary : 'transparent' }]}
                    onTouchEnd={() => { setSelectedRole(role); updateField('role', role); }}
                  >
                    <Ionicons
                      name={role === 'admin' ? 'shield' : role === 'staff' ? 'people' : 'person'}
                      size={16}
                      color={isActive ? '#FFF' : c.textSecondary}
                    />
                    <Text style={[s.roleText, { color: isActive ? '#FFF' : c.textSecondary }]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={s.row}>
              <Input
                label="First Name"
                placeholder="John"
                value={form.firstname}
                onChangeText={(v) => updateField('firstname', v)}
                error={errors.firstname}
                containerStyle={s.halfInput}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={form.lastname}
                onChangeText={(v) => updateField('lastname', v)}
                error={errors.lastname}
                containerStyle={s.halfInput}
              />
            </View>

            <Input
              label="Username"
              placeholder="johndoe"
              value={form.username}
              onChangeText={(v) => updateField('username', v)}
              error={errors.username}
              autoCapitalize="none"
              leftIcon={<Ionicons name="person-outline" size={18} color={c.textTertiary} />}
            />

            <Input
              label="Email"
              placeholder="john@example.com"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color={c.textTertiary} />}
            />

            <Input
              label="Password"
              placeholder="Min 8 characters"
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={c.textTertiary} />}
              rightIcon={
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={c.textTertiary}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              title="Create User"
              onPress={handleCreate}
              loading={loading}
              fullWidth
              size="lg"
              icon={<Ionicons name="person-add" size={20} color="#FFF" />}
              style={{ marginTop: spacing.sm }}
            />
          </CardContent>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (c: any) => ({
  flex: { flex: 1, backgroundColor: c.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: c.text,
    marginBottom: spacing.sm,
  },
  roleSelector: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row' as const,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
  },
  roleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: c.textSecondary,
  },
  row: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
});
