import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  // Authentication is handled by the auth guard in _layout.tsx

  const handleLogin = () => {
    router.push('/auth/signin');
  };

  const handleCreateBusiness = () => {
    router.push('/business/registration');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Notification Bell - Top Right */}
        <TouchableOpacity style={styles.notificationBell}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.grayMedium} />
        </TouchableOpacity>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../assets/images/favicon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Tenga Laundry</Text>
          <Text style={styles.tagline}>
            Manage your laundry services, receive orders, and grow your business with ease.
          </Text>
          <Text style={styles.trustText}>
            Join hundreds of laundry businesses using Tenga to simplify daily operations.
          </Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonsSection}>
          <Button
            title="Login"
            onPress={handleLogin}
            variant="primary"
            size="large"
            leftIcon="key"
            style={styles.loginButton}
          />
          
          <Button
            title="Create Business"
            onPress={handleCreateBusiness}
            variant="outline"
            size="large"
            leftIcon="business"
            style={styles.createBusinessButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBell: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 5,
  },
  logo: {
    width: 100,
    height: 100,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamilyBold,
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  trustText: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonsSection: {
    width: '80%',
    gap: 16,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createBusinessButton: {
    borderColor: theme.colors.primary,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
  },
});