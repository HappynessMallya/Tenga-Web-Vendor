import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBusinessStore } from '../../stores/businessStore';
import { useUserStore } from '../../stores/userStore';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

export default function PartnerAdminReportsScreen() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const offices = useBusinessStore((state) => state.offices);
  const staff = useBusinessStore((state) => state.staff);
  const { fetchBusinessOffices, fetchBusinessStaff } = useBusinessStore();
  const [refreshing, setRefreshing] = useState(false);

  // Memoize business statistics
  const businessStats = useMemo(() => {
    const safeOffices = Array.isArray(offices) ? offices : [];
    const businessOffices = safeOffices.filter(office => office.businessId === currentBusiness?.id);
    
    const activeOffices = businessOffices.filter(office => office.isActive).length;
    const totalCapacity = businessOffices.reduce((sum, office) => sum + office.capacity, 0);
    const totalStaff = staff.length;
    const mainOffices = businessOffices.filter(office => office.isMainOffice).length;
    
    return { 
      totalOffices: businessOffices.length, 
      activeOffices, 
      totalCapacity,
      totalStaff,
      mainOffices
    };
  }, [offices, staff, currentBusiness?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (currentBusiness?.id && isAuthenticated) {
      try {
        await fetchBusinessOffices(currentBusiness.id);
        await fetchBusinessStaff(currentBusiness.id);
      } catch (error) {
        console.error('Failed to refresh data:', error);
      }
    }
    setTimeout(() => setRefreshing(false), 1000);
  }, [currentBusiness?.id, fetchBusinessOffices, fetchBusinessStaff, isAuthenticated]);

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
          <Text style={styles.title}>Business Reports</Text>
          <Text style={styles.subtitle}>
            Overview of your business performance
          </Text>
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

        {/* Key Metrics */}
        {/* <View style={styles.metricsContainer}>
          <Card style={styles.metricCard}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricIcon}>
                <Ionicons name="business-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.metricNumber}>{businessStats.totalOffices}</Text>
              <Text style={styles.metricLabel}>Total Offices</Text>
            </Card.Content>
          </Card>

          <Card style={styles.metricCard}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricIcon}>
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
              </View>
              <Text style={styles.metricNumber}>{businessStats.activeOffices}</Text>
              <Text style={styles.metricLabel}>Active Offices</Text>
            </Card.Content>
          </Card>

          <Card style={styles.metricCard}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricIcon}>
                <Ionicons name="people-outline" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.metricNumber}>{businessStats.totalCapacity}</Text>
              <Text style={styles.metricLabel}>Total Capacity</Text>
            </Card.Content>
          </Card>

          <Card style={styles.metricCard}>
            <Card.Content style={styles.metricContent}>
              <View style={styles.metricIcon}>
                <Ionicons name="person-outline" size={20} color={theme.colors.warning} />
              </View>
              <Text style={styles.metricNumber}>{businessStats.totalStaff}</Text>
              <Text style={styles.metricLabel}>Staff Members</Text>
            </Card.Content>
          </Card>
        </View> */}

        {/* Coming Soon Section */}
        <Card style={styles.comingSoonCard}>
          <Card.Content style={styles.comingSoonContent}>
            <View style={styles.comingSoonIcon}>
              <Ionicons name="analytics-outline" size={32} color="white" />
            </View>
            <Text style={styles.comingSoonTitle}>Advanced Reports Coming Soon</Text>
            <Text style={styles.comingSoonDescription}>
              We're working on comprehensive reporting features including:
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.featureText}>Revenue Analytics</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.featureText}>Order Performance Metrics</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.featureText}>Staff Productivity Reports</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.featureText}>Customer Satisfaction Analytics</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.featureText}>Financial Reports & Insights</Text>
              </View>
            </View>
            
            <Text style={styles.comingSoonFooter}>
              Stay tuned for these powerful reporting capabilities!
            </Text>
          </Card.Content>
        </Card>

        {/* Current Status Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>Current Business Status</Text>
            
            <View style={styles.summaryItem}>
              <Ionicons name="business" size={20} color={theme.colors.primary} />
              <Text style={styles.summaryText}>
                {businessStats.mainOffices} Main Office{businessStats.mainOffices !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="location" size={20} color={theme.colors.secondary} />
              <Text style={styles.summaryText}>
                Operating in {businessStats.activeOffices} location{businessStats.activeOffices !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="people" size={20} color={theme.colors.warning} />
              <Text style={styles.summaryText}>
                {businessStats.totalStaff} Staff member{businessStats.totalStaff !== 1 ? 's' : ''} ready to serve
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="trending-up" size={20} color={theme.colors.success} />
              <Text style={styles.summaryText}>
                Total capacity: {businessStats.totalCapacity} orders per day
              </Text>
            </View>
          </Card.Content>
        </Card>
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
  title: {
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
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  metricContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  comingSoonCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
  },
  comingSoonContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  comingSoonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  featureList: {
    width: '100%',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  comingSoonFooter: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 12,
  },
});
