import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { InventoryStackParamList, InventoryItem } from '@/types';
import { inventoryService } from '@/api';
import { Header, Button, Input, Card, CardContent, AppDialog } from '@/components';
import { useTheme } from '@/context/ThemeContext';
import { useDialog } from '@/hooks';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

type RouteParams = RouteProp<InventoryStackParamList, 'AddEditInventory'>;

const TYPES = ['Tablet', 'Capsule', 'Syrup', 'Injection'];

export const AddEditInventoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const existingItem = route.params?.item;
  const isEdit = !!existingItem;
  const { colors: c } = useTheme();
  const s = styles(c);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const [form, setForm] = useState({
    name: existingItem?.name || '',
    type: existingItem?.type || 'Tablet',
    disease: existingItem?.disease || '',
    dosageValue: existingItem?.dosageValue?.toString() || '',
    dosageUnits: existingItem?.dosageUnits || 'mg',
    quantityValue: existingItem?.quantityValue?.toString() || '',
    quantityUnits: existingItem?.quantityUnits || 'pcs',
    mrp: existingItem?.mrp?.toString() || '',
    discount: existingItem?.discount?.toString() || '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(existingItem?.type || 'Tablet');

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Medicine name is required';
    if (!form.disease.trim()) newErrors.disease = 'Disease/use is required';
    if (!form.dosageValue || isNaN(Number(form.dosageValue))) newErrors.dosageValue = 'Valid dosage is required';
    if (!form.quantityValue || isNaN(Number(form.quantityValue))) newErrors.quantityValue = 'Valid quantity is required';
    if (!form.mrp || isNaN(Number(form.mrp)) || Number(form.mrp) <= 0) newErrors.mrp = 'Valid MRP is required';
    if (form.discount && (isNaN(Number(form.discount)) || Number(form.discount) < 0 || Number(form.discount) > 100))
      newErrors.discount = 'Discount must be 0-100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    const mrp = Number(form.mrp);
    const discount = Number(form.discount) || 0;
    const finalPrice = mrp - (mrp * discount) / 100;

    const payload: Partial<InventoryItem> = {
      ...(isEdit && { id: existingItem.id }),
      name: form.name.trim(),
      type: selectedType,
      disease: form.disease.trim(),
      dosageValue: Number(form.dosageValue),
      dosageUnits: form.dosageUnits,
      quantityValue: Number(form.quantityValue),
      quantityUnits: form.quantityUnits,
      mrp,
      discount,
      finalPrice: Number(finalPrice.toFixed(2)),
      status: 1 as any,
      createdBy: 1 as any,
      updatedBy: 1 as any,
    };

    try {
      const result = isEdit
        ? await inventoryService.updateInventoryItem(payload)
        : await inventoryService.addInventoryItem(payload);

      if (result.success) {
        showDialog({
          title: 'Success',
          message: result.message || `Medicine ${isEdit ? 'updated' : 'added'} successfully`,
          icon: 'checkmark-circle',
          iconColor: c.success,
          iconBgColor: c.successSoft,
          actions: [{ text: 'OK', variant: 'success', onPress: () => { hideDialog(); navigation.goBack(); } }],
        });
      } else {
        showDialog({
          title: 'Save Failed',
          message: result.message || 'Failed to save. Please check the details and try again.',
          icon: 'alert-circle',
          iconColor: c.danger,
          iconBgColor: c.dangerSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Failed to save item. Please try again.',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={isEdit ? 'Edit Medicine' : 'Add Medicine'}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        <Card variant="elevated" style={s.formCard}>
          <CardContent>
            {/* Medicine Type Selector */}
            <Text style={[s.fieldLabel, { color: c.text }]}>Type</Text>
            <View style={s.typeSelector}>
              {TYPES.map((type) => {
                const isActive = selectedType === type;
                return (
                  <View
                    key={type}
                    style={[s.typeChip, { borderColor: isActive ? c.primary : c.border, backgroundColor: isActive ? c.primary : 'transparent' }]}
                    onTouchEnd={() => { setSelectedType(type); updateField('type', type); }}
                  >
                    <Text style={[s.typeChipText, { color: isActive ? '#FFF' : c.textSecondary }]}>{type}</Text>
                  </View>
                );
              })}
            </View>

            <Input
              label="Medicine Name"
              placeholder="e.g., Paracetamol"
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              error={errors.name}
              leftIcon={<Ionicons name="medkit-outline" size={18} color={c.textTertiary} />}
            />

            <Input
              label="Disease / Use"
              placeholder="e.g., Fever, Pain"
              value={form.disease}
              onChangeText={(v) => updateField('disease', v)}
              error={errors.disease}
              leftIcon={<Ionicons name="fitness-outline" size={18} color={c.textTertiary} />}
            />

            <View style={s.row}>
              <Input
                label="Dosage"
                placeholder="500"
                value={form.dosageValue}
                onChangeText={(v) => updateField('dosageValue', v)}
                error={errors.dosageValue}
                keyboardType="numeric"
                containerStyle={s.halfInput}
              />
              <Input
                label="Units"
                placeholder="mg"
                value={form.dosageUnits}
                onChangeText={(v) => updateField('dosageUnits', v)}
                containerStyle={s.halfInput}
              />
            </View>

            <View style={s.row}>
              <Input
                label="Quantity"
                placeholder="100"
                value={form.quantityValue}
                onChangeText={(v) => updateField('quantityValue', v)}
                error={errors.quantityValue}
                keyboardType="numeric"
                containerStyle={s.halfInput}
              />
              <Input
                label="Units"
                placeholder="pcs"
                value={form.quantityUnits}
                onChangeText={(v) => updateField('quantityUnits', v)}
                containerStyle={s.halfInput}
              />
            </View>

            <View style={s.row}>
              <Input
                label="MRP (₹)"
                placeholder="99.00"
                value={form.mrp}
                onChangeText={(v) => updateField('mrp', v)}
                error={errors.mrp}
                keyboardType="decimal-pad"
                containerStyle={s.halfInput}
              />
              <Input
                label="Discount (%)"
                placeholder="0"
                value={form.discount}
                onChangeText={(v) => updateField('discount', v)}
                error={errors.discount}
                keyboardType="numeric"
                containerStyle={s.halfInput}
              />
            </View>

            {/* Price Preview */}
            {form.mrp && (
              <View style={[s.pricePreview, { backgroundColor: c.successSoft }]}>
                <Text style={[s.previewLabel, { color: c.successDark }]}>Final Price</Text>
                <Text style={[s.previewValue, { color: c.successDark }]}>
                  ₹{(Number(form.mrp) - (Number(form.mrp) * (Number(form.discount) || 0)) / 100).toFixed(2)}
                </Text>
              </View>
            )}

            <Button
              title={isEdit ? 'Update Medicine' : 'Add Medicine'}
              onPress={handleSave}
              loading={loading}
              fullWidth
              size="lg"
              icon={<Ionicons name={isEdit ? 'checkmark-circle' : 'add-circle'} size={20} color="#FFF" />}
            />
          </CardContent>
        </Card>
      </ScrollView>
      <AppDialog {...dialogProps} />
    </KeyboardAvoidingView>
  );
};

const styles = (c: any) => ({
  flex: { flex: 1, backgroundColor: c.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  formCard: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: c.text,
    marginBottom: spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: 'center' as const,
  },
  typeChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: c.textSecondary,
  },
  row: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  pricePreview: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: c.successSoft,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  previewLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: c.successDark,
  },
  previewValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: c.successDark,
  },
});
