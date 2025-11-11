import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Clipboard,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../../components/Button';
import { theme } from '../../styles/theme';

export default function BusinessSuccessScreen() {
  const { business: businessParam, partnerAdmin: partnerAdminParam } = useLocalSearchParams();
  const [credentialsVisible, setCredentialsVisible] = useState(false);

  // Parse the JSON strings from route parameters
  const business = businessParam ? JSON.parse(businessParam as string) : null;
  const partnerAdmin = partnerAdminParam ? JSON.parse(partnerAdminParam as string) : null;

  if (!business || !partnerAdmin) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: Missing business data</Text>
        <Button title="Go Home" onPress={() => router.replace('/(tabs)/home')} />
      </View>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const handleLogin = () => {
    router.replace('/auth/signin');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={theme.colors.green} />
        </View>
        <Text style={styles.title}>Business Created Successfully!</Text>
        <Text style={styles.subtitle}>
          Your business has been registered and is pending approval.
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.businessInfo}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name:</Text>
            <Text style={styles.infoValue}>{business.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TIN Number:</Text>
            <Text style={styles.infoValue}>{business.tinNumber}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Plan:</Text>
            <Text style={styles.infoValue}>{business.servicePlanType}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, styles.statusPending]}>{business.status}</Text>
          </View>
        </View>

        <View style={styles.credentialsSection}>
          <View style={styles.credentialsHeader}>
            <Text style={styles.sectionTitle}>Login Credentials</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setCredentialsVisible(!credentialsVisible)}
            >
              <Ionicons 
                name={credentialsVisible ? "eye-off" : "eye"} 
                size={20} 
                color={theme.colors.primary} 
              />
              <Text style={styles.toggleButtonText}>
                {credentialsVisible ? 'Hide' : 'Show'} Credentials
              </Text>
            </TouchableOpacity>
          </View>

          {credentialsVisible && (
            <View style={styles.credentialsBox}>
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Phone Number:</Text>
                <View style={styles.credentialValueContainer}>
                  <Text style={styles.credentialValue}>{partnerAdmin.phoneNumber}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(partnerAdmin.phoneNumber, 'Phone number')}
                  >
                    <Ionicons name="copy" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Default Password:</Text>
                <View style={styles.credentialValueContainer}>
                  <Text style={styles.credentialValue}>{partnerAdmin.defaultPassword}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(partnerAdmin.defaultPassword, 'Password')}
                  >
                    <Ionicons name="copy" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={styles.importantNote}>
            <Ionicons name="information-circle" size={20} color={theme.colors.warning} />
            <Text style={styles.noteText}>
              Please save these credentials securely. You'll need them to log in to your business account.
            </Text>
          </View>
        </View>

        <View style={styles.nextSteps}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Use the credentials above to log in</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Wait for business approval (usually 24-48 hours)</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Create your first office location</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Login Now"
          onPress={handleLogin}
          variant="primary"
          size="large"
          style={styles.loginButton}
        />
        
        <Button
          title="Go to Home"
          onPress={handleGoHome}
          variant="outline"
          size="large"
          style={styles.homeButton}
        />
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: theme.typography.fontFamilyBold,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.grayMedium,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: theme.typography.fontFamily,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
    fontFamily: theme.typography.fontFamilyBold,
  },
  businessInfo: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  statusPending: {
    color: theme.colors.warning,
    fontWeight: '600',
  },
  credentialsSection: {
    marginBottom: 24,
  },
  credentialsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontFamily: theme.typography.fontFamily,
  },
  credentialsBox: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  credentialItem: {
    marginBottom: 16,
  },
  credentialLabel: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily,
  },
  credentialValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.grayLight,
    borderRadius: 8,
    padding: 12,
  },
  credentialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
    flex: 1,
  },
  copyButton: {
    padding: 4,
  },
  importantNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${theme.colors.warning}20`,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  noteText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    fontFamily: theme.typography.fontFamily,
  },
  nextSteps: {
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: theme.typography.fontFamilyBold,
  },
  stepText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.typography.fontFamily,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
  },
  homeButton: {
    borderColor: theme.colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: theme.typography.fontFamily,
  },
});
