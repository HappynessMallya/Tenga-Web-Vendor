import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { StaffCreationRequest } from '../../services/api';
import { useBusinessStore } from '../../stores/businessStore';

export default function StaffRegistrationScreen() {
  const theme = useTheme();
  const { currentBusiness, createStaff, isLoading, error } = useBusinessStore();
  
  const [formData, setFormData] = useState<StaffCreationRequest>({
    phoneNumber: '',
    fullName: '',
    email: '',
    password: '',
    countryCode: '+255',
  });

  const [selectedCountry, setSelectedCountry] = useState({
    cca2: 'TZ',
    name: 'Tanzania',
    callingCode: '+255',
    flag: '🇹🇿',
  });

  const [errors, setErrors] = useState<Partial<StaffCreationRequest>>({});

  const updateFormData = (field: keyof StaffCreationRequest, value: string | any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCountryChange = (country: any) => {
    setSelectedCountry(country);
    updateFormData('countryCode', country.callingCode);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<StaffCreationRequest> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    if (!currentBusiness?.id) {
      Alert.alert('Error', 'No business selected. Please try again.');
      return;
    }

    try {
      console.log('👥 Staff Registration: Starting staff creation');
      console.log('📋 Form data:', formData);
      console.log('🏢 Business ID:', currentBusiness.id);

      await createStaff(currentBusiness.id, formData);
      
      Alert.alert(
        'Success!',
        'Staff member created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/staff'),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Staff Registration Error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to create staff member. Please try again.'
      );
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!currentBusiness) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            No business found
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.onSurfaceVariant }]}>
            Please create a business first before adding staff members.
          </Text>
          <Button mode="contained" onPress={handleGoBack} style={styles.backButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Button
              mode="text"
              onPress={handleGoBack}
              icon="arrow-left"
              labelStyle={styles.backButtonLabel}
            >
              Back
            </Button>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              Add Staff Member
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Create a new staff account for {currentBusiness.name}
            </Text>
          </View>

          {/* Form */}
          <Card style={styles.formCard}>
            <Card.Content style={styles.formContent}>
              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                  Full Name *
                </Text>
                <Input
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData('fullName', value)}
                  error={errors.fullName}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                  Email Address *
                </Text>
                <Input
                  placeholder="Enter email address"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Phone Number */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                  Phone Number *
                </Text>
                 <PhoneInput
                   value={formData.phoneNumber}
                   selectedCountry={selectedCountry}
                   onChangeText={(phoneNumber) => updateFormData('phoneNumber', phoneNumber)}
                   onCountryChange={handleCountryChange}
                   error={errors.phoneNumber}
                 />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                  Password *
                </Text>
                <Input
                  placeholder="Enter password (min 8 characters)"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  error={errors.password}
                  secureTextEntry
                />
              </View>

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
              >
                {isLoading ? 'Creating Staff...' : 'Create Staff Member'}
              </Button>

              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButtonLabel: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  formContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginTop: 10,
  },
});
