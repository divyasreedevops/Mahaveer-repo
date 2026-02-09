import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { borderRadius, fontSize, fontWeight, spacing } from '@/theme';

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost' | 'secondary' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { colors: c } = useTheme();
  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    default: { bg: c.primary, text: c.textInverse },
    outline: { bg: 'transparent', text: c.primary, border: c.primary },
    destructive: { bg: c.danger, text: c.textInverse },
    ghost: { bg: 'transparent', text: c.text },
    secondary: { bg: c.surfaceHover, text: c.text },
    success: { bg: c.success, text: c.textInverse },
  };

  const sizeStyles: Record<ButtonSize, { height: number; px: number; fs: number }> = {
    sm: { height: 36, px: spacing.md, fs: fontSize.sm },
    md: { height: 46, px: spacing.xl, fs: fontSize.md },
    lg: { height: 54, px: spacing['2xl'], fs: fontSize.lg },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          height: s.height,
          paddingHorizontal: s.px,
          borderColor: v.border || 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: v.text, fontSize: s.fs }, textStyle]}>
            {title}
          </Text>
          {iconRight}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
});
