import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { theme } from '../styles/theme';

interface CountryPickerComponentProps {
  label?: string;
  selectedCountry: {
    cca2: string;
    name: string;
    callingCode: string;
  };
  onSelect: (country: any) => void;
  error?: string;
  containerStyle?: any;
}

export const CountryPickerComponent: React.FC<CountryPickerComponentProps> = ({
  label,
  selectedCountry,
  onSelect,
  error,
  containerStyle,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.pickerContainer,
          error ? styles.pickerContainerError : null,
        ]}
        onPress={() => setIsVisible(true)}
      >
        <View style={styles.countryInfo}>
          <Text style={styles.countryCode}>+{selectedCountry.callingCode}</Text>
          <Text style={styles.countryName}>{selectedCountry.name}</Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.grayMedium}
        />
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <CountryPicker
        visible={isVisible}
        countryCode={selectedCountry.cca2 as any}
        onSelect={(country: any) => {
          onSelect(country);
          setIsVisible(false);
        }}
        onClose={() => setIsVisible(false)}
        withFilter
        withFlag
        withCountryNameButton
        withCallingCode
        withEmoji
        theme={{
          primaryColor: theme.colors.secondary,
          primaryColorVariant: theme.colors.secondary,
          backgroundColor: theme.colors.background,
          onBackgroundTextColor: theme.colors.text,
          fontSize: 16,
        }}
      />
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
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  pickerContainerError: {
    borderColor: '#DC2626',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryCode: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginRight: 12,
    fontWeight: '500',
  },
  countryName: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
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
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
});
