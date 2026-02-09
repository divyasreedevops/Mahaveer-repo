import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { spacing, fontSize, fontWeight } from '@/theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MahaveerIcon = require('../../assets/Mahaveer.png');

interface MahaveerLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark' | 'auto';
}

export const MahaveerLogo: React.FC<MahaveerLogoProps> = ({ size = 'md', showText = true, variant = 'auto' }) => {
  const { colors: c, colorScheme } = useTheme();

  const dimensions = {
    sm: { container: 52, fontSize: fontSize.md, tagSize: fontSize.xs, gap: spacing.sm },
    md: { container: 88, fontSize: fontSize.xl, tagSize: fontSize.sm, gap: spacing.md },
    lg: { container: 110, fontSize: fontSize['2xl'], tagSize: fontSize.md, gap: spacing.lg },
  }[size];

  // 'light' = on primary/colored background → white text
  // 'dark' = force dark text
  // 'auto' = adapt to current theme colors
  const isOnColored = variant === 'light';
  const textColor = isOnColored ? '#FFFFFF' : c.text;
  const subtextColor = isOnColored ? 'rgba(255,255,255,0.8)' : c.primary;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.logoContainer,
          {
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: Math.round(dimensions.container * 0.16),
            backgroundColor: colorScheme === 'dark' ? c.surface : '#F0F9FF',
            borderColor: colorScheme === 'dark' ? c.border : '#BFDBFE',
            borderWidth: 1.5,
          },
        ]}
      >
        <Image
          source={MahaveerIcon}
          style={{
            width: Math.round(dimensions.container * 0.78),
            height: Math.round(dimensions.container * 0.78),
          }}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <View style={[styles.textContainer, { marginTop: dimensions.gap }]}>
          <Text style={[styles.hospitalName, { fontSize: dimensions.fontSize, color: textColor }]}>
            Mahaveer Hospital
          </Text>
          <Text style={[styles.tagline, { fontSize: dimensions.tagSize, color: subtextColor }]}>
            Pharmacy Management System
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  textContainer: {
    alignItems: 'center',
  },
  hospitalName: {
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  tagline: {
    marginTop: spacing.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
});
