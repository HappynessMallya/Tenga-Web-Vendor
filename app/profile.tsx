import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PhoneInput } from '../components/PhoneInput';
import { useUserStore } from '../stores/userStore';
import { theme } from '../styles/theme';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    country: {
      cca2: 'TZ',
      name: user?.country || 'Tanzania',
      callingCode: '+255',
      flag: '🇹🇿',
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/auth/welcome');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Show confirmation dialog
            Alert.alert(
              'Final Confirmation',
              'Type "DELETE" to confirm account deletion',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsLoading(true);
                      // TODO: Implement delete account API call
                      // await deleteAccount();
                      Alert.alert(
                        'Account Deleted',
                        'Your account has been successfully deleted.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              logout();
                              router.replace('/auth/welcome');
                            },
                          },
                        ]
                      );
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        country: formData.country.name,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      country: {
        cca2: 'TZ',
        name: user?.country || 'Tanzania',
        callingCode: '+255',
        flag: '🇹🇿',
      },
    });
    setIsEditing(false);
  };

  const handleBusinessRegistration = () => {
    // Navigate to business registration screen
    router.push('/business/registration');
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user data available</Text>
          <Button
            title="Go to Login"
            onPress={() => router.replace('/auth/welcome')}
            variant="primary"
            style={styles.loginButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        <View style={styles.content}>
          {/* Profile Image Section */}
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageWrapper}>
              {user.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={60} color={theme.colors.background} />
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
            >
              <Ionicons 
                name={isEditing ? "checkmark" : "create"} 
                size={20} 
                color={theme.colors.secondary} 
              />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userPhone}>{user.phoneNumber}</Text>
          </View>


          {/* Profile Form */}
          {isEditing && (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <Input
                label="Full Name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Enter your full name"
                autoComplete="name"
                textContentType="name"
              />

              <Input
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <PhoneInput
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                onCountryChange={(country) => setFormData({ ...formData, country })}
                selectedCountry={formData.country}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />

              <View style={styles.formActions}>
                <Button
                  title="Cancel"
                  onPress={handleCancel}
                  variant="outline"
                  size="medium"
                  style={{ minWidth: 120, borderColor: 'white', backgroundColor: 'white' }}
                  textStyle={{ color: theme.colors.text }}
                />
              </View>
            </View>
          )}

          {/* Settings Section */}
          <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Business</Text>
            
            <TouchableOpacity style={styles.businessRegistrationButton} onPress={handleBusinessRegistration}>
              <View style={styles.businessButtonContent}>
                <View style={styles.businessButtonLeft}>
                  <View style={styles.businessIconContainer}>
                    <Ionicons name="business" size={24} color={theme.colors.background} />
                  </View>
                  <View style={styles.businessTextContainer}>
                    <Text style={styles.businessTitle}>Register Your Business</Text>
                    <Text style={styles.businessSubtitle}>Get verified and start accepting orders</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Settings</Text>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={24} color={theme.colors.grayMedium} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.grayMedium} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="shield-checkmark" size={24} color={theme.colors.grayMedium} />
                <Text style={styles.settingText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.grayMedium} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="card" size={24} color={theme.colors.grayMedium} />
                <Text style={styles.settingText}>Payment Methods</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.grayMedium} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="language" size={24} color={theme.colors.grayMedium} />
                <Text style={styles.settingText}>Language & Region</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.grayMedium} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle" size={24} color={theme.colors.grayMedium} />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.grayMedium} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle" size={24} color={theme.colors.grayMedium} />
                <Text style={styles.settingText}>About</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.grayMedium} />
            </TouchableOpacity>
          </View>

          {/* Account Actions */}
          <View style={styles.accountActionsContainer}>
            <Button
              title="Logout"
              onPress={handleLogout}
              variant="outline"
              size="large"
              leftIcon="log-out"
              style={{ borderColor: 'white', backgroundColor: 'white' }}
              textStyle={{ color: theme.colors.text }}
            />
            
            <Button
              title="Delete Account"
              onPress={handleDeleteAccount}
              variant="outline"
              size="large"
              leftIcon="trash"
              style={{ borderColor: 'white', backgroundColor: 'white' }}
              textStyle={{ color: theme.colors.text }}
              loading={isLoading}
            />
          </View>
    </View>
      </ScrollView>
    </SafeAreaView>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  userInfoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
  },
  formActions: {
    marginTop: 24,
    alignItems: 'center',
  },
  cancelButton: {
    minWidth: 120,
  },
  formContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
    marginBottom: 16,
  },
  settingsContainer: {
    marginBottom: 32,
  },
  businessRegistrationButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 16,
    marginBottom: 24,
    padding: 20,
    shadowColor: theme.colors.secondary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  businessButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  businessButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  businessIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  businessTextContainer: {
    flex: 1,
  },
  businessTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.background,
    fontFamily: theme.typography.fontFamilyBold,
    marginBottom: 4,
  },
  businessSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: theme.typography.fontFamily,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginLeft: 12,
  },
  accountActionsContainer: {
    marginBottom: 32,
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 24,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
  },
});


