import React from 'react';
import { TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { shadows } from '@/theme';

interface FABProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
  size?: number;
}

export const FAB: React.FC<FABProps> = ({
  icon = 'add',
  onPress,
  style,
  color,
  size = 56,
}) => {
  const { colors: c } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.fab,
        shadows.xl,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color || c.primary,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={26} color="#FFF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
