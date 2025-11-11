import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { useBusinessStore } from '../../stores/businessStore';
import { theme } from '../../styles/theme';
import { defaultCountry } from '../../utils/validation';

interface BusinessFormData {
  name: string;
  tinNumber: string;
  tinCertificate: string;
  servicePlanType: 'BASIC' | 'STANDARD' | 'PREMIUM';
  description: string;
  website: string;
  logo: string;
  businessLicense: string;
  taxCertificate: string;
  insuranceDocument: string;
  otherCertificates: string[];
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCountry: {
    cca2: string;
    name: string;
    callingCode: string;
    flag: string;
  };
}

export default function BusinessRegistrationScreen() {
  const registerBusiness = useBusinessStore((state) => state.registerBusiness);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    tinNumber: '',
    tinCertificate: '',
    servicePlanType: 'BASIC',
    description: '',
    website: '',
    logo: '',
    businessLicense: '',
    taxCertificate: '',
    insuranceDocument: '',
    otherCertificates: [],
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerCountry: defaultCountry,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<BusinessFormData>>({});

  // Load saved form data on component mount
  useEffect(() => {
    const loadSavedFormData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('businessRegistrationForm');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setFormData(prev => ({ ...prev, ...parsedData }));
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    };

    loadSavedFormData();
  }, []);

  // Save form data whenever it changes
  useEffect(() => {
    const saveFormData = async () => {
      try {
        console.log('💾 Registration: Saving form data:', formData);
        await AsyncStorage.setItem('businessRegistrationForm', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };

    saveFormData();
  }, [formData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<BusinessFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }
    if (!formData.tinNumber.trim()) {
      newErrors.tinNumber = 'TIN number is required';
    }
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    if (!formData.ownerEmail.trim()) {
      newErrors.ownerEmail = 'Owner email is required';
    }
    if (!formData.ownerPhone.trim()) {
      newErrors.ownerPhone = 'Owner phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      console.error('❌ Registration Screen: Validation failed');
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    console.log('✅ Registration Screen: Validation passed, proceeding to file upload');
    router.push('/business/fileUpload');
  };

  const updateFormData = (field: keyof BusinessFormData, value: string | any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Business Registration</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <Input
            label="Business Name *"
            value={formData.name}
            onChangeText={(text) => updateFormData('name', text)}
            placeholder="Enter your business name"
            error={errors.name}
            style={styles.input}
          />

          <Input
            label="TIN Number *"
            value={formData.tinNumber}
            onChangeText={(text) => updateFormData('tinNumber', text)}
            placeholder="Enter TIN number"
            error={errors.tinNumber}
            style={styles.input}
          />

          <Input
            label="Website"
            value={formData.website}
            onChangeText={(text) => updateFormData('website', text)}
            placeholder="https://yourwebsite.com"
            style={styles.input}
          />

          <View style={styles.textAreaContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textArea, !!errors.description && styles.textAreaError]}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              placeholder="Describe your business services..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Owner Information</Text>
          
          <Input
            label="Owner Name *"
            value={formData.ownerName}
            onChangeText={(text) => updateFormData('ownerName', text)}
            placeholder="Enter owner's full name"
            error={errors.ownerName}
            style={styles.input}
          />

          <Input
            label="Owner Email *"
            value={formData.ownerEmail}
            onChangeText={(text) => updateFormData('ownerEmail', text)}
            placeholder="Enter owner's email"
            error={errors.ownerEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <PhoneInput
            label="Owner Phone *"
            value={formData.ownerPhone}
            onChangeText={(text) => updateFormData('ownerPhone', text)}
            onCountryChange={(country) => updateFormData('ownerCountry', country)}
            selectedCountry={formData.ownerCountry}
            placeholder="Enter phone number"
            error={errors.ownerPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />

          <Text style={styles.sectionTitle}>Next Steps</Text>
          <Text style={styles.note}>
            After filling this form, you'll be able to upload your business certificates and documents.
          </Text>

          <Button
            title="Continue to File Upload"
            onPress={handleContinue}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
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
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 16,
    fontFamily: theme.typography.fontFamilyBold,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily,
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    minHeight: 80,
    fontFamily: theme.typography.fontFamily,
  },
  textAreaError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: 4,
    fontFamily: theme.typography.fontFamily,
  },
  note: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    fontStyle: 'italic',
    marginBottom: 24,
    fontFamily: theme.typography.fontFamily,
  },
  submitButton: {
    marginTop: 24,
  },
});