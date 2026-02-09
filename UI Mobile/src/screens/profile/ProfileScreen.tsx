import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { AdminDrawerParamList } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Header, Card, CardContent, Avatar, Button, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

const settingsItems = [
  { icon: 'notifications-outline' as const, label: 'Notifications', desc: 'Manage notification preferences' },
  { icon: 'shield-outline' as const, label: 'Privacy & Security', desc: 'Password, two-factor auth' },
  { icon: 'help-circle-outline' as const, label: 'Help & Support', desc: 'FAQ, contact us, feedback' },
  { icon: 'information-circle-outline' as const, label: 'About', desc: 'Version 1.0.0' },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { user, logout } = useAuth();
  const { colors: c, colorScheme, toggleTheme } = useTheme();
  const s = styles(c);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const handleLogout = () => {
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

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <AppDialog {...dialogProps} />
      <Header
        title="Profile"
        subtitle="Account settings"
        showBack
        onBackPress={() => navigation.goBack()}
        username={user?.username}
      />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card variant="elevated" style={s.profileCard}>
          <CardContent style={s.profileContent}>
            <Avatar name={user?.username || 'Admin'} size={72} />
            <Text style={[s.profileName, { color: c.text }]}>{user?.username || 'Admin'}</Text>
            <Text style={[s.profileRole, { color: c.textSecondary }]}>
              {user?.role === 'admin' ? 'Administrator' : 'Patient'}
            </Text>
            <View style={[s.profileBadge, { backgroundColor: c.successSoft }]}>
              <Ionicons name="checkmark-circle" size={14} color={c.success} />
              <Text style={[s.badgeText, { color: c.success }]}>Active Account</Text>
            </View>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card variant="elevated" style={s.infoCard}>
          <CardContent>
            <Text style={[s.sectionTitle, { color: c.text }]}>Account Information</Text>
            <InfoRow icon="person-outline" label="Username" value={user?.username || '-'} />
            <InfoRow icon="shield-outline" label="Role" value={user?.role === 'admin' ? 'Administrator' : 'Patient'} />
            <InfoRow icon="log-in-outline" label="Session" value="Active" last />
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card variant="elevated" style={s.infoCard}>
          <CardContent>
            <Text style={[s.sectionTitle, { color: c.text }]}>Appearance</Text>
            <View style={s.appearanceRow}>
              <View style={s.appearanceInfo}>
                <View style={[s.settingIcon, { backgroundColor: c.primarySoft }]}>
                  <Ionicons name={colorScheme === 'dark' ? 'moon' : 'sunny'} size={20} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.settingLabel, { color: c.text }]}>Dark Mode</Text>
                  <Text style={[s.settingDesc, { color: c.textTertiary }]}>
                    {colorScheme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                  </Text>
                </View>
              </View>
              <Switch
                value={colorScheme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: c.border, true: c.primarySoft }}
                thumbColor={colorScheme === 'dark' ? c.primary : c.textTertiary}
              />
            </View>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card variant="elevated" style={s.settingsCard}>
          <CardContent>
            <Text style={[s.sectionTitle, { color: c.text }]}>Settings</Text>
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.7}
                style={[s.settingRow, index < settingsItems.length - 1 && s.settingBorder, index < settingsItems.length - 1 && { borderBottomColor: c.border }]}
                onPress={() => showDialog({
                  title: item.label,
                  message: 'This feature is coming soon!',
                  icon: 'time-outline',
                  iconColor: c.primary,
                  iconBgColor: c.primarySoft,
                  actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
                })}
              >
                <View style={[s.settingIcon, { backgroundColor: c.primarySoft }]}>
                  <Ionicons name={item.icon} size={20} color={c.primary} />
                </View>
                <View style={s.settingInfo}>
                  <Text style={[s.settingLabel, { color: c.text }]}>{item.label}</Text>
                  <Text style={[s.settingDesc, { color: c.textTertiary }]}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={c.textTertiary} />
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="destructive"
          fullWidth
          size="lg"
          icon={<Ionicons name="log-out-outline" size={20} color="#FFF" />}
          style={{ marginTop: spacing.md, marginBottom: spacing['4xl'] }}
        />
      </ScrollView>
    </View>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string; last?: boolean }> = ({ icon, label, value, last }) => {
  const { colors: tc } = useTheme();
  const is = infoStyles(tc);
  return (
    <View style={[is.row, !last && is.border, !last && { borderBottomColor: tc.border }]}>
      <Ionicons name={icon as any} size={18} color={tc.textTertiary} />
      <Text style={[is.label, { color: tc.textSecondary }]}>{label}</Text>
      <Text style={[is.value, { color: tc.text }]}>{value}</Text>
    </View>
  );
};

const infoStyles = (tc: any) => ({
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: tc.border,
  },
  label: {
    fontSize: fontSize.sm,
    color: tc.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: tc.text,
  },
});

const styles = (c: any) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: { padding: spacing.lg },
  profileCard: { marginBottom: spacing.lg },
  profileContent: {
    alignItems: 'center' as const,
    paddingVertical: spacing['2xl'],
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: c.text,
    marginTop: spacing.md,
    textTransform: 'capitalize' as const,
  },
  profileRole: {
    fontSize: fontSize.sm,
    color: c.textSecondary,
    marginTop: spacing.xs,
  },
  profileBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: spacing.sm,
    backgroundColor: c.successSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: c.success,
  },
  infoCard: { marginBottom: spacing.lg },
  appearanceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  appearanceInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: c.text,
    marginBottom: spacing.md,
  },
  settingsCard: { marginBottom: spacing.md },
  settingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  settingInfo: { flex: 1 },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: c.text,
  },
  settingDesc: {
    fontSize: fontSize.xs,
    color: c.textTertiary,
    marginTop: 1,
  },
});
