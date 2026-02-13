import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from './ui/Avatar';
import { AppDialog } from './ui/AppDialog';
import { MahaveerLogo } from './MahaveerLogo';
import { useDialog } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme';

const menuItems = [
  { route: 'Dashboard', label: 'Dashboard', icon: 'grid-outline' as const },
  { route: 'PrescriptionUpload', label: 'Upload Prescription', icon: 'document-text-outline' as const },
  { route: 'InvoiceView', label: 'View Invoice', icon: 'receipt-outline' as const },
  { route: 'SlotBooking', label: 'Pickup Slot', icon: 'calendar-outline' as const },
  { route: 'Profile', label: 'Profile', icon: 'person-outline' as const },
];

export const PatientDrawerContent: React.FC<any> = (props) => {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors: c, toggleTheme, colorScheme } = useTheme();
  const currentRoute = props.state?.routes[props.state.index]?.name;
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.surface }]}>
      {/* Header Section with branding */}
      <View style={styles.header}>
        <View style={[styles.headerGradient, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          {/* Centered Mahaveer Hospital branding */}
          <View style={styles.brandingSection}>
            <MahaveerLogo size="sm" variant="auto" />
          </View>

          {/* User info */}
          <View style={[styles.userInfo, { backgroundColor: c.surfaceHover, borderColor: c.border }]}>
            <Avatar name={user?.username || 'Patient'} size={44} />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: c.text }]} numberOfLines={1}>
                {user?.username || 'Patient'}
              </Text>
              <Text style={[styles.userRole, { color: c.textSecondary }]}>Patient Portal</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuSection}>
          <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>MAIN MENU</Text>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => {
                  const params = {
                    mobileNumber: user?.mobileNumber || '',
                    patientId: user?.patientId || '',
                  };
                  props.navigation.navigate(item.route, params);
                }}
                activeOpacity={0.7}
                style={[
                  styles.menuItem,
                  isActive && { backgroundColor: c.primarySoft },
                ]}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: isActive ? c.primary : c.surfaceHover }]}>
                  <Ionicons
                    name={isActive ? (item.icon.replace('-outline', '') as any) : item.icon}
                    size={20}
                    color={isActive ? '#FFF' : c.textSecondary}
                  />
                </View>
                <Text style={[styles.menuLabel, { color: isActive ? c.primary : c.textSecondary, fontWeight: isActive ? fontWeight.semibold : fontWeight.medium }]}>
                  {item.label}
                </Text>
                {isActive && <View style={[styles.activeIndicator, { backgroundColor: c.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: c.border }]}>
        <View style={[styles.divider, { backgroundColor: c.border }]} />
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.7}
          style={styles.themeButton}
        >
          <Ionicons
            name={colorScheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={22}
            color={c.textSecondary}
          />
          <Text style={[styles.themeText, { color: c.textSecondary }]}>
            {colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color={c.danger} />
          <Text style={[styles.logoutText, { color: c.danger }]}>Logout</Text>
        </TouchableOpacity>
        <Text style={[styles.version, { color: c.textTertiary }]}>Mahaveer Hospital v1.0.0</Text>
      </View>
      <AppDialog {...dialogProps} useModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
  },
  headerGradient: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  userRole: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  menuSection: {
    paddingHorizontal: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: 2,
    gap: spacing.md,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  themeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  version: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
