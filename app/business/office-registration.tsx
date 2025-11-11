import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

interface OfficeFormData {
  name: string;
  address: {
    latitude: string;
    longitude: string;
    description: string;
    city: string;
    country: string;
    houseNumber: string;
    streetName: string;
    postCode: string;
    landMark: string;
    type: string;
    geoHash: string;
    images: string[];
  };
  isMainOffice: boolean;
  phoneNumber: string;
  phoneCountry: {
    cca2: string;
    name: string;
    callingCode: string;
    flag: string;
  };
  email: string;
  managerName: string;
  capacity: number;
  isActive: boolean;
}

export default function OfficeRegistrationScreen() {
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const registerOffice = useBusinessStore((state) => state.registerOffice);
  const locationData = useBusinessStore((state) => state.locationData);
  const setLocationData = useBusinessStore((state) => state.setLocationData);
  const clearLocationData = useBusinessStore((state) => state.clearLocationData);
  const [formData, setFormData] = useState<OfficeFormData>({
    name: '',
    address: {
      latitude: '-6.7924',
      longitude: '39.2083',
      description: '',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      houseNumber: '',
      streetName: '',
      postCode: '',
      landMark: '',
      type: 'BUSINESS_FACILITY',
      geoHash: '9q8yyk',
      images: [],
    },
    isMainOffice: true,
    phoneNumber: '',
    phoneCountry: defaultCountry,
    email: '',
    managerName: '',
    capacity: 50,
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<OfficeFormData>>({});
  
  // Location states
  const [locationPermission, setLocationPermission] = useState<Location.LocationPermissionResponse | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load location data from Zustand store on mount
  useEffect(() => {
    if (locationData) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          country: locationData.country,
          streetName: locationData.streetName,
          houseNumber: locationData.houseNumber,
          postCode: locationData.postCode,
          landMark: locationData.landMark,
        }
      }));
      setCurrentLocation({
        coords: {
          latitude: parseFloat(locationData.latitude),
          longitude: parseFloat(locationData.longitude),
          altitude: null,
          accuracy: locationData.accuracy || 0,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    }
  }, [locationData]);

  // Check location permission on component mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      setLocationPermission(permission);
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(permission);
      return permission.granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    try {
      // Check if we have permission
      if (!locationPermission?.granted) {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          setLocationError('Location permission denied. Please enable location access in settings.');
          setIsGettingLocation(false);
          return;
        }
      }

      // Get current location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      setCurrentLocation(location);
      
      // Update form data with new coordinates
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          latitude: location.coords.latitude.toString(),
          longitude: location.coords.longitude.toString(),
        }
      }));

      // Try to get address from coordinates
      try {
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (address.length > 0) {
          const addr = address[0];
          console.log('📍 Reverse geocoding result:', addr);
          console.log('📍 Available fields:', {
            street: addr.street,
            name: addr.name,
            city: addr.city,
            district: addr.district,
            postalCode: addr.postalCode,
            country: addr.country,
            streetNumber: addr.streetNumber,
            subregion: addr.subregion,
            region: addr.region,
          });
          
          // Extract landmark information from available fields
          const landmark = addr.name || addr.district || addr.subregion || addr.region;
          
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              city: addr.city || addr.district || prev.address.city,
              country: addr.country || prev.address.country,
              streetName: addr.street || addr.name || prev.address.streetName,
              houseNumber: addr.streetNumber || prev.address.houseNumber,
              postCode: addr.postalCode || prev.address.postCode,
              landMark: landmark || prev.address.landMark,
            }
          }));

          // Save location data to Zustand store for persistence
          setLocationData({
            latitude: location.coords.latitude.toString(),
            longitude: location.coords.longitude.toString(),
            city: addr.city || addr.district || '',
            country: addr.country || '',
            streetName: addr.street || addr.name || '',
            houseNumber: addr.streetNumber || '',
            postCode: addr.postalCode || '',
            landMark: landmark || '',
            accuracy: location.coords.accuracy || 0,
          });
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed:', geocodeError);
      }

    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get current location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const toggleMap = () => {
    if (!currentLocation) {
      Alert.alert('No Location', 'Please get your current location first before showing the map.');
      return;
    }
    setShowMap(!showMap);
  };

  useEffect(() => {
    const loadSavedFormData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('officeRegistrationForm');
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
        await AsyncStorage.setItem('officeRegistrationForm', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };

    saveFormData();
  }, [formData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<OfficeFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Office name is required';
    }
    if (!formData.address.description.trim()) {
      newErrors.address = { ...formData.address, description: 'Address description is required' };
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!formData.managerName.trim()) {
      newErrors.managerName = 'Manager name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !currentBusiness) {
      Alert.alert('Error', 'Please fill in all required fields and ensure business is selected.');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare payload with correct format
      const payload = {
        name: formData.name,
        address: {
          latitude: formData.address.latitude,
          longitude: formData.address.longitude,
          description: formData.address.description,
          city: formData.address.city,
          country: formData.address.country,
          houseNumber: formData.address.houseNumber,
          streetName: formData.address.streetName,
          postCode: formData.address.postCode,
          landMark: formData.address.landMark,
          type: formData.address.type,
          geoHash: formData.address.geoHash,
          images: formData.address.images,
        },
        isMainOffice: formData.isMainOffice,
        phoneNumber: `${formData.phoneCountry.callingCode}${formData.phoneNumber}`,
        email: formData.email,
        managerName: formData.managerName,
        capacity: formData.capacity,
        isActive: formData.isActive,
      };

      console.log('🏢 Office Registration: Submitting office with businessId:', currentBusiness.id);
      console.log('📋 Office Registration: Payload:', JSON.stringify(payload, null, 2));

      await registerOffice(currentBusiness.id, payload);
      
      // Clear saved form data after successful submission
      await AsyncStorage.removeItem('officeRegistrationForm');
      
      // Clear location data from Zustand store
      clearLocationData();
      
      Alert.alert(
        'Success',
        'Office registered successfully! You can now start receiving orders.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('💥 Office Registration: Registration failed:', error);
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Show more detailed error message to user
      const errorMessage = error.message || 'Failed to register office';
      Alert.alert(
        'Registration Failed', 
        `Office registration failed: ${errorMessage}\n\nPlease check your information and try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof OfficeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const updateAddress = (field: keyof OfficeFormData['address'], value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const refreshLocation = () => {
    getCurrentLocation();
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
          <Text style={styles.title}>Office Registration</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Office Information</Text>
          
          <Input
            label="Office Name *"
            value={formData.name}
            onChangeText={(text) => updateFormData('name', text)}
            placeholder="e.g., Downtown Office"
            error={errors.name}
            style={styles.input}
          />

          <Input
            label="Manager Name *"
            value={formData.managerName}
            onChangeText={(text) => updateFormData('managerName', text)}
            placeholder="Enter manager's full name"
            error={errors.managerName}
            style={styles.input}
          />

          <PhoneInput
            label="Phone Number *"
            value={formData.phoneNumber}
            onChangeText={(text) => updateFormData('phoneNumber', text)}
            onCountryChange={(country) => updateFormData('phoneCountry', country)}
            selectedCountry={formData.phoneCountry}
            placeholder="Enter phone number"
            error={errors.phoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />

          <Input
            label="Email *"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            placeholder="office@yourbusiness.com"
            error={errors.email}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.capacityContainer}>
            <Text style={styles.label}>Capacity (Daily Orders)</Text>
            <View style={styles.capacityInput}>
              <TouchableOpacity
                style={styles.capacityButton}
                onPress={() => updateFormData('capacity', Math.max(10, formData.capacity - 10))}
              >
                <Ionicons name="remove" size={20} color="white" />
              </TouchableOpacity>
              <Text style={styles.capacityText}>{formData.capacity}</Text>
              <TouchableOpacity
                style={styles.capacityButton}
                onPress={() => updateFormData('capacity', formData.capacity + 10)}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Address Information</Text>

          {/* Location Picker Section */}
          <View style={styles.locationSection}>
            <Text style={styles.label}>Office Location *</Text>
            
            {/* Get Location Button */}
            <TouchableOpacity 
              style={[styles.locationButton, isGettingLocation && styles.locationButtonDisabled]} 
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              <Ionicons 
                name="location" 
                size={24} 
                color={isGettingLocation ? theme.colors.grayMedium : theme.colors.primary} 
              />
              <View style={styles.locationText}>
                <Text style={[styles.locationTitle, isGettingLocation && styles.locationTitleDisabled]}>
                  {isGettingLocation ? 'Getting Location...' : 'Get My Location'}
                </Text>
                <Text style={styles.locationSubtitle}>
                  Tap to capture GPS coordinates
                </Text>
              </View>
              {isGettingLocation && (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              )}
            </TouchableOpacity>

            {/* Location Error */}
            {locationError && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={16} color={theme.colors.error} />
                <Text style={styles.errorText}>{locationError}</Text>
              </View>
            )}

            {/* Coordinates Display */}
            {currentLocation && (
              <View style={styles.coordinatesContainer}>
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Latitude:</Text>
                  <Text style={styles.coordinateValue}>{formData.address.latitude}</Text>
                </View>
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Longitude:</Text>
                  <Text style={styles.coordinateValue}>{formData.address.longitude}</Text>
                </View>
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Detected Street:</Text>
                  <Text style={styles.coordinateValue}>
                    {formData.address.streetName || 'No street detected'}
                  </Text>
                </View>
                
              </View>)
            }
                {/* <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Accuracy:</Text>
                  <Text style={styles.coordinateValue}>
                    {currentLocation.coords.accuracy ? `${Math.round(currentLocation.coords.accuracy)}m` : 'Unknown'}
                  </Text>
                </View>
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Detected Street:</Text>
                  <Text style={styles.coordinateValue}>
                    {formData.address.streetName || 'No street detected'}
                  </Text>
                </View>
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Postcode:</Text>
                  <Text style={styles.coordinateValue}>
                    {formData.address.postCode || 'No postcode detected'}
                  </Text>
                </View>
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Landmark:</Text>
                  <Text style={styles.coordinateValue}>
                    {formData.address.landMark || 'No landmark detected'}
                  </Text>
                </View>
              </View> */}
            {/* )} */}

            {/* Map Controls */}
            {currentLocation && (
              <View style={styles.mapControls}>
                <TouchableOpacity style={styles.mapButton} onPress={toggleMap}>
                  <Ionicons name="map" size={20} color={theme.colors.primary} />
                  <Text style={styles.mapButtonText}>
                    {showMap ? 'Hide Map' : 'Show on Map'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.refreshButton} onPress={refreshLocation}>
                  <Ionicons name="refresh" size={20} color={theme.colors.secondary} />
                  <Text style={styles.refreshButtonText}>Refresh Location</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Map Display */}
            {showMap && currentLocation && (
              <View style={styles.mapContainer}>
                <View style={styles.mapPlaceholder}>
                  <Ionicons name="map" size={48} color={theme.colors.grayMedium} />
                  <Text style={styles.mapPlaceholderText}>Map View</Text>
                  <Text style={styles.mapPlaceholderSubtext}>
                    Coordinates: {formData.address.latitude}, {formData.address.longitude}
                  </Text>
                  <Text style={styles.mapPlaceholderSubtext}>
                    Accuracy: {currentLocation.coords.accuracy ? Math.round(currentLocation.coords.accuracy) + 'm' : 'Unknown'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Auto-fill Notice */}
          {/* {currentLocation && (
            <View style={styles.autoFillNotice}>
              <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.autoFillNoticeText}>
                Address fields below have been auto-filled from your location and are locked to prevent editing.
              </Text>
            </View>
          )} */}

          <View style={styles.textAreaContainer}>
            <Text style={styles.label}>Full Address Description *</Text>
            <TextInput
              style={[styles.textArea, !!errors.address?.description && styles.textAreaError]}
              value={formData.address.description}
              onChangeText={(text) => updateAddress('description', text)}
              placeholder="123 Main Street, Dar es Salaam, Tanzania"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {errors.address?.description && (
              <Text style={styles.errorText}>{errors.address.description}</Text>
            )}
          </View>

          <View style={styles.addressRow}>
            <View style={styles.addressHalf}>
              <Input
                label="House Number"
                value={formData.address.houseNumber}
                onChangeText={(text) => updateAddress('houseNumber', text)}
                placeholder="123"
                style={styles.input}
              />
            </View>
            <View style={styles.addressHalf}>
              <Input
                label="Street Name"
                value={formData.address.streetName}
                onChangeText={(text) => updateAddress('streetName', text)}
                placeholder="Main Street"
                style={formData.address.streetName ? [styles.input, styles.autoFilledInput] : styles.input}
                editable={!formData.address.streetName}
              />
            </View>
          </View>

          <View style={styles.addressRow}>
            <View style={styles.addressHalf}>
              <Input
                label="City"
                value={formData.address.city}
                onChangeText={(text) => updateAddress('city', text)}
                placeholder="Dar es Salaam"
                style={formData.address.city ? [styles.input, styles.autoFilledInput] : styles.input}
                editable={!formData.address.city}
              />
            </View>
            <View style={styles.addressHalf}>
              <Input
                label="Post Code"
                value={formData.address.postCode}
                onChangeText={(text) => updateAddress('postCode', text)}
                placeholder="11101"
                style={styles.input}
              />
            </View>
          </View>

          <Input
            label="Landmark"
            value={formData.address.landMark}
            onChangeText={(text) => updateAddress('landMark', text)}
            placeholder="Near the shopping mall"
            style={[styles.input, formData.address.landMark ? styles.autoFilledInput : styles.input]}
            editable={!formData.address.landMark}
          />

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateFormData('isMainOffice', !formData.isMainOffice)}
            >
              <Ionicons
                name={formData.isMainOffice ? 'checkbox' : 'square-outline'}
                size={24}
                color={formData.isMainOffice ? theme.colors.primary : theme.colors.grayMedium}
              />
              <Text style={styles.checkboxLabel}>This is the main office</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Register Office"
            onPress={handleSubmit}
            loading={isLoading}
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
  capacityContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily,
  },
  capacityInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  capacityButton: {
    padding: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  capacityText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginHorizontal: 24,
    fontFamily: theme.typography.fontFamilyBold,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 48,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  locationTitleDisabled: {
    color: theme.colors.grayMedium,
  },
  locationSubtitle: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    marginTop: 2,
    fontFamily: theme.typography.fontFamily,
  },
  locationSection: {
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginLeft: 8,
    fontFamily: theme.typography.fontFamily,
  },
  coordinatesContainer: {
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coordinateLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  mapButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: theme.typography.fontFamily,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  refreshButtonText: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: theme.typography.fontFamily,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 12,
    fontFamily: theme.typography.fontFamilyBold,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  autoFillNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  autoFillNoticeText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 8,
    flex: 1,
    fontFamily: theme.typography.fontFamily,
  },
  autoFilledInput: {
    backgroundColor: '#F5F5F5',
    borderColor: theme.colors.grayLight,
    opacity: 0.7,
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
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressHalf: {
    flex: 1,
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 12,
    fontFamily: theme.typography.fontFamily,
  },
  submitButton: {
    marginTop: 24,
  },
});