import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { Button, SponsorsCarousel, sponsors, MahaveerLogo } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export const LandingScreen: React.FC<Props> = ({ navigation }) => {
  const { colors: c, colorScheme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const s = styles(c);

  // Animated entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardFade1 = useRef(new Animated.Value(0)).current;
  const cardFade2 = useRef(new Animated.Value(0)).current;
  const cardSlide1 = useRef(new Animated.Value(40)).current;
  const cardSlide2 = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade1, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardSlide1, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade2, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardSlide2, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={c.background}
      />

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Area - clean background */}
        <View style={[s.headerArea, { paddingTop: insets.top + spacing.lg, backgroundColor: c.background }]}>
          {/* Subtle decorative accents */}
          <View style={[s.decorCircle1, { backgroundColor: c.primarySoft }]} />
          <View style={[s.decorCircle2, { backgroundColor: c.primarySoft }]} />
          <View style={[s.decorCircle3, { backgroundColor: c.primarySoft }]} />

          {/* Dark mode toggle in header */}
          <View style={s.headerTopRow}>
            <View style={{ flex: 1 }} />
            <Animated.View style={{ opacity: fadeAnim }}>
              <View style={[s.themeToggle, { backgroundColor: c.surfaceHover }]}>
                <Ionicons
                  name={colorScheme === 'dark' ? 'sunny' : 'moon'}
                  size={18}
                  color={c.textSecondary}
                  onPress={toggleTheme}
                />
              </View>
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <MahaveerLogo size="lg" variant="auto" />
            <Text style={[s.subTagline, { color: c.textSecondary }]}>Select your portal to continue</Text>
            <View style={[s.accentDivider, { backgroundColor: c.primary }]} />
          </Animated.View>
        </View>

        {/* Portal Cards */}
        <View style={s.cardsContainer}>
          {/* Patient Portal */}
          <Animated.View style={[s.cardWrapper, { opacity: cardFade1, transform: [{ translateY: cardSlide1 }] }]}>
            <View style={[s.portalCard, shadows.lg, { backgroundColor: c.surface }]}>
              <View style={s.cardHeader}>
                <View style={[s.cardIconBg, { backgroundColor: c.primarySoft }]}>
                  <Ionicons name="heart" size={28} color={c.primary} />
                </View>
                <View style={[s.cardBadge, { backgroundColor: c.successSoft }]}>
                  <View style={[s.badgeDot, { backgroundColor: c.success }]} />
                  <Text style={[s.badgeText, { color: c.success }]}>Patient Access</Text>
                </View>
              </View>
              <View style={s.cardTextContent}>
                <Text style={[s.cardTitle, { color: c.text }]}>Patient Portal</Text>
                <Text style={[s.cardDesc, { color: c.textSecondary }]}>
                  Register, upload prescriptions, and manage your healthcare orders
                </Text>
                <View style={s.featuresList}>
                  <FeatureItem icon="phone-portrait" text="Mobile OTP verification" />
                  <FeatureItem icon="document-text" text="Upload prescriptions" />
                  <FeatureItem icon="cash" text="View invoice with 90% subsidy" />
                  <FeatureItem icon="calendar" text="Book pickup slot" />
                </View>
              </View>
              <Button
                title="Continue as Patient"
                onPress={() => navigation.navigate('PatientLogin')}
                fullWidth
                size="lg"
                iconRight={<Ionicons name="arrow-forward" size={18} color="#FFF" />}
              />
            </View>
          </Animated.View>

          {/* Admin Portal */}
          <Animated.View style={[s.cardWrapper, { opacity: cardFade2, transform: [{ translateY: cardSlide2 }] }]}>
            <View style={[s.portalCard, shadows.lg, { backgroundColor: c.surface }]}>
              <View style={s.cardHeader}>
                <View style={[s.cardIconBg, { backgroundColor: colorScheme === 'dark' ? '#2E1065' : '#F5F3FF' }]}>
                  <Ionicons name="shield-checkmark" size={28} color="#7C3AED" />
                </View>
                <View style={[s.cardBadge, { backgroundColor: colorScheme === 'dark' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)' }]}>
                  <View style={[s.badgeDot, { backgroundColor: '#7C3AED' }]} />
                  <Text style={[s.badgeText, { color: '#7C3AED' }]}>Secure Login</Text>
                </View>
              </View>
              <View style={s.cardTextContent}>
                <Text style={[s.cardTitle, { color: c.text }]}>Admin Portal</Text>
                <Text style={[s.cardDesc, { color: c.textSecondary }]}>
                  Manage patients, inventory, and operations securely
                </Text>
                <View style={s.featuresList}>
                  <FeatureItem icon="people" text="Manage patient registrations" />
                  <FeatureItem icon="medkit" text="Medicine inventory control" />
                  <FeatureItem icon="checkmark-done" text="Approve/reject requests" />
                  <FeatureItem icon="lock-closed" text="Secure admin access" />
                </View>
              </View>
              <Button
                title="Continue as Admin"
                onPress={() => navigation.navigate('AdminLogin')}
                variant="secondary"
                fullWidth
                size="lg"
                iconRight={<Ionicons name="arrow-forward" size={18} color={c.text} />}
              />
            </View>
          </Animated.View>
        </View>

        <View style={s.footerSpacing} />
      </ScrollView>

      {/* Sponsors at Bottom */}
      <View style={[s.sponsorsContainer, { paddingBottom: insets.bottom || spacing.md, backgroundColor: c.surface, borderTopColor: c.border }]}>
        <SponsorsCarousel sponsors={sponsors} />
      </View>
    </View>
  );
};

const FeatureItem: React.FC<{ text: string; icon?: string }> = ({ text, icon = 'checkmark-circle' }) => {
  const { colors: c } = useTheme();
  return (
    <View style={featureStyles.featureItem}>
      <View style={[featureStyles.featureIconBg, { backgroundColor: c.successSoft }]}>
        <Ionicons name={icon as any} size={12} color={c.success} />
      </View>
      <Text style={[featureStyles.featureText, { color: c.textSecondary }]}>{text}</Text>
    </View>
  );
};

const featureStyles = StyleSheet.create({
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  featureIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: fontSize.xs,
    flex: 1,
    lineHeight: 16,
  },
});

const styles = (c: any) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerArea: {
    backgroundColor: c.background,
    paddingBottom: spacing['3xl'],
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  headerTopRow: {
    flexDirection: 'row' as const,
    width: '100%' as const,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surfaceHover,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  decorCircle1: {
    position: 'absolute' as const,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
    top: -60,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute' as const,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.35,
    bottom: -30,
    left: -30,
  },
  decorCircle3: {
    position: 'absolute' as const,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.4,
    top: 40,
    left: 20,
  },
  subTagline: {
    fontSize: fontSize.sm,
    color: c.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center' as const,
  },
  accentDivider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center' as const,
    marginTop: spacing.lg,
    opacity: 0.8,
  },
  cardsContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'center' as const,
  },
  cardWrapper: {
    width: '100%' as const,
    maxWidth: 420,
    marginBottom: spacing.lg,
  },
  portalCard: {
    backgroundColor: c.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: spacing.md,
  },
  cardIconBg: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cardBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  cardTextContent: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: c.text,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: fontSize.sm,
    color: c.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  featuresList: {
    gap: spacing.sm,
  },
  footerSpacing: {
    height: 120,
  },
  sponsorsContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
});
