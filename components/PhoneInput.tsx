import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../styles/theme';

interface Country {
  cca2: string;
  name: string;
  callingCode: string;
  flag: string;
}

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onCountryChange: (country: Country) => void;
  selectedCountry: Country;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'phone-pad';
  autoComplete?: 'tel';
  textContentType?: 'telephoneNumber';
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChangeText,
  onBlur,
  onCountryChange,
  selectedCountry,
  placeholder = "Enter phone number",
  error,
  keyboardType = 'phone-pad',
  autoComplete,
  textContentType,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const countries = [
    { cca2: 'TZ', name: 'Tanzania', callingCode: '+255', flag: '🇹🇿' },
    { cca2: 'KE', name: 'Kenya', callingCode: '+254', flag: '🇰🇪' },
    { cca2: 'UG', name: 'Uganda', callingCode: '+256', flag: '🇺🇬' },
    { cca2: 'RW', name: 'Rwanda', callingCode: '+250', flag: '🇷🇼' },
    { cca2: 'ET', name: 'Ethiopia', callingCode: '+251', flag: '🇪🇹' },
    { cca2: 'SO', name: 'Somalia', callingCode: '+252', flag: '🇸🇴' },
    { cca2: 'DJ', name: 'Djibouti', callingCode: '+253', flag: '🇩🇯' },
    { cca2: 'ER', name: 'Eritrea', callingCode: '+291', flag: '🇪🇷' },
    { cca2: 'SS', name: 'South Sudan', callingCode: '+211', flag: '🇸🇸' },
    { cca2: 'BI', name: 'Burundi', callingCode: '+257', flag: '🇧🇮' },
  ];

  const handleCountrySelect = (country: Country) => {
    onCountryChange(country);
    setShowCountryPicker(false);
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.callingCode}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused ? styles.inputContainerFocused : null,
        error ? styles.inputContainerError : null,
      ]}>
        {/* Country Picker */}
        <TouchableOpacity 
          style={styles.countrySelector}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.countryCode}>{selectedCountry.callingCode}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.grayMedium} />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Phone Number Input */}
        <TextInput
          style={styles.phoneInput}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.grayMedium}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          textContentType={textContentType}
        />
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.cca2}
              style={styles.countryList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
  },
  inputContainerError: {
    borderColor: '#DC2626',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginRight: 4,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    paddingVertical: 12,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  closeButton: {
    padding: 4,
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
});
