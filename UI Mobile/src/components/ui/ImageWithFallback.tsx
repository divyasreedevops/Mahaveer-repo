import React, { useState } from 'react';
import { Image, View, ImageProps, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface ImageWithFallbackProps extends Omit<ImageProps, 'source'> {
  src: string;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackIconSize?: number;
  fallbackIconColor?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  style,
  fallbackIcon = 'image-outline',
  fallbackIconSize = 24,
  fallbackIconColor,
  ...rest
}) => {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iconColor = fallbackIconColor || colors.textTertiary;

  if (hasError) {
    return (
      <View style={[{ backgroundColor: colors.surfaceHover, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.md }, style]}>
        <Ionicons name={fallbackIcon} size={fallbackIconSize} color={iconColor} />
      </View>
    );
  }

  return (
    <View style={style}>
      {isLoading && (
        <View style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHover, borderRadius: borderRadius.md }, style]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      <Image
        source={{ uri: src }}
        style={[style, isLoading && { opacity: 0 }]}
        onError={() => setHasError(true)}
        onLoadEnd={() => setIsLoading(false)}
        {...rest}
      />
    </View>
  );
};
