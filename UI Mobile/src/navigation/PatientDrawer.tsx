import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import type { PatientDrawerParamList } from '@/types';
import { PatientDrawerContent } from '@/components/PatientDrawerContent';
import { PatientDashboardScreen } from '@/screens/patient/PatientDashboardScreen';
import { PrescriptionUploadScreen } from '@/screens/patient/PrescriptionUploadScreen';
import { InvoiceViewScreen } from '@/screens/patient/InvoiceViewScreen';
import { SlotBookingScreen } from '@/screens/patient/SlotBookingScreen';
import { PatientProfileScreen } from '@/screens/patient/PatientProfileScreen';

const Drawer = createDrawerNavigator<PatientDrawerParamList>();

export const PatientDrawer: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <PatientDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 300,
        },
        overlayColor: 'rgba(15, 23, 42, 0.5)',
      }}
    >
      <Drawer.Screen name="Dashboard" component={PatientDashboardScreen} />
      <Drawer.Screen name="PrescriptionUpload" component={PrescriptionUploadScreen} />
      <Drawer.Screen name="InvoiceView" component={InvoiceViewScreen} />
      <Drawer.Screen name="SlotBooking" component={SlotBookingScreen} />
      <Drawer.Screen name="Profile" component={PatientProfileScreen} />
    </Drawer.Navigator>
  );
};
