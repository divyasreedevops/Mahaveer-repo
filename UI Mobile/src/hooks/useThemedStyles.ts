import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemeColors } from '@/theme';

/**
 * Hook to create themed styles dynamically based on current theme
 * @param stylesFn - Function that takes theme colors and returns styles object
 * @returns Memoized StyleSheet styles
 * 
 * @example
 * const styles = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.background,
 *     borderColor: colors.border,
 *   },
 *   text: {
 *     color: colors.text,
 *   },
 * }));
 */
export const useThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  stylesFn: (colors: ThemeColors) => T
) => {
  const { colors } = useTheme();
  
  return useMemo(() => StyleSheet.create(stylesFn(colors)), [colors, stylesFn]);
};
