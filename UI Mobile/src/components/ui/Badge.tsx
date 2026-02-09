import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { borderRadius, spacing, fontSize, fontWeight } from '@/theme';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', style, textStyle, dot }) => {
  const { colors: c } = useTheme();

  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
    default: { bg: c.primary, text: c.textInverse },
    secondary: { bg: c.surfaceHover, text: c.textSecondary },
    destructive: { bg: c.dangerSoft, text: c.dangerDark },
    outline: { bg: 'transparent', text: c.text, border: c.border },
    success: { bg: c.successSoft, text: c.successDark },
    warning: { bg: c.warningSoft, text: c.warningDark },
    info: { bg: c.infoSoft, text: c.info },
  };

  const v = variantStyles[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          borderColor: v.border || 'transparent',
          borderWidth: v.border ? 1 : 0,
        },
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: v.text }]} />}
      <Text style={[styles.text, { color: v.text }, textStyle]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
