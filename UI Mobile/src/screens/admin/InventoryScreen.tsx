import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { InventoryItem, InventoryStackParamList, AdminDrawerParamList } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { inventoryService } from '@/api';
import { Header, Card, CardContent, Badge, SearchBar, FAB, EmptyState, Button, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

export const InventoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<InventoryStackParamList>>();
  const drawerNavigation = useNavigation<DrawerNavigationProp<AdminDrawerParamList>>();
  const { user } = useAuth();
  const { colors: c } = useTheme();
  const s = styles(c);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchInventory = useCallback(async () => {
    try {
      const result = await inventoryService.getInventoryList();
      if (result.success && result.data) {
        setItems(result.data);
      } else {
        if (result.message) showDialog({
          title: 'Error',
          message: result.message,
          icon: 'alert-circle',
          iconColor: c.danger,
          iconBgColor: c.dangerSoft,
          actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
        });
      }
    } catch {
      showDialog({
        title: 'Error',
        message: 'Failed to load inventory. Please try again.',
        icon: 'alert-circle',
        iconColor: c.danger,
        iconBgColor: c.dangerSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert('Delete Item', `Are you sure you want to delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await inventoryService.deleteInventoryItem(item.id);
            if (result.success) {
              setItems(prev => prev.filter(i => i.id !== item.id));
              showDialog({
                title: 'Deleted',
                message: result.message || 'Item deleted successfully',
                icon: 'checkmark-circle',
                iconColor: c.success,
                iconBgColor: c.successSoft,
                actions: [{ text: 'OK', variant: 'success', onPress: hideDialog }],
              });
            } else {
              showDialog({
                title: 'Delete Failed',
                message: result.message || 'Failed to delete item',
                icon: 'alert-circle',
                iconColor: c.danger,
                iconBgColor: c.dangerSoft,
                actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
              });
            }
          } catch {
            showDialog({
              title: 'Error',
              message: 'Failed to delete item. Please try again.',
              icon: 'alert-circle',
              iconColor: c.danger,
              iconBgColor: c.dangerSoft,
              actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
            });
          }
        },
      },
    ]);
  };

  const filtered = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name?.toLowerCase().includes(q) || i.disease?.toLowerCase().includes(q) || i.type?.toLowerCase().includes(q);
  });

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tablet': return 'tablet-portrait-outline';
      case 'capsule': return 'ellipse-outline';
      case 'syrup': return 'beaker-outline';
      case 'injection': return 'fitness-outline';
      default: return 'medkit-outline';
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <Card style={s.card}>
      <CardContent style={s.cardBody}>
        <View style={s.cardTop}>
          <View style={[s.typeIcon, { backgroundColor: c.primarySoft }]}>
            <Ionicons name={getTypeIcon(item.type) as any} size={22} color={c.primary} />
          </View>
          <View style={s.cardInfo}>
            <Text style={[s.cardName, { color: c.text }]}>{item.name}</Text>
            <Text style={[s.cardType, { color: c.textSecondary }]}>{item.type} • {item.disease}</Text>
          </View>
        </View>

        <View style={[s.detailsRow, { backgroundColor: c.surfaceHover }]}>
          <View style={s.detailItem}>
            <Text style={[s.detailLabel, { color: c.textTertiary }]}>Dosage</Text>
            <Text style={[s.detailValue, { color: c.text }]}>{item.dosageValue}{item.dosageUnits}</Text>
          </View>
          <View style={s.detailItem}>
            <Text style={[s.detailLabel, { color: c.textTertiary }]}>Qty</Text>
            <Text style={[s.detailValue, { color: c.text }]}>{item.quantityValue}{item.quantityUnits}</Text>
          </View>
          <View style={s.detailItem}>
            <Text style={[s.detailLabel, { color: c.textTertiary }]}>MRP</Text>
            <Text style={[s.detailValue, { textDecorationLine: item.discount > 0 ? 'line-through' : 'none', color: item.discount > 0 ? c.textTertiary : c.text }]}>
              ₹{item.mrp?.toFixed(2)}
            </Text>
          </View>
          <View style={s.detailItem}>
            <Text style={[s.detailLabel, { color: c.textTertiary }]}>Price</Text>
            <Text style={[s.detailValue, { color: c.success, fontWeight: fontWeight.bold }]}>
              ₹{item.finalPrice?.toFixed(2)}
            </Text>
          </View>
        </View>

        {item.discount > 0 && (
          <Badge variant="success" style={s.discountBadge}>
            {item.discount}% OFF
          </Badge>
        )}

        <View style={s.actions}>
          <Button
            title="Edit"
            onPress={() => navigation.navigate('AddEditInventory', { item })}
            variant="outline"
            size="sm"
            style={{ flex: 1 }}
            icon={<Ionicons name="create-outline" size={16} color={c.primary} />}
          />
          <Button
            title="Delete"
            onPress={() => handleDelete(item)}
            variant="destructive"
            size="sm"
            style={{ flex: 1 }}
            icon={<Ionicons name="trash-outline" size={16} color="#FFF" />}
          />
        </View>
      </CardContent>
    </Card>
  );

  return (
    <View style={[s.container, { backgroundColor: c.background }]}>
      <Header
        title="Inventory"
        subtitle={`${filtered.length} medicines`}
        showBack
        onBackPress={() => drawerNavigation.navigate('Dashboard')}
        username={user?.username}
        onAvatarPress={() => drawerNavigation.navigate('Profile')}
      />
      
      <View style={[s.searchContainer, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search medicines..."
        />
        <Text style={[s.countText, { color: c.textTertiary }]}>{filtered.length} items</Text>
      </View>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="medkit-outline"
              title="No Medicines Found"
              description={search ? 'Try a different search' : 'Add your first medicine to get started'}
              actionLabel="Add Medicine"
              onAction={() => navigation.navigate('AddEditInventory', {})}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="add"
        onPress={() => navigation.navigate('AddEditInventory', {})}
      />
      <AppDialog {...dialogProps} />
    </View>
  );
};

const styles = (c: any) => ({
  container: { flex: 1, backgroundColor: c.background },
  loader: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  countText: {
    fontSize: fontSize.xs,
    color: c.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'right' as const,
  },
  list: { padding: spacing.lg, paddingBottom: 100 },
  card: { marginBottom: spacing.md },
  cardBody: { padding: spacing.lg },
  cardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: c.text,
  },
  cardType: {
    fontSize: fontSize.xs,
    color: c.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize' as const,
  },
  detailsRow: {
    flexDirection: 'row' as const,
    backgroundColor: c.surfaceHover,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: c.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: c.text,
  },
  discountBadge: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
