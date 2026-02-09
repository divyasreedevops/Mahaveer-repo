import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Dimensions, Image } from 'react-native';
import { ImageWithFallback } from './ImageWithFallback';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Sponsor {
  name: string;
  logo: string;
}

interface SponsorsCarouselProps {
  sponsors: Sponsor[];
}

export const sponsors: Sponsor[] = [
  { 
    name: 'Dr. Reddys',
    logo: 'https://images.unsplash.com/photo-1719319384332-82f969b6e48c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxEciUyMFJlZGR5cyUyMGxvZ28lMjBwaGFybWFjZXV0aWNhbHxlbnwxfHx8fDE3NzAzNzUxMDh8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    name: 'Cipla',
    logo: 'https://images.unsplash.com/photo-1698506455775-42635fdd16a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMG1lZGljYWwlMjBjYXBzdWxlJTIwcGlsbHxlbnwxfHx8fDE3NzAzNzUxMTN8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    name: 'Novartis',
    logo: 'https://images.unsplash.com/photo-1728470164693-95f5e7bade80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBoYXJtYWNldXRpY2FsJTIwY29tcGFueXxlbnwxfHx8fDE3NzAzNzUxMTN8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    name: 'Lupin',
    logo: 'https://images.unsplash.com/photo-1737264791501-4c0626832e82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjZXV0aWNhbCUyMGluZHVzdHJ5JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzcwMzc1MTEzfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    name: 'Alkem Labs',
    logo: 'https://images.unsplash.com/photo-1768498950658-87ecfe232b59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc2NpZW5jZSUyMGxhYm9yYXRvcnl8ZW58MXx8fHwxNzcwMzc1MTE0fDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    name: 'Aurobindo',
    logo: 'https://images.unsplash.com/photo-1659019722097-17e298f43491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwcGhhcm1hY3klMjBwaWxsc3xlbnwxfHx8fDE3NzAzNzUxMTR8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    name: 'Glenmark',
    logo: 'https://images.unsplash.com/photo-1662467150566-f3f12de2ee57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHbGVubWFyayUyMHBoYXJtYWNldXRpY2FsJTIwbG9nb3xlbnwxfHx8fDE3NzAzNzUxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  { 
    name: 'GSK',
    logo: 'https://images.unsplash.com/photo-1698365140635-42894e5e63b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMGJvdHRsZXMlMjBwaGFybWFjeXxlbnwxfHx8fDE3NzAzMDM1MDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
];

const ITEM_WIDTH = 140;
const ITEM_MARGIN = spacing.md;

export const SponsorsCarousel: React.FC<SponsorsCarouselProps> = ({ sponsors: sponsorsList }) => {
  const styles = useThemedStyles(createStyles);
  const scrollX = useRef(new Animated.Value(0)).current;
  const totalWidth = (ITEM_WIDTH + ITEM_MARGIN) * sponsorsList.length;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: sponsorsList.length * 3000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [totalWidth, sponsorsList.length]);

  const duplicatedSponsors = [...sponsorsList, ...sponsorsList];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Our Sponsors</Text>
      <View style={styles.carouselContainer}>
        <Animated.View
          style={[
            styles.carousel,
            {
              transform: [{ translateX: scrollX }],
            },
          ]}
        >
          {duplicatedSponsors.map((sponsor, index) => (
            <View key={`${sponsor.name}-${index}`} style={styles.sponsorItem}>
              <ImageWithFallback
                src={sponsor.logo}
                style={styles.sponsorLogo as any}
                fallbackIcon="business-outline"
                fallbackIconSize={20}
              />
              <Text style={styles.sponsorName} numberOfLines={1}>
                {sponsor.name}
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => ({
  container: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: spacing.md,
  },
  carouselContainer: {
    overflow: 'hidden' as const,
    height: 70,
  },
  carousel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  sponsorItem: {
    width: ITEM_WIDTH,
    marginRight: ITEM_MARGIN,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sponsorLogo: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
  },
  sponsorName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
});
