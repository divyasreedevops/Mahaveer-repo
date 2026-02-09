import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { AdminDrawerParamList } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { patientService, inventoryService } from '@/api';
import { RegistrationStatus } from '@/types';
import { Header, Card, CardContent } from '@/components';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { user } = useAuth();
  const { colors: c } = useTheme();

  const [stats, setStats] = useState({
    pendingApprovals: 0,
    approvedPatients: 0,
    rejectedPatients: 0,
    totalInventory: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const scaleAnim = useState(new Animated.Value(0))[0];

  const fetchStats = useCallback(async () => {
    try {
      const [pending, approved, rejected, inventory] = await Promise.all([
        patientService.getPatientsByStatus(RegistrationStatus.PENDING),
        patientService.getPatientsByStatus(RegistrationStatus.APPROVED),
        patientService.getPatientsByStatus(RegistrationStatus.REJECTED),
        inventoryService.getInventoryList(),
      ]);
      setStats({
        pendingApprovals: pending.data?.length || 0,
        approvedPatients: approved.data?.length || 0,
        rejectedPatients: rejected.data?.length || 0,
        totalInventory: inventory.data?.length || 0,
      });
    } catch {
      // Silent fail - stats are non-critical
    }
  }, []);

  useEffect(() => { 
    fetchStats();
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const overviewCards = [
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: 'time-outline' as const,
      color: c.warning,
      bgColor: c.warningSoft,
      onPress: () => navigation.navigate('Approvals'),
      subtitle: 'Needs review',
    },
    {
      label: 'Total Patients',
      value: stats.approvedPatients,
      icon: 'people-outline' as const,
      color: c.success,
      bgColor: c.successSoft,
      onPress: () => navigation.navigate('Patients'),
      subtitle: 'Registered',
    },
    {
      label: 'Medicine Stock',
      value: stats.totalInventory,
      icon: 'medkit-outline' as const,
      color: c.primary,
      bgColor: c.primarySoft,
      onPress: () => navigation.navigate('Inventory'),
      subtitle: 'Items available',
    },
    {
      label: 'System Users',
      value: '—',
      icon: 'person-add-outline' as const,
      color: c.info,
      bgColor: c.infoSoft,
      onPress: () => navigation.navigate('Users'),
      subtitle: 'Manage access',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Header
        title="Dashboard"
        subtitle="Admin Overview"
        onMenuPress={() => navigation.openDrawer()}
        username={user?.username}
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <Animated.View style={[
          styles.welcomeCard,
          shadows.lg,
          { backgroundColor: c.primary, transform: [{ scale: scaleAnim }] }
        ]}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeIconCircle}>
              <Ionicons name="shield-checkmark" size={28} color="#FFF" />
            </View>
            <Text style={styles.welcomeTitle}>Welcome back, {user?.username || 'Admin'}! 👋</Text>
            <Text style={styles.welcomeSubtitle}>Here's your PharmaCare overview for today</Text>
          </View>
          <View style={styles.welcomePattern}>
            <View style={[styles.patternCircle, { top: -20, right: -20 }]} />
            <View style={[styles.patternCircle, { bottom: -30, left: -15 }]} />
          </View>
        </Animated.View>

        {/* Overview Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Overview</Text>
            <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={20} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            {overviewCards.map((stat, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={stat.onPress}
                activeOpacity={0.7}
                style={styles.statCardWrapper}
              >
                <Card variant="elevated" style={[styles.statCard, { backgroundColor: c.surface }]}>
                  <CardContent style={styles.statContent}>
                    <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                      <Ionicons name={stat.icon} size={26} color={stat.color} />
                    </View>
                    <View style={styles.statInfo}>
                      <Text style={[styles.statValue, { color: c.text }]}>{stat.value}</Text>
                      <Text style={[styles.statLabel, { color: c.text }]}>{stat.label}</Text>
                      <Text style={[styles.statSubtitle, { color: c.textSecondary }]}>{stat.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Quick Insights</Text>
          <Card variant="outlined" style={[styles.insightCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <CardContent style={styles.insightContent}>
              <View style={styles.insightRow}>
                <View style={styles.insightItem}>
                  <View style={[styles.insightBadge, { backgroundColor: c.successSoft }]}>
                    <Ionicons name="trending-up" size={16} color={c.success} />
                  </View>
                  <Text style={[styles.insightValue, { color: c.text }]}>{stats.approvedPatients}</Text>
                  <Text style={[styles.insightLabel, { color: c.textSecondary }]}>Approved</Text>
                </View>
                <View style={[styles.insightDivider, { backgroundColor: c.border }]} />
                <View style={styles.insightItem}>
                  <View style={[styles.insightBadge, { backgroundColor: c.warningSoft }]}>
                    <Ionicons name="hourglass-outline" size={16} color={c.warning} />
                  </View>
                  <Text style={[styles.insightValue, { color: c.text }]}>{stats.pendingApprovals}</Text>
                  <Text style={[styles.insightLabel, { color: c.textSecondary }]}>Pending</Text>
                </View>
                <View style={[styles.insightDivider, { backgroundColor: c.border }]} />
                <View style={styles.insightItem}>
                  <View style={[styles.insightBadge, { backgroundColor: c.dangerSoft }]}>
                    <Ionicons name="close-circle-outline" size={16} color={c.danger} />
                  </View>
                  <Text style={[styles.insightValue, { color: c.text }]}>{stats.rejectedPatients}</Text>
                  <Text style={[styles.insightLabel, { color: c.textSecondary }]}>Rejected</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const cardWidth = width - spacing.xl * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  welcomeCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing['2xl'],
    overflow: 'hidden',
    position: 'relative',
  },
  welcomeContent: {
    padding: spacing['2xl'],
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    zIndex: 1,
  },
  welcomeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  welcomeTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  welcomePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  patternCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  statsGrid: {
    gap: spacing.md,
  },
  statCardWrapper: {
    width: '100%',
  },
  statCard: {
    width: cardWidth,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: fontSize.xs,
  },
  insightCard: {
    borderWidth: 1,
  },
  insightContent: {
    paddingVertical: spacing.lg,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  insightValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  insightLabel: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  insightDivider: {
    width: 1,
    height: 40,
  },
});
