import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../../components/Button';
import { useBusinessStore } from '../../stores/businessStore';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

interface FileUploadItem {
  id: string;
  name: string;
  description: string;
  required: boolean;
  file?: {
    uri: string;
    name: string;
    type: string;
    size: number;
  };
}

export default function FileUploadScreen() {
  const { businessId } = useLocalSearchParams();
  const registerBusiness = useBusinessStore((state) => state.registerBusiness);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, FileUploadItem['file']>>({});
  const [businessData, setBusinessData] = useState<any>(null);

  const fileUploadItems: FileUploadItem[] = [
    {
      id: 'tinCertificate',
      name: 'TIN Certificate',
      description: 'Tax Identification Number certificate',
      required: true,
    },
    {
      id: 'businessLicense',
      name: 'Business License',
      description: 'Official business registration license',
      required: true,
    },
    {
      id: 'taxCertificate',
      name: 'Tax Certificate',
      description: 'Tax compliance certificate',
      required: true,
    },
    {
      id: 'insuranceDocument',
      name: 'Insurance Document',
      description: 'Business insurance coverage document',
      required: true,
    },
    {
      id: 'otherCertificates',
      name: 'Other Certificates',
      description: 'Additional business certificates (optional)',
      required: false,
    },
  ];

  const handleFileSelect = async (itemId: string) => {
    try {
      console.log('📁 Opening file picker for:', itemId);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('📁 Document picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const selectedFile = {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
          size: file.size || 0,
        };
        
        console.log('📁 Real file selected:', selectedFile);
        setUploadedFiles(prev => ({ ...prev, [itemId]: selectedFile }));
        
        Alert.alert(
          'File Selected',
          `Successfully selected: ${file.name}`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('📁 File selection cancelled');
      }
    } catch (error) {
      console.error('❌ Error picking document:', error);
      Alert.alert(
        'Error',
        'Failed to pick document. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRemoveFile = (itemId: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[itemId];
      return newFiles;
    });
  };

  const handleSubmit = async () => {
    const requiredFiles = fileUploadItems.filter(item => item.required);
    const missingFiles = requiredFiles.filter(item => !uploadedFiles[item.id]);
    
    if (missingFiles.length > 0) {
      Alert.alert(
        'Missing Files',
        `Please upload the following required documents:\n${missingFiles.map(f => f.name).join('\n')}`
      );
      return;
    }

    setIsLoading(true);
    try {
      // Get business data from AsyncStorage (saved from previous screen)
      const savedBusinessData = await AsyncStorage.getItem('businessRegistrationForm');
      if (!savedBusinessData) {
        Alert.alert('Error', 'Business data not found. Please go back and fill the form again.');
        return;
      }

      const businessFormData = JSON.parse(savedBusinessData);
      
      console.log('📋 File Upload: Loaded business form data:', businessFormData);
      
      // Create file URLs (in real app, these would be actual uploaded file URLs)
      const fileUrls: Record<string, string> = {};
      Object.keys(uploadedFiles).forEach(fileId => {
        fileUrls[fileId] = `https://example.com/uploads/${fileId}-${Date.now()}.pdf`;
      });

      // Prepare complete payload - only include non-empty URL fields
      const payload: any = {
        name: businessFormData.name,
        tinNumber: businessFormData.tinNumber,
        tinCertificate: fileUrls.tinCertificate || '',
        servicePlanType: 'BASIC', // Set as constant for all businesses
        ownerName: businessFormData.ownerName,
        ownerEmail: businessFormData.ownerEmail,
        ownerPhone: businessFormData.ownerPhone,
        ownerCountryCode: businessFormData.ownerCountry?.callingCode || '+255', // Use selected country code
        description: businessFormData.description,
        businessLicense: fileUrls.businessLicense || '',
        taxCertificate: fileUrls.taxCertificate || '',
        insuranceDocument: fileUrls.insuranceDocument || '',
        otherCertificates: fileUrls.otherCertificates ? [fileUrls.otherCertificates] : [],
      };

      // Only add optional URL fields if they have valid values
      if (businessFormData.website && businessFormData.website.trim()) {
        payload.website = businessFormData.website;
      }
      if (fileUrls.logo) {
        payload.logo = fileUrls.logo;
      }

      console.log('🚀 File Upload: Submitting complete business registration:', payload);
      
      const result = await registerBusiness(payload);
      
      // Clear saved form data after successful submission
      await AsyncStorage.removeItem('businessRegistrationForm');
      
      // Navigate to success screen with business and partnerAdmin data
      router.push({
        pathname: '/business/success',
        params: {
          business: JSON.stringify(result.business),
          partnerAdmin: JSON.stringify(result.partnerAdmin),
        },
      });
    } catch (error: any) {
      console.error('💥 File Upload: Registration failed:', error);
      Alert.alert('Error', error.message || 'Failed to register business');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip File Upload',
      'Are you sure you want to skip file upload? You can upload documents later from your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => router.replace('/(tabs)/home'),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Upload Documents</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotCompleted]}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
            <Text style={styles.progressText}>Business Info</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]}>
              <Text style={styles.progressDotText}>2</Text>
            </View>
            <Text style={[styles.progressText, styles.progressTextActive]}>Documents</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Upload the required business documents to complete your registration
        </Text>

        <View style={styles.uploadList}>
          {fileUploadItems.map((item) => (
            <View key={item.id} style={styles.uploadItem}>
              <View style={styles.uploadItemHeader}>
                <View style={styles.uploadItemInfo}>
                  <Text style={styles.uploadItemName}>
                    {item.name}
                    {item.required && <Text style={styles.required}> *</Text>}
                  </Text>
                  <Text style={styles.uploadItemDescription}>{item.description}</Text>
                </View>
                <View style={styles.uploadItemIcon}>
                  <Ionicons 
                    name="document-text" 
                    size={24} 
                    color={theme.colors.grayMedium} 
                  />
                </View>
              </View>

              {uploadedFiles[item.id] ? (
                <View style={styles.uploadedFile}>
                  <View style={styles.uploadedFileInfo}>
                    <Ionicons name="document" size={20} color={theme.colors.green} />
                    <Text style={styles.uploadedFileName}>
                      {uploadedFiles[item.id]?.name}
                    </Text>
                    <Text style={styles.uploadedFileSize}>
                      {(uploadedFiles[item.id]?.size! / 1024 / 1024).toFixed(1)} MB
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFile(item.id)}
                  >
                    <Ionicons name="trash" size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleFileSelect(item.id)}
                >
                  <Ionicons name="cloud-upload" size={24} color={theme.colors.primary} />
                  <Text style={styles.uploadButtonText}>Select File from Device</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            title="Complete Registration"
            onPress={handleSubmit}
            loading={isLoading}
            variant="primary"
            size="large"
            style={styles.submitButton}
          />
          
          <Button
            title="Skip for Now"
            onPress={handleSkip}
            // variant="outline"
            size="large"
            style={styles.skipButton}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    marginTop: 32,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressDotCompleted: {
    backgroundColor: theme.colors.green,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  progressDotText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamilyBold,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
  },
  progressTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamilyBold,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.grayMedium,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: theme.typography.fontFamily,
  },
  uploadList: {
    marginBottom: 32,
  },
  uploadItem: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  uploadItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  uploadItemInfo: {
    flex: 1,
  },
  uploadItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamilyBold,
  },
  required: {
    color: theme.colors.error,
  },
  uploadItemDescription: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
  },
  uploadItemIcon: {
    padding: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: `${theme.colors.primary}10`,
  },
  uploadButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: 8,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily,
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: `${theme.colors.green}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.green,
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploadedFileName: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
    fontFamily: theme.typography.fontFamily,
  },
  uploadedFileSize: {
    fontSize: 12,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
  },
  removeButton: {
    padding: 8,
  },
  actions: {
    gap: 16,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  skipButton: {
    borderColor: '#000000',
    
  },
});
