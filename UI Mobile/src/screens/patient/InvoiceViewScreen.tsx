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

type Props = NativeStackScreenProps<RootStackParamList, 'InvoiceView'>;

interface InvoiceItem {
  name: string;
  brand: string;
  quantity: number;
  price: number;
  discount: number;
}

const MOCK_INVOICE_ITEMS: InvoiceItem[] = [
  { name: 'Paracetamol 500mg', brand: 'Dolo', quantity: 10, price: 50.0, discount: 5.0 },
  { name: 'Amoxicillin 250mg', brand: 'Mox', quantity: 15, price: 120.0, discount: 10.0 },
  { name: 'Vitamin D3 1000IU', brand: 'Calcirol', quantity: 30, price: 180.0, discount: 15.0 },
  { name: 'Cough Syrup 100ml', brand: 'Benadryl', quantity: 1, price: 95.0, discount: 8.0 },
];

const TAX_RATE = 0.05;
// Default subsidy rate; overridden by patient's discountPercentage when available
const DEFAULT_SUBSIDY_PERCENT = 90;

export const InvoiceViewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, mobileNumber, prescriptionData, discountPercentage: routeDiscount } = route.params;
  const { colors: c } = useTheme();
  const { user } = useAuth();
  const [paymentDone, setPaymentDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  // Guard: redirect to PatientDetails if profile not complete
  useEffect(() => {
    if (!user?.isProfileComplete) {
      showDialog({
        title: 'Complete Your Profile',
        message: 'Please complete your profile and KYC details before viewing invoices.',
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

  const invoiceNumber = useMemo(() => `INV-${Date.now().toString(36).toUpperCase()}`, []);

  // Use patient-specific discount when passed, otherwise fallback to default
  const subsidyPercent = routeDiscount ?? DEFAULT_SUBSIDY_PERCENT;
  const subsidyRate = subsidyPercent / 100;

  const calculations = useMemo(() => {
    const subtotal = MOCK_INVOICE_ITEMS.reduce((sum, item) => {
      const itemTotal = item.price - (item.price * item.discount) / 100;
      return sum + itemTotal * item.quantity;
    }, 0);
    const taxes = subtotal * TAX_RATE;
    const subsidy = subtotal * subsidyRate;
    const grandTotal = subtotal + taxes - subsidy;
    return { subtotal, taxes, subsidy, grandTotal };
  }, [subsidyRate]);

  const handlePayment = async () => {
    showDialog({
      title: 'Confirm Payment',
      message: `Pay ₹${calculations.grandTotal.toFixed(2)} for your medicines?`,
      icon: 'card-outline',
      iconColor: c.primary,
      iconBgColor: c.primarySoft,
      actions: [
        { text: 'Cancel', variant: 'default', onPress: hideDialog },
        {
          text: 'Pay Now',
          variant: 'primary',
          onPress: async () => {
            hideDialog();
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setLoading(false);
            setPaymentDone(true);
            showDialog({
              title: 'Payment Successful',
              message: 'Your payment has been processed successfully!',
              icon: 'checkmark-circle',
              iconColor: c.success,
              iconBgColor: c.successSoft,
              actions: [{ text: 'Continue', variant: 'success', onPress: hideDialog }],
            });
          },
        },
      ],
    });
  };

  const handleProceedToSlot = () => {
    navigation.navigate('SlotBooking', { patientId, mobileNumber });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.surface} />
      <Header
        title="Invoice"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invoice Header */}
        <Card variant="elevated" style={styles.invoiceHeader}>
          <CardContent>
            <View style={styles.invoiceTop}>
              <View>
                <Text style={[styles.invoiceTitle, { color: c.text }]}>Invoice</Text>
                <Text style={[styles.invoiceNum, { color: c.textSecondary }]}>{invoiceNumber}</Text>
              </View>
              <Badge variant={paymentDone ? 'success' : 'warning'} dot>
                {paymentDone ? 'Paid' : 'Pending'}
              </Badge>
            </View>

            {prescriptionData && (
              <View style={[styles.prescriptionInfo, { backgroundColor: c.surfaceHover }]}>
                <View style={styles.prescInfoRow}>
                  <Ionicons name="medical-outline" size={16} color={c.textTertiary} />
                  <Text style={[styles.prescInfoText, { color: c.text }]}>{prescriptionData.doctorName}</Text>
                </View>
                <View style={styles.prescInfoRow}>
                  <Ionicons name="business-outline" size={16} color={c.textTertiary} />
                  <Text style={[styles.prescInfoText, { color: c.text }]}>{prescriptionData.hospitalName}</Text>
                </View>
              </View>
            )}

            <Text style={[styles.patientLabel, { color: c.textTertiary }]}>Patient ID: {patientId}</Text>
            <Text style={[styles.dateLabel, { color: c.textTertiary }]}>
              Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </CardContent>
        </Card>

        {/* Medicine Items */}
        <Card variant="elevated" style={styles.itemsCard}>
          <CardContent>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Medicine Items</Text>

            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: c.surfaceHover }]}>
              <Text style={[styles.thText, { flex: 2, color: c.textSecondary }]}>Item</Text>
              <Text style={[styles.thText, { color: c.textSecondary }]}>Qty</Text>
              <Text style={[styles.thText, { color: c.textSecondary }]}>Price</Text>
              <Text style={[styles.thText, { color: c.textSecondary }]}>Total</Text>
            </View>

            {MOCK_INVOICE_ITEMS.map((item, index) => {
              const discounted = item.price - (item.price * item.discount) / 100;
              const total = discounted * item.quantity;
              return (
                <View key={index} style={[styles.tableRow, index < MOCK_INVOICE_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
                  <View style={{ flex: 2 }}>
                    <Text style={[styles.itemName, { color: c.text }]}>{item.name}</Text>
                    <Text style={[styles.itemBrand, { color: c.textTertiary }]}>{item.brand}</Text>
                    {item.discount > 0 && (
                      <Badge variant="success" style={{ marginTop: 2 }}>{item.discount}% off</Badge>
                    )}
                  </View>
                  <Text style={[styles.tdText, { color: c.text }]}>{item.quantity}</Text>
                  <Text style={[styles.tdText, { color: c.text }]}>₹{discounted.toFixed(0)}</Text>
                  <Text style={[styles.tdText, { color: c.text, fontWeight: fontWeight.semibold }]}>₹{total.toFixed(0)}</Text>
                </View>
              );
            })}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card variant="elevated" style={styles.totalsCard}>
          <CardContent>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.totalValue, { color: c.text }]}>₹{calculations.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Tax (5%)</Text>
              <Text style={[styles.totalValue, { color: c.text }]}>+₹{calculations.taxes.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: c.success }]}>Govt Subsidy ({subsidyPercent}%)</Text>
              <Text style={[styles.totalValue, { color: c.success }]}>-₹{calculations.subsidy.toFixed(2)}</Text>
            </View>
            <View style={[styles.grandTotalRow, { borderTopColor: c.border }]}>
              <Text style={[styles.grandTotalLabel, { color: c.text }]}>Grand Total</Text>
              <Text style={[styles.grandTotalValue, { color: c.primary }]}>₹{calculations.grandTotal.toFixed(2)}</Text>
            </View>

            <View style={[styles.subsidyBanner, { backgroundColor: c.successSoft }]}>
              <Ionicons name="gift-outline" size={20} color={c.success} />
              <Text style={[styles.subsidyText, { color: c.successDark }]}>
                You save ₹{calculations.subsidy.toFixed(2)} with {subsidyPercent}% government subsidy!
              </Text>
            </View>

            {!paymentDone ? (
              <Button
                title="Make Payment"
                onPress={handlePayment}
                fullWidth
                size="lg"
                icon={<Ionicons name="card-outline" size={20} color="#FFF" />}
                style={{ marginTop: spacing.md }}
              />
            ) : (
              <>
                <View style={[styles.paidBanner, { backgroundColor: c.successSoft }]}>
                  <Ionicons name="checkmark-circle" size={24} color={c.success} />
                  <Text style={[styles.paidText, { color: c.successDark }]}>Payment Completed</Text>
                </View>
                <Button
                  title="Book Pickup Slot"
                  onPress={handleProceedToSlot}
                  fullWidth
                  size="lg"
                  variant="success"
                  icon={<Ionicons name="calendar-outline" size={20} color="#FFF" />}
                  style={{ marginTop: spacing.md }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Processing payment..." />
      <AppDialog {...dialogProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  invoiceHeader: { marginBottom: spacing.lg },
  invoiceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  invoiceTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  invoiceNum: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  prescriptionInfo: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  prescInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prescInfoText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  patientLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: fontSize.xs,
  },
  itemsCard: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  thText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  itemBrand: {
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  tdText: {
    fontSize: fontSize.sm,
    flex: 1,
    textAlign: 'center',
  },
  totalsCard: { marginBottom: spacing.lg },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.md,
  },
  totalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 2,
  },
  grandTotalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  grandTotalValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  subsidyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  subsidyText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  paidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  paidText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
