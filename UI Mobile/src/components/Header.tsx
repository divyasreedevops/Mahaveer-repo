import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Avatar } from './ui/Avatar';
import { spacing, fontSize, fontWeight, shadows } from '@/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  onAvatarPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onMenuPress,
  onAvatarPress,
  showBack,
  onBackPress,
  rightAction,
  username,
}) => {
  const insets = useSafeAreaInsets();
  const { colors: c, toggleTheme, colorScheme } = useTheme();

  return (
    <View style={[styles.container, shadows.sm, { paddingTop: insets.top + spacing.sm, backgroundColor: c.surface, borderBottomColor: c.border }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </TouchableOpacity>
        ) : onMenuPress ? (
          <TouchableOpacity onPress={onMenuPress} style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="menu" size={26} color={c.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: c.textSecondary }]} numberOfLines={1}>{subtitle}</Text>}
        </View>

        {rightAction || (
          username ? (
            <View style={styles.rightActions}>
              <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} activeOpacity={0.7}>
                <Ionicons name={colorScheme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color={c.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
                <Avatar name={username} size={36} />
              </TouchableOpacity>
            </View>
          ) : <View style={{ width: 44 }} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  titleContainer: {
    position: 'absolute',
    left: 60,
    right: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  themeToggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
});
