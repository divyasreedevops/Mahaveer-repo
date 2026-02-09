import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { spacing, fontSize, fontWeight } from '@/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors: c } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: c.surfaceHover }]}>
        <Ionicons name={icon} size={48} color={c.textTertiary} />
      </View>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {description && <Text style={[styles.description, { color: c.textSecondary }]}>{description}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" size="sm" style={{ marginTop: spacing.lg }} />
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing['5xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center' as const,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
};
