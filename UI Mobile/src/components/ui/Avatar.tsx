import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { fontSize, fontWeight, borderRadius } from '@/theme';

interface AvatarProps {
  name?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const avatarColors = [
    '#2563EB', '#7C3AED', '#DB2777', '#059669',
    '#D97706', '#DC2626', '#0891B2', '#4F46E5',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  name = 'U',
  size = 44,
  backgroundColor,
  textColor,
  style,
}) => {
  const bg = backgroundColor || getColorFromName(name);
  const tc = textColor || '#FFFFFF';
  const fs = size * 0.4;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: fs, color: tc }]}>{getInitials(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
});
