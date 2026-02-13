import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { borderRadius, spacing, fontSize, fontWeight } from '@/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message }) => {
  const { colors: c } = useTheme();
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.overlay, { backgroundColor: c.overlay }]} pointerEvents="auto">
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <ActivityIndicator size="large" color={c.primary} />
        {message && <Text style={[styles.text, { color: c.textSecondary }]}>{message}</Text>}
      </View>
    </View>
  );
};

const styles = {
  overlay: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 9998,
    elevation: 9998,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing['3xl'],
    alignItems: 'center' as const,
    minWidth: 160,
    gap: spacing.lg,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
};
