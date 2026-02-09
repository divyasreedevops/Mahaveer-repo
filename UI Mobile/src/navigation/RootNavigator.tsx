import React, { lazy, Suspense } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

// Eager load critical auth screens
import { LandingScreen } from '@/screens/LandingScreen';
import { AdminLoginScreen } from '@/screens/auth/AdminLoginScreen';
import { PatientLoginScreen } from '@/screens/auth/PatientLoginScreen';
import { PatientOtpScreen } from '@/screens/auth/PatientOtpScreen';
import { PatientDetailsScreen } from '@/screens/patient/PatientDetailsScreen';

// Lazy load drawer navigators (heavy screens)
const AdminDrawerLazy = React.lazy(() =>
  import('./AdminDrawer').then(m => ({ default: m.AdminDrawer }))
);
const PatientDrawerLazy = React.lazy(() =>
  import('./PatientDrawer').then(m => ({ default: m.PatientDrawer }))
);

const LazyWrapper: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <Suspense
    fallback={
      <View style={[styles.loader, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator size="large" color={color} />
      </View>
    }
  >
    {children}
  </Suspense>
);

const AdminDrawerScreen = () => {
  const { colors: c } = useTheme();
  return <LazyWrapper color={c.primary}><AdminDrawerLazy /></LazyWrapper>;
};

const PatientDrawerScreen = () => {
  const { colors: c } = useTheme();
  return <LazyWrapper color={c.primary}><PatientDrawerLazy /></LazyWrapper>;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { colors: c } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loader, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: c.background },
      }}
    >
      {isAuthenticated && user ? (
        user.role === 'admin' ? (
          <Stack.Screen name="AdminMain" component={AdminDrawerScreen} />
        ) : (
          <>
            <Stack.Screen name="PatientMain" component={PatientDrawerScreen} />
            <Stack.Screen name="PatientDetails" component={PatientDetailsScreen} />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
          <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
          <Stack.Screen name="PatientOtp" component={PatientOtpScreen} />
          <Stack.Screen name="PatientDetails" component={PatientDetailsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
