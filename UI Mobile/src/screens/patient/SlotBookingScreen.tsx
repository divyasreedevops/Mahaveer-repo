import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Header, Button, Card, CardContent, Badge, LoadingOverlay, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SlotBooking'>;

export const SlotBookingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, mobileNumber } = route.params;
  const { colors: c } = useTheme();
  const { user } = useAuth();
  const [received, setReceived] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  // Guard: redirect to PatientDetails if profile not complete
  useEffect(() => {
    if (!user?.isProfileComplete) {
      showDialog({
        title: 'Complete Your Profile',
        message: 'Please complete your profile and KYC details before booking slots.',
        icon: 'alert-circle',
        iconColor: c.warning,
        iconBgColor: c.warningSoft,
        actions: [{
          text: 'Complete Now',
          variant: 'primary',
          onPress: () => {
            hideDialog();
            navigation.replace('PatientDetails', { mobileNumber, patientId });
          },
        }],
      });
    }
  }, [user?.isProfileComplete]);

  const slotInfo = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      date: tomorrow.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: '10:00 AM - 11:00 AM',
      location: 'Mahaveer Hospital, Pharmacy Counter 3',
      tokenNumber: `T-${Math.floor(100 + Math.random() * 900)}`,
    };
  }, []);

  const handleMarkReceived = async () => {
    showDialog({
      title: 'Confirm Receipt',
      message: 'Have you collected your medicines?',
      icon: 'bag-check-outline',
      iconColor: c.success,
      iconBgColor: c.successSoft,
      actions: [
        { text: 'Cancel', variant: 'default', onPress: hideDialog },
        {
          text: 'Yes, Received',
          variant: 'success',
          onPress: async () => {
            hideDialog();
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setReceived(true);
            setLoading(false);
          },
        },
      ],
    });
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'PatientMain', params: { mobileNumber, patientId } }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.surface} />
      <Header
        title="Pickup Slot"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        {!received ? (
          <Card variant="elevated" style={styles.statusCard}>
            <CardContent style={styles.statusContent}>
              <View style={[styles.statusIcon, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="calendar" size={40} color={c.primary} />
              </View>
              <Text style={[styles.statusTitle, { color: c.text }]}>Slot Assigned</Text>
              <Text style={[styles.statusDesc, { color: c.textSecondary }]}>
                Your medicine pickup slot has been automatically assigned. Please visit at the scheduled time.
              </Text>
            </CardContent>
          </Card>
        ) : (
          <Card variant="elevated" style={styles.statusCard}>
            <CardContent style={styles.statusContent}>
              <View style={[styles.statusIcon, { backgroundColor: c.successSoft }]}>
                <Ionicons name="checkmark-circle" size={40} color={c.success} />
              </View>
              <Text style={[styles.statusTitle, { color: c.text }]}>Medicine Collected</Text>
              <Text style={[styles.statusDesc, { color: c.textSecondary }]}>
                Your medicines have been marked as received. Thank you for using Mahaveer Hospital Pharmacy!
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Slot Details */}
        <Card variant="elevated" style={styles.detailsCard}>
          <CardContent>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Slot Details</Text>

            <View style={[styles.detailRow, { borderBottomColor: c.border }]}>
              <View style={[styles.detailIconBg, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="id-card-outline" size={20} color={c.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: c.textTertiary }]}>Registration ID</Text>
                <Text style={[styles.detailValue, { color: c.text }]}>{patientId}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: c.border }]}>
              <View style={[styles.detailIconBg, { backgroundColor: c.warningSoft }]}>
                <Ionicons name="ticket-outline" size={20} color={c.warning} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: c.textTertiary }]}>Token Number</Text>
                <Text style={[styles.detailValue, { color: c.text }]}>{slotInfo.tokenNumber}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: c.border }]}>
              <View style={[styles.detailIconBg, { backgroundColor: c.successSoft }]}>
                <Ionicons name="calendar-outline" size={20} color={c.success} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: c.textTertiary }]}>Pickup Date</Text>
                <Text style={[styles.detailValue, { color: c.text }]}>{slotInfo.date}</Text>
              </View>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: c.border }]}>
              <View style={[styles.detailIconBg, { backgroundColor: c.infoSoft }]}>
                <Ionicons name="time-outline" size={20} color={c.info} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: c.textTertiary }]}>Time Slot</Text>
                <Text style={[styles.detailValue, { color: c.text }]}>{slotInfo.time}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIconBg, { backgroundColor: c.dangerSoft }]}>
                <Ionicons name="location-outline" size={20} color={c.danger} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: c.textTertiary }]}>Location</Text>
                <Text style={[styles.detailValue, { color: c.text }]}>{slotInfo.location}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Action */}
        {!received ? (
          <Card variant="elevated" style={styles.actionCard}>
            <CardContent>
              <View style={[styles.noteBanner, { backgroundColor: c.warningSoft }]}>
                <Ionicons name="alert-circle-outline" size={20} color={c.warning} />
                <Text style={[styles.noteText, { color: c.warningDark }]}>
                  Please bring a valid photo ID and your registration ID when collecting medicines.
                </Text>
              </View>
              <Button
                title="Mark as Received"
                onPress={handleMarkReceived}
                fullWidth
                size="lg"
                variant="success"
                icon={<Ionicons name="bag-check-outline" size={20} color="#FFF" />}
                style={{ marginTop: spacing.md }}
              />
            </CardContent>
          </Card>
        ) : (
          <Button
            title="Back to Dashboard"
            onPress={handleGoHome}
            fullWidth
            size="lg"
            icon={<Ionicons name="home-outline" size={20} color="#FFF" />}
          />
        )}
      </ScrollView>
      <LoadingOverlay visible={loading} message="Updating status..." />
      <AppDialog {...dialogProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  statusCard: { marginBottom: spacing.lg },
  statusContent: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  statusTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  statusDesc: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  detailsCard: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    gap: spacing.md,
  },
  detailIconBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: { flex: 1 },
  detailLabel: {
    fontSize: fontSize.xs,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  actionCard: { marginBottom: spacing.lg },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  noteText: {
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});
