import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminDrawerParamList, InventoryStackParamList } from '@/types';
import { DrawerContent } from '@/components';
import { DashboardScreen } from '@/screens/admin/DashboardScreen';
import { ApprovalsScreen } from '@/screens/admin/ApprovalsScreen';
import { PatientsScreen } from '@/screens/admin/PatientsScreen';
import { InventoryScreen } from '@/screens/admin/InventoryScreen';
import { AddEditInventoryScreen } from '@/screens/admin/AddEditInventoryScreen';
import { UserManagementScreen } from '@/screens/admin/UserManagementScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

const Drawer = createDrawerNavigator<AdminDrawerParamList>();
const InventoryStack = createNativeStackNavigator<InventoryStackParamList>();

const InventoryNavigator: React.FC = () => (
  <InventoryStack.Navigator screenOptions={{ headerShown: false }}>
    <InventoryStack.Screen name="InventoryList" component={InventoryScreen} />
    <InventoryStack.Screen name="AddEditInventory" component={AddEditInventoryScreen} />
  </InventoryStack.Navigator>
);

export const AdminDrawer: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 300,
        },
        overlayColor: 'rgba(15, 23, 42, 0.5)',
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Approvals" component={ApprovalsScreen} />
      <Drawer.Screen name="Patients" component={PatientsScreen} />
      <Drawer.Screen name="Inventory" component={InventoryNavigator} />
      <Drawer.Screen name="Users" component={UserManagementScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};
