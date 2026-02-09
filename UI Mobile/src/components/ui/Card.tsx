import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { borderRadius, spacing, fontSize, fontWeight, shadows } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const { colors: c } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface },
        variant === 'elevated' && shadows.lg,
        variant === 'outlined' && { borderWidth: 1, borderColor: c.border },
        variant === 'default' && shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);

export const CardTitle: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => {
  const { colors: c } = useTheme();
  return <Text style={[styles.title, { color: c.text }, style]}>{children}</Text>;
};

export const CardDescription: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => {
  const { colors: c } = useTheme();
  return <Text style={[styles.description, { color: c.textSecondary }, style]}>{children}</Text>;
};

export const CardContent: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

export const CardFooter: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[styles.footer, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  description: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
