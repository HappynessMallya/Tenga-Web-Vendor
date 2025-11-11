import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Card } from 'react-native-paper';
import { useBusinessStore } from '../../stores/businessStore';
import { useUserStore } from '../../stores/userStore';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

interface Office {
  id: string;
  name: string;
  address: {
    description: string;
    city: string;
  };
  managerName: string;
  phoneNumber: string;
  email: string;
  capacity: number;
  isMainOffice: boolean;
  isActive: boolean;
}

export default function BusinessManagementScreen() {
  const { user } = useUserStore();
  const { 
    currentBusiness, 
    offices, 
    isLoading, 
    fetchBusinessOffices,
    clearState,
    getUserBusinessId,
    userBusinessMapping,
    businesses
  } = useBusinessStore();
  
  const [refreshing, setRefreshing] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Business Screen Debug:', {
      userId: user?.id,
      userRole: user?.role,
      currentBusiness: currentBusiness ? {
        id: currentBusiness.id,
        name: currentBusiness.name
      } : null,
      userBusinessId: user?.id ? getUserBusinessId(user.id) : null,
      userBusinessMapping,
      businessesCount: businesses.length,
      businesses: businesses.map(b => ({ id: b.id, name: b.name, ownerPhone: b.ownerPhone }))
    });
  }, [user, currentBusiness, getUserBusinessId, userBusinessMapping, businesses]);

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchBusinessOffices(currentBusiness.id);
    } else if (user?.id && user?.role === 'PARTNER_ADMIN') {
      // Try to find and set the business if not already set
      const userBusinessId = getUserBusinessId(user.id);
      if (userBusinessId) {
        console.log('🔧 Business Screen: Found businessId for user, attempting to set current business');
        const userBusiness = businesses.find(b => b.id === userBusinessId);
        if (userBusiness) {
          console.log('✅ Business Screen: Setting current business from stored data:', userBusiness.name);
          // We need to trigger the business store to set this business
          // This will be handled by the handlePartnerAdminLogin function
        }
      }
    }
  }, [currentBusiness?.id, user?.id, user?.role, getUserBusinessId, businesses]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentBusiness?.id) {
        await fetchBusinessOffices(currentBusiness.id);
      }
    } catch (error) {
      console.error('Error refreshing offices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddOffice = () => {
    if (!currentBusiness) {
      Alert.alert('Error', 'No business selected. Please create a business first.');
      return;
    }
    router.push('/business/office-registration');
  };

  const handleOfficePress = (office: Office) => {
    // Navigate to office details or management
    console.log('Office pressed:', office);
  };

  const renderOfficeItem = ({ item }: { item: Office }) => (
    <TouchableOpacity
      style={styles.officeCard}
      onPress={() => handleOfficePress(item)}
    >
      <View style={styles.officeHeader}>
        <View style={styles.officeInfo}>
          <Text style={styles.officeName} numberOfLines={2}>{item.name}</Text>
          {item.isMainOffice && (
            <View style={styles.mainOfficeBadge}>
              <Text style={styles.mainOfficeText}>Main Office</Text>
            </View>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.statusText}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <View style={styles.officeDetails}>
        <View style={styles.officeDetailRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.grayMedium} />
          <Text style={styles.officeDetailText}>{item.address.description}</Text>
        </View>
        
        <View style={styles.officeDetailRow}>
          <Ionicons name="person-outline" size={16} color={theme.colors.grayMedium} />
          <Text style={styles.officeDetailText}>{item.managerName}</Text>
        </View>
        
        <View style={styles.officeDetailRow}>
          <Ionicons name="call-outline" size={16} color={theme.colors.grayMedium} />
          <Text style={styles.officeDetailText}>{item.phoneNumber}</Text>
        </View>
        
        <View style={styles.officeDetailRow}>
          <Ionicons name="cube-outline" size={16} color={theme.colors.grayMedium} />
          <Text style={styles.officeDetailText}>Capacity: {item.capacity} orders/day</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Card.Content style={styles.emptyCardContent}>
        <Ionicons name="business-outline" size={48} color={theme.colors.grayMedium} />
        <Text style={styles.emptyTitle}>No Offices Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first office to start managing your business locations
        </Text>
        <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddOffice}>
          <Text style={styles.emptyAddButtonText}>Add Office +</Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

  const handleManualBusinessSetup = async () => {
    if (user?.id && user?.role === 'PARTNER_ADMIN') {
      console.log('🔧 Manual business setup triggered for user:', user.id);
      const userBusinessId = getUserBusinessId(user.id);
      const userBusiness = businesses.find(b => b.id === userBusinessId);
      
      if (userBusiness) {
        console.log('✅ Found business for manual setup:', userBusiness.name);
        // Import the business store action
        const { setCurrentBusiness } = useBusinessStore.getState();
        setCurrentBusiness(userBusiness);
      } else {
        console.log('❌ No business found for manual setup');
        Alert.alert('No Business Found', 'No business found for this user. Please create a business first.');
      }
    }
  };

  const handleCreateTestBusiness = async () => {
    if (user?.id && user?.role === 'PARTNER_ADMIN') {
      console.log('🧪 Creating test business for user:', user.id);
      
      // Create a test business
      const testBusiness = {
        id: `test-business-${user.id}`,
        name: 'Test Business',
        tinNumber: 'TEST123456',
        servicePlanType: 'BASIC' as const,
        ownerName: user.fullName || 'Test Owner',
        ownerEmail: user.email || 'test@example.com',
        ownerPhone: user.phoneNumber || '123456789',
        description: 'Test business for debugging',
        website: '',
        logo: '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to store
      const { addBusiness, setCurrentBusiness, setUserBusinessMapping } = useBusinessStore.getState();
      addBusiness(testBusiness);
      setCurrentBusiness(testBusiness);
      setUserBusinessMapping(user.id, testBusiness.id);
      
      console.log('✅ Test business created and mapped to user');
      Alert.alert('Success', 'Test business created! You can now manage offices.');
    }
  };

  if (!currentBusiness) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Business Management</Text>
        </View>
        <View style={styles.emptyCard}>
          <Card.Content style={styles.emptyCardContent}>
            <Ionicons name="business-outline" size={48} color={theme.colors.grayMedium} />
            <Text style={styles.emptyTitle}>No Business Found</Text>
            <Text style={styles.emptySubtitle}>
              Please create a business first to manage offices
            </Text>
            
            {/* Debug info */}
            {user?.role === 'PARTNER_ADMIN' && (
              <View style={{ marginVertical: 16, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Debug Info:</Text>
                <Text style={{ fontSize: 10, color: '#666' }}>User ID: {user.id}</Text>
                <Text style={{ fontSize: 10, color: '#666' }}>BusinessId: {getUserBusinessId(user.id) || 'None'}</Text>
                <Text style={{ fontSize: 10, color: '#666' }}>Stored Businesses: {businesses.length}</Text>
                
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {getUserBusinessId(user.id) ? (
                    <TouchableOpacity 
                      style={[styles.emptyAddButton, { backgroundColor: '#10B981', flex: 1 }]} 
                      onPress={handleManualBusinessSetup}
                    >
                      <Ionicons name="refresh" size={20} color="white" />
                      <Text style={styles.emptyAddButtonText}>Load Business</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.emptyAddButton, { backgroundColor: '#3B82F6', flex: 1 }]} 
                      onPress={handleCreateTestBusiness}
                    >
                      <Ionicons name="flask" size={20} color="white" />
                      <Text style={styles.emptyAddButtonText}>Create Test</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.emptyAddButton} 
              onPress={() => router.push('/business/registration')}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.emptyAddButtonText}>Create Business</Text>
            </TouchableOpacity>
          </Card.Content>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Business Management</Text>
          <Text style={styles.subtitle}>{currentBusiness.name}</Text>
        </View>
        <TouchableOpacity style={styles.addOfficeButton} onPress={handleAddOffice}>
          <Text style={styles.addOfficeButtonText}>Add Office +</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statCardContent}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="business-outline" size={24} color="white" />
            </View>
            <Text style={styles.statNumber}>{offices.length}</Text>
            <Text style={styles.statLabel}>Total Offices</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statCardContent}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.green }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="white" />
            </View>
            <Text style={styles.statNumber}>
              {offices.filter(office => office.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Active Offices</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statCardContent}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="cube-outline" size={24} color="white" />
            </View>
            <Text style={styles.statNumber}>
              {offices.reduce((total, office) => total + office.capacity, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Capacity</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Office Locations</Text>
        <TouchableOpacity onPress={handleAddOffice}>
          <Text style={styles.seeAllText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Offices List */}
      {offices.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.officesList}>
          {offices.map((office) => (
            <Card key={office.id} style={styles.officeCard}>
              <Card.Content style={styles.officeCardContent}>
                <View style={styles.officeHeader}>
                  <View style={styles.officeInfo}>
                    <Text style={styles.officeName} numberOfLines={2}>{office.name}</Text>
                    {office.isMainOffice && (
                      <View style={styles.mainOfficeBadge}>
                        <Text style={styles.mainOfficeText}>Main Office</Text>
                      </View>
                    )}
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: office.isActive ? theme.colors.green : theme.colors.error }
                  ]}>
                    <Ionicons 
                      name={office.isActive ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color="white" 
                    />
                    <Text style={styles.statusText}>
                      {office.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.officeDetails}>
                  <View style={styles.officeDetailRow}>
                    <Ionicons name="location-outline" size={16} color={theme.colors.grayMedium} />
                    <Text style={styles.officeDetailText} numberOfLines={2}>
                      {office.address.description}
                    </Text>
                  </View>
                  
                  <View style={styles.officeDetailRow}>
                    <Ionicons name="person-outline" size={16} color={theme.colors.grayMedium} />
                    <Text style={styles.officeDetailText}>{office.managerName}</Text>
                  </View>
                  
                  <View style={styles.officeDetailRow}>
                    <Ionicons name="call-outline" size={16} color={theme.colors.grayMedium} />
                    <Text style={styles.officeDetailText}>{office.phoneNumber}</Text>
                  </View>
                  
                  <View style={styles.officeDetailRow}>
                    <Ionicons name="cube-outline" size={16} color={theme.colors.grayMedium} />
                    <Text style={styles.officeDetailText}>Capacity: {office.capacity} orders/day</Text>
                  </View>
                </View>

                <View style={styles.officeFooter}>
                  <TouchableOpacity 
                    style={styles.manageButton}
                    onPress={() => handleOfficePress(office)}
                  >
                    <Text style={styles.manageButtonText}>Manage Office</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 52,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.grayMedium,
    marginTop: 4,
    fontFamily: theme.typography.fontFamily,
  },
  addOfficeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    elevation: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addOfficeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamilyBold,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.grayMedium,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  seeAllText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily,
  },
  officesList: {
    gap: 16,
  },
  officeCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  officeCardContent: {
    padding: 16,
  },
  officeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  officeInfo: {
    flex: 1,
    marginRight: 8,
  },
  officeName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamilyBold,
    lineHeight: 22,
  },
  mainOfficeBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mainOfficeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamilyBold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: theme.typography.fontFamilyBold,
  },
  officeDetails: {
    marginBottom: 16,
    gap: 8,
  },
  officeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  officeDetailText: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    flex: 1,
    fontFamily: theme.typography.fontFamily,
  },
  officeFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily,
  },
  emptyCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyCardContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamilyBold,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.grayMedium,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: theme.typography.fontFamily,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily,
  },
});
