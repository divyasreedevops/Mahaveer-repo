import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Header, Button, Card, CardContent, LoadingOverlay, AppDialog } from '@/components';
import { useDialog } from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius, shadows } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PrescriptionUpload'>;

const MOCK_DOCTORS = ['Dr. Rajesh Kumar', 'Dr. Anita Sharma', 'Dr. Vivek Patel', 'Dr. Meera Iyer'];
const MOCK_HOSPITALS = ['City General Hospital', 'Apollo Clinic', 'Max Healthcare', 'AIIMS Outpatient'];

export const PrescriptionUploadScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId, mobileNumber } = route.params;
  const { colors: c } = useTheme();
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<{
    doctorName: string;
    hospitalName: string;
  } | null>(null);
  const { showDialog, hideDialog, dialogProps } = useDialog();

  // Guard: redirect to PatientDetails if profile not complete
  useEffect(() => {
    if (!user?.isProfileComplete) {
      showDialog({
        title: 'Complete Your Profile',
        message: 'Please complete your profile and KYC details before uploading prescriptions.',
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showDialog({
        title: 'Permission Required',
        message: 'Please allow access to photos to upload prescriptions.',
        icon: 'images-outline',
        iconColor: c.warning,
        iconBgColor: c.warningSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setUploaded(false);
      setPrescriptionData(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showDialog({
        title: 'Permission Required',
        message: 'Please allow camera access to take photos.',
        icon: 'camera-outline',
        iconColor: c.warning,
        iconBgColor: c.warningSoft,
        actions: [{ text: 'OK', variant: 'primary', onPress: hideDialog }],
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setUploaded(false);
      setPrescriptionData(null);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    setLoading(true);
    // Mock upload + OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockData = {
      doctorName: MOCK_DOCTORS[Math.floor(Math.random() * MOCK_DOCTORS.length)],
      hospitalName: MOCK_HOSPITALS[Math.floor(Math.random() * MOCK_HOSPITALS.length)],
    };
    setPrescriptionData(mockData);
    setUploaded(true);
    setLoading(false);
    showDialog({
      title: 'Success',
      message: 'Prescription uploaded and processed successfully!',
      icon: 'checkmark-circle',
      iconColor: c.success,
      iconBgColor: c.successSoft,
      actions: [{ text: 'Continue', variant: 'success', onPress: hideDialog }],
    });
  };

  const handleProceedToInvoice = () => {
    navigation.navigate('InvoiceView', {
      patientId,
      mobileNumber,
      prescriptionData: prescriptionData || undefined,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.surface} />
      <Header
        title="Upload Prescription"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upload Area */}
        <Card variant="elevated" style={styles.uploadCard}>
          <CardContent>
            {imageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: c.dangerSoft }]}
                  onPress={() => { setImageUri(null); setUploaded(false); setPrescriptionData(null); }}
                >
                  <Ionicons name="close-circle" size={20} color={c.danger} />
                  <Text style={[styles.removeText, { color: c.danger }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadArea, { borderColor: c.border, backgroundColor: c.surfaceHover }]}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <View style={[styles.uploadIconBg, { backgroundColor: c.primarySoft }]}>
                  <Ionicons name="cloud-upload-outline" size={40} color={c.primary} />
                </View>
                <Text style={[styles.uploadTitle, { color: c.text }]}>Upload Prescription</Text>
                <Text style={[styles.uploadDesc, { color: c.textSecondary }]}>
                  Tap to select an image from your gallery
                </Text>
                <Text style={[styles.uploadHint, { color: c.textTertiary }]}>
                  Supports JPG, PNG • Max 5MB
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.buttonRow}>
              <Button
                title="Gallery"
                onPress={pickImage}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
                icon={<Ionicons name="images-outline" size={18} color={c.primary} />}
              />
              <Button
                title="Camera"
                onPress={takePhoto}
                variant="outline"
                size="md"
                style={{ flex: 1 }}
                icon={<Ionicons name="camera-outline" size={18} color={c.primary} />}
              />
            </View>

            {imageUri && !uploaded && (
              <Button
                title="Upload & Process"
                onPress={handleUpload}
                fullWidth
                size="lg"
                loading={loading}
                icon={<Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                style={{ marginTop: spacing.md }}
              />
            )}
          </CardContent>
        </Card>

        {/* OCR Results */}
        {uploaded && prescriptionData && (
          <Card variant="elevated" style={styles.resultsCard}>
            <CardContent>
              <View style={styles.resultHeader}>
                <View style={[styles.resultIconBg, { backgroundColor: c.successSoft }]}>
                  <Ionicons name="checkmark-circle" size={24} color={c.success} />
                </View>
                <Text style={[styles.resultTitle, { color: c.text }]}>Prescription Processed</Text>
              </View>

              <View style={[styles.resultRow, { borderColor: c.border }]}>
                <Ionicons name="medical-outline" size={18} color={c.textTertiary} />
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultLabel, { color: c.textTertiary }]}>Doctor Name</Text>
                  <Text style={[styles.resultValue, { color: c.text }]}>{prescriptionData.doctorName}</Text>
                </View>
              </View>

              <View style={styles.resultRow}>
                <Ionicons name="business-outline" size={18} color={c.textTertiary} />
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultLabel, { color: c.textTertiary }]}>Hospital</Text>
                  <Text style={[styles.resultValue, { color: c.text }]}>{prescriptionData.hospitalName}</Text>
                </View>
              </View>

              <Button
                title="Proceed to Invoice"
                onPress={handleProceedToInvoice}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.xl }}
                icon={<Ionicons name="receipt-outline" size={20} color="#FFF" />}
              />
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card variant="outlined" style={styles.infoCard}>
          <CardContent>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={c.info} />
              <Text style={[styles.infoText, { color: c.info }]}>
                Upload a clear photo of your prescription. Our system will process it and generate an invoice with applicable subsidies.
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Processing prescription..." />
      <AppDialog {...dialogProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  uploadCard: { marginBottom: spacing.lg },
  previewContainer: { marginBottom: spacing.lg },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  removeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    padding: spacing['3xl'],
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  uploadIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  uploadTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  uploadDesc: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  uploadHint: {
    fontSize: fontSize.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  resultsCard: { marginBottom: spacing.lg },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  resultIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  resultInfo: { flex: 1 },
  resultLabel: {
    fontSize: fontSize.xs,
  },
  resultValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  infoCard: { marginBottom: spacing.lg },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});
