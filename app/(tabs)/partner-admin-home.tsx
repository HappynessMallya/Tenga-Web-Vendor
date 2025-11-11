import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBusinessStore } from '../../stores/businessStore';
import { useUserStore } from '../../stores/userStore';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

export default function PartnerAdminHomeScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { logout } = useUserStore();
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const offices = useBusinessStore((state) => state.offices);
  const staff = useBusinessStore((state) => state.staff);
  const { checkBusinessOffices, fetchBusinessOffices, fetchBusinessStaff } = useBusinessStore();
  const [refreshing, setRefreshing] = useState(false);
  const [hasOffices, setHasOffices] = useState<boolean | null>(null);
  const [isCheckingOffices, setIsCheckingOffices] = useState(false);

  // Check if business has offices when component mounts
  useEffect(() => {
    const checkOffices = async () => {
      if (currentBusiness?.id && isAuthenticated) {
        setIsCheckingOffices(true);
        try {
          // First, try to use offices from the store
          const storeOffices = offices.filter(office => office.businessId === currentBusiness.id);
          
          if (storeOffices.length > 0) {
            // We have offices in the store, use them
            setHasOffices(true);
            console.log('🏢 Partner Admin Home: Using offices from store:', storeOffices.length);
          } else {
            // No offices in store, make API call to check
            const result = await checkBusinessOffices(currentBusiness.id);
            setHasOffices(result.hasOffices);
            console.log('🏢 Partner Admin Home: Office check result from API:', result);
          }
        } catch (error) {
          console.error('💥 Partner Admin Home: Failed to check offices:', error);
          setHasOffices(false);
        } finally {
          setIsCheckingOffices(false);
        }
      } else {
        setHasOffices(null);
      }
    };

    checkOffices();
  }, [currentBusiness?.id, checkBusinessOffices, isAuthenticated, offices]);

  // Fetch staff data when component mounts
  useEffect(() => {
    const loadStaff = async () => {
      if (currentBusiness?.id && isAuthenticated) {
        try {
          await fetchBusinessStaff(currentBusiness.id);
          console.log('✅ Partner Admin Home: Staff data loaded successfully');
        } catch (error) {
          console.error('❌ Partner Admin Home: Failed to load staff data:', error);
        }
      }
    };

    loadStaff();
  }, [currentBusiness?.id, fetchBusinessStaff, isAuthenticated]);

  // Memoize business statistics
  const businessStats = useMemo(() => {
    // Ensure offices is always an array
    const safeOffices = Array.isArray(offices) ? offices : [];
    
    const activeOffices = safeOffices.filter(office => office.isActive).length;
    const totalCapacity = safeOffices.reduce((sum, office) => sum + office.capacity, 0);
    const totalStaff = staff.length;
    
    // Debug logging
    console.log('📊 Partner Admin Home Stats:', {
      offices: safeOffices.length,
      staff: totalStaff,
      staffData: staff,
      currentBusiness: currentBusiness?.id
    });
    
    return { 
      totalOffices: safeOffices.length, 
      activeOffices, 
      totalCapacity,
      totalStaff 
    };
  }, [offices, staff]);

  const handleAddOffice = useCallback(() => {
    if (!currentBusiness) {
      Alert.alert('Error', 'No business selected. Please create a business first.');
      return;
    }
    router.push('/business/office-registration');
  }, [router, currentBusiness]);

  const handleManageOffices = useCallback(() => {
    router.push('/(tabs)/business');
  }, [router]);

  const handleManageStaff = useCallback(() => {
    router.push('/(tabs)/staff');
  }, [router]);

  const handleLogout = useCallback(async () => {
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
          onPress: async () => {
            try {
              await logout();
              console.log('✅ Partner Admin: Logout successful');
              // Navigation will be handled by the auth guard
            } catch (error) {
              console.error('❌ Partner Admin: Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  }, [logout]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (currentBusiness?.id && isAuthenticated) {
      try {
        await fetchBusinessOffices(currentBusiness.id);
        await fetchBusinessStaff(currentBusiness.id);
        
        // Update office check state after refreshing data
        const storeOffices = offices.filter(office => office.businessId === currentBusiness.id);
        setHasOffices(storeOffices.length > 0);
      } catch (error) {
        console.error('Failed to refresh data:', error);
      }
    }
    setTimeout(() => setRefreshing(false), 1000);
  }, [currentBusiness?.id, fetchBusinessOffices, fetchBusinessStaff, isAuthenticated, offices]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.fullName || 'Partner Admin'}!
            </Text>
            <Text style={styles.subtitle}>
              Manage your business operations
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Business Overview Card */}
      {currentBusiness && (
        <Card style={styles.businessCard}>
          <Card.Content>
            <View style={styles.businessHeader}>
              <View style={styles.businessIconContainer}>
                <Ionicons name="business" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{currentBusiness.name}</Text>
                <Text style={styles.businessTin}>TIN: {currentBusiness.tinNumber || 'Not provided'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="business-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.statNumber}>{businessStats.totalOffices}</Text>
            <Text style={styles.statLabel}>Total Offices</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
            </View>
            <Text style={styles.statNumber}>{businessStats.activeOffices}</Text>
            <Text style={styles.statLabel}>Active Offices</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="people-outline" size={20} color={theme.colors.secondary} />
            </View>
            <Text style={styles.statNumber}>{businessStats.totalCapacity}</Text>
            <Text style={styles.statLabel}>Total Capacity</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="person-outline" size={20} color={theme.colors.warning} />
            </View>
            <Text style={styles.statNumber}>{businessStats.totalStaff}</Text>
            <Text style={styles.statLabel}>Staff Members</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          

          <TouchableOpacity style={styles.actionButton} onPress={handleManageOffices}>
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="business" size={24} color={theme.colors.secondary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Manage Offices</Text>
                <Text style={styles.actionDescription}>View and edit office details</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleManageStaff}>
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="people" size={24} color={theme.colors.warning} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Manage Staff</Text>
                <Text style={styles.actionDescription}>Add and manage staff members</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

         

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/(tabs)/partner-admin-reports')}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="bar-chart" size={24} color={theme.colors.success} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Reports</Text>
                <Text style={styles.actionDescription}>View business reports</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Office Creation Prompt */}
      {currentBusiness && hasOffices === false && !isCheckingOffices && (
        <Card style={styles.promptCard}>
          <Card.Content style={styles.promptContent}>
            <View style={styles.promptIcon}>
              <Ionicons name="business-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.promptTitle}>Create Your First Office</Text>
            <Text style={styles.promptDescription}>
              You haven't created any offices yet. Go to the Business tab to add your first office and start managing your business operations.
            </Text>
            <Button 
              mode="contained" 
              onPress={handleManageOffices}
              style={styles.promptButton}
              contentStyle={styles.promptButtonContent}
            >
              Go to Business Tab
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* No Business Found */}
      {!currentBusiness && user?.role === 'PARTNER_ADMIN' && (
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle-outline" size={32} color={theme.colors.warning} />
            </View>
            <Text style={styles.infoTitle}>Business Setup Required</Text>
            <Text style={styles.infoDescription}>
              It looks like you don't have a business associated with your account yet. 
              Please contact support to set up your business profile.
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.errorBackground,
    marginLeft: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  businessCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  businessTin: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  promptCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  promptContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  promptIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  promptDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  promptButton: {
    borderRadius: 8,
  },
  promptButtonContent: {
    paddingVertical: 8,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  infoContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
