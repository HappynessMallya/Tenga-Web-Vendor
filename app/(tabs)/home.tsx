import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { useOrderStore } from '../../stores/orderStore';
import { useUserStore } from '../../stores/userStore';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const { checkBusinessOffices } = useBusinessStore();
  const [refreshing, setRefreshing] = useState(false);
  const [hasOffices, setHasOffices] = useState<boolean | null>(null);
  const [isCheckingOffices, setIsCheckingOffices] = useState(false);

  // User is guaranteed to be authenticated due to auth guard in _layout.tsx

  // Check if business has offices when component mounts
  useEffect(() => {
    const checkOffices = async () => {
      // Don't check offices for PARTNER_ADMIN or STAFF users - they have their own screens
      if (user?.role === 'PARTNER_ADMIN' || user?.role === 'STAFF') {
        console.log('ℹ️ Home Screen: Skipping office check for', user.role, 'user');
        return;
      }
      
      if (currentBusiness?.id) {
        setIsCheckingOffices(true);
        try {
          const result = await checkBusinessOffices(currentBusiness.id);
          setHasOffices(result.hasOffices);
          console.log('🏢 Home Screen: Office check result:', result);
        } catch (error) {
          console.error('💥 Home Screen: Failed to check offices:', error);
          setHasOffices(false); // Default to false on error
        } finally {
          setIsCheckingOffices(false);
        }
      } else {
        setHasOffices(null);
      }
    };

    checkOffices();
  }, [currentBusiness?.id, checkBusinessOffices, user?.role]);

  // Memoize all calculations to prevent re-renders
  const stats = useMemo(() => {
    const newCount = orders.filter((o) => o.status === 'pending').length;
    const inProgress = orders.filter((o) => o.status === 'in_progress' || o.status === 'confirmed').length;
    const completed = orders.filter((o) => o.status === 'delivered').length;
    const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
    
    return { newCount, inProgress, completed, totalRevenue };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.filter((o) => ['pending', 'confirmed', 'in_progress', 'ready'].includes(o.status));
  }, [orders]);

  const handleBusinessRegistration = useCallback(() => {
    router.push('/business/registration');
  }, [router]);

  const handleAcceptOrder = useCallback(async (orderId: string) => {
    const updateOrder = useOrderStore.getState().updateOrder;
    try {
      await updateOrder(orderId, { status: 'confirmed' });
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  }, []);

  const handleStartOrder = useCallback(async (orderId: string) => {
    const updateOrder = useOrderStore.getState().updateOrder;
    try {
      await updateOrder(orderId, { status: 'in_progress' });
    } catch (error) {
      console.error('Failed to start order:', error);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'confirmed': return theme.colors.secondary;
      case 'in_progress': return theme.colors.primary;
      case 'ready': return theme.colors.success;
      case 'delivered': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'New';
      case 'confirmed': return 'Confirmed';
      case 'in_progress': return 'In Progress';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Route to appropriate home screen based on user role
  useEffect(() => {
    if (user?.role === 'PARTNER_ADMIN') {
      router.replace('/(tabs)/partner-admin-home');
    } else if (user?.role === 'STAFF') {
      router.replace('/(tabs)/staff-home');
    }
  }, [user?.role, router]);

  // Show loading while redirecting
  if (user?.role === 'PARTNER_ADMIN' || user?.role === 'STAFF') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Regular user home screen (for non-PARTNER_ADMIN, non-STAFF users)
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
        <Text style={styles.greeting}>
          {getGreeting()}, {user?.fullName || 'User'}!
        </Text>
        <Text style={styles.subtitle}>
          Manage your laundry orders
        </Text>
      </View>

      {/* Business Registration Card */}
      {!currentBusiness && user?.role !== 'PARTNER_ADMIN' && (
        <Card style={styles.registrationCard}>
          <Card.Content style={styles.registrationContent}>
            <View style={styles.registrationIcon}>
              <Ionicons name="business-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.registrationTitle}>Register Your Business</Text>
            <Text style={styles.registrationDescription}>
              Get started by registering your laundry business to begin accepting orders.
            </Text>
            <Button 
              mode="contained" 
              onPress={handleBusinessRegistration}
              style={styles.registrationButton}
              contentStyle={styles.registrationButtonContent}
            >
              Register Business
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Office Creation Prompt Card */}
      {currentBusiness && hasOffices === false && !isCheckingOffices && (
        <Card style={styles.promptCard}>
          <Card.Content style={styles.promptContent}>
            <View style={styles.promptIcon}>
              <Ionicons name="business-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.promptTitle}>Create Your First Office</Text>
            <Text style={styles.promptDescription}>
              You haven't created any offices yet. Add an office to start managing your business operations.
            </Text>
            <Button 
              mode="contained" 
              onPress={() => router.push('/business/office-registration')}
              style={styles.promptButton}
              contentStyle={styles.promptButtonContent}
            >
              Add Office
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* PARTNER_ADMIN without business message */}
      {user?.role === 'PARTNER_ADMIN' && !currentBusiness && (
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

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.warning} />
            </View>
            <Text style={styles.statNumber}>{stats.newCount}</Text>
            <Text style={styles.statLabel}>New Orders</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
            </View>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statIcon}>
              <Ionicons name="cash-outline" size={20} color={theme.colors.secondary} />
            </View>
            <Text style={styles.statNumber}>${stats.totalRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <Card style={styles.ordersCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {recentOrders.slice(0, 5).map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
                  <Text style={styles.orderCustomer}>{order.customerName}</Text>
                  <Text style={styles.orderItems}>{order.items.length} items</Text>
                </View>
                <View style={styles.orderActions}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                  </View>
                  {order.status === 'pending' && (
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => handleAcceptOrder(order.id)}
                    >
                      <Text style={styles.actionBtnText}>Accept</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'confirmed' && (
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => handleStartOrder(order.id)}
                    >
                      <Text style={styles.actionBtnText}>Start</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* No Orders */}
      {recentOrders.length === 0 && currentBusiness && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={48} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No Active Orders</Text>
            <Text style={styles.emptyDescription}>
              You don't have any active orders at the moment. New orders will appear here.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
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
  registrationCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  registrationContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  registrationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  registrationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  registrationDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  registrationButton: {
    borderRadius: 8,
  },
  registrationButtonContent: {
    paddingVertical: 8,
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
  ordersCard: {
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
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  orderCustomer: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  orderItems: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  orderActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  actionBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});