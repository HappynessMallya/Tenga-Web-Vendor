import { yupResolver } from '@hookform/resolvers/yup';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PhoneInput } from '../../components/PhoneInput';
import { useBusinessStore } from '../../stores/businessStore';
import { useUserStore } from '../../stores/userStore';
import { theme } from '../../styles/theme';
import { defaultCountry, signInSchema } from '../../utils/validation';

interface SignInFormData {
  country: {
    cca2: string;
    name: string;
    callingCode: string;
  };
  phoneNumber: string;
  password: string;
}

export default function SignInScreen() {
  const { login, isLoading, error, setError: setStoreError } = useUserStore();
  const { savedCredentials, clearCredentials } = useBusinessStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showSavedCredentials, setShowSavedCredentials] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
  } = useForm({
    resolver: yupResolver(signInSchema),
    defaultValues: {
      country: defaultCountry,
      phoneNumber: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      console.log('Sign in data:', data);
      await login(data.phoneNumber, data.password, data.country.callingCode);
      router.replace('/(tabs)/home'); // Will be redirected by auth guard based on role
    } catch (error: any) {
      setStoreError(error.message || 'Invalid credentials. Please try again.');
    }
  };

  const useSavedCredentials = () => {
    if (savedCredentials) {
      // Find the country for the saved phone number
      const countryCode = savedCredentials.phoneNumber.substring(0, 4); // +255
      const country = { ...defaultCountry, callingCode: countryCode };
      const phoneNumber = savedCredentials.phoneNumber.substring(4); // Remove country code
      
      setValue('country', country);
      setValue('phoneNumber', phoneNumber);
      setValue('password', savedCredentials.password);
      setShowSavedCredentials(false);
    }
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password screen
    console.log('Forgot password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity> */}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo and Title */}
            <View style={styles.logoSection}>
              <Image 
                source={require('../../assets/images/favicon.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Tenga Laundry</Text>
              <Text style={styles.tagline}>Simplify and grow your laundry business.</Text>
            </View>

            {/* Saved Credentials */}
            {savedCredentials && (
              <View style={styles.savedCredentialsContainer}>
                <TouchableOpacity
                  style={styles.savedCredentialsButton}
                  onPress={() => setShowSavedCredentials(!showSavedCredentials)}
                >
                  <Text style={styles.savedCredentialsText}>
                    📋 Use saved credentials for {savedCredentials.businessName}
                  </Text>
                  <Text style={styles.savedCredentialsArrow}>
                    {showSavedCredentials ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
                
                {showSavedCredentials && (
                  <View style={styles.savedCredentialsDetails}>
                    <Text style={styles.savedCredentialsLabel}>Phone: {savedCredentials.phoneNumber}</Text>
                    <Text style={styles.savedCredentialsLabel}>Password: {savedCredentials.password}</Text>
                    <TouchableOpacity
                      style={styles.useCredentialsButton}
                      onPress={useSavedCredentials}
                    >
                      <Text style={styles.useCredentialsText}>Use These Credentials</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.clearCredentialsButton}
                      onPress={clearCredentials}
                    >
                      <Text style={styles.clearCredentialsText}>Clear Saved Credentials</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* <Text style={styles.screenTitle}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your laundry orders and deliveries.
            </Text> */}

            {/* Form */}
            <View style={styles.form}>
              <Controller
                control={control}
                name="country"
                render={({ field: { value: countryValue, onChange: onCountryChange } }) => (
                  <Controller
                    control={control}
                    name="phoneNumber"
                    render={({ field: { value: phoneValue, onChange: onPhoneChange, onBlur } }) => (
                      <PhoneInput
                        label="Phone Number"
                        value={phoneValue}
                        onChangeText={(text) => {
                          onPhoneChange(text);
                          clearErrors('phoneNumber');
                        }}
                        onBlur={onBlur}
                        onCountryChange={onCountryChange}
                        selectedCountry={countryValue}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        error={errors.phoneNumber?.message || errors.country?.message}
                      />
                    )}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Password"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      clearErrors('password');
                    }}
                    onBlur={onBlur}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    rightIcon={showPassword ? 'eye-off' : 'eye'}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    error={errors.password?.message}
                  />
                )}
              />

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Sign In Button */}
              <Button
                title="Sign In"
                onPress={handleSubmit(onSubmit)}
                variant="primary"
                size="large"
                loading={isLoading}
                style={styles.signInButton}
              />
            </View>

            {/* Navigation Text */}
            <View style={styles.navigationContainer}>
              <Text style={styles.navigationText}>
                Don't have a business?{' '}
                <TouchableOpacity onPress={() => router.push('/business/registration')}>
                  <Text style={styles.navigationLink}>Create Business</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamilyBold,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
  },
  savedCredentialsContainer: {
    marginBottom: 20,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  savedCredentialsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  savedCredentialsText: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
  },
  savedCredentialsArrow: {
    fontSize: 12,
    color: theme.colors.grayMedium,
  },
  savedCredentialsDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  savedCredentialsLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 8,
  },
  useCredentialsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  useCredentialsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  clearCredentialsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearCredentialsText: {
    color: theme.colors.error,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  signInButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    marginTop: 20,
  },
  navigationContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  navigationText: {
    fontSize: 16,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
  },
  navigationLink: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamilyBold,
  },
});
