import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBusinessStore } from '../../stores/businessStore';
import { useUserStore } from '../../stores/userStore';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

export default function StaffHomeScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { logout } = useUserStore();
  const orders = useBusinessStore((state) => state.orders);
  const { fetchStaffOrders, acceptOrder } = useBusinessStore();
  const temporaryAssignments = useBusinessStore((state) => state.temporaryAssignments);
  const { fetchTemporaryAssignments } = useBusinessStore();
  const currentBusiness = useBusinessStore((state) => state.currentBusiness);
  const offices = useBusinessStore((state) => state.offices);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'loading'>('loading');

  // Fetch staff orders and temporary assignments when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        try {
          console.log('🔍 Staff Home: User data:', {
            userId: user?.id,
            officeId: user?.officeId,
            businessId: user?.businessId,
            role: user?.role
          });
          
          await fetchStaffOrders();
          console.log('✅ Staff Home: Orders loaded successfully');
          
          // Fetch temporary assignments using user's officeId
          if (user?.officeId) {
            console.log('🔍 Staff Home: Fetching temporary assignments for officeId:', user.officeId);
            await fetchTemporaryAssignments(user.officeId);
            console.log('✅ Staff Home: Temporary assignments loaded successfully for office:', user.officeId);
          } else {
            console.log('ℹ️ Staff Home: No officeId available - skipping temporary assignments fetch');
          }
        } catch (error) {
          console.error('❌ Staff Home: Failed to load data:', error);
        }
      }
    };

    loadData();
  }, [isAuthenticated, fetchStaffOrders, fetchTemporaryAssignments, user?.officeId]);

  // Memoize order statistics
  const orderStats = useMemo(() => {
    const newCount = orders.filter((o) => o.status === 'pending').length;
    const inProgress = orders.filter((o) => o.status === 'in_progress' || o.status === 'confirmed').length;
    const completed = orders.filter((o) => o.status === 'delivered').length;
    const readyForPickup = orders.filter((o) => o.status === 'ready').length;
    
    return { newCount, inProgress, completed, readyForPickup };
  }, [orders]);

  // Memoize temporary assignments statistics
  const tempAssignmentStats = useMemo(() => {
    const availableCount = temporaryAssignments.filter((a) => !a.isAccepted).length;
    const acceptedCount = temporaryAssignments.filter((a) => a.isAccepted).length;
    const expiredCount = temporaryAssignments.filter((a) => new Date(a.expiresAt) < new Date()).length;
    
    return { availableCount, acceptedCount, expiredCount };
  }, [temporaryAssignments]);

  const recentOrders = useMemo(() => {
    return orders
      .filter((o) => ['pending', 'confirmed', 'in_progress', 'ready'].includes(o.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  const recentTempAssignments = useMemo(() => {
    return temporaryAssignments
      .filter((a) => !a.isAccepted && new Date(a.expiresAt) > new Date()) // Only available and not expired
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [temporaryAssignments]);


  const handleStartOrder = useCallback(async (orderId: string) => {
    const { updateOrder } = useBusinessStore.getState();
    try {
      await updateOrder(orderId, { status: 'in_progress' });
    } catch (error) {
      console.error('Failed to start order:', error);
    }
  }, []);

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    const { updateOrder } = useBusinessStore.getState();
    try {
      await updateOrder(orderId, { status: 'ready' });
    } catch (error) {
      console.error('Failed to complete order:', error);
    }
  }, []);

  const handleAcceptTempAssignment = useCallback(async (assignment: any) => {
    if (!user?.officeId) {
      console.error('❌ Staff Home: No officeId available for order acceptance');
      return;
    }
    
    setAcceptingOrderId(assignment.orderId);
    setModalType('loading');
    setModalMessage('Accepting order...');
    setShowModal(true);
    
    try {
      // Use the orderId from the assignment to accept the order
      await acceptOrder(assignment.orderId, user.officeId);
      console.log('✅ Staff Home: Order accepted successfully:', assignment.orderId);
      
      // Show success in modal
      setModalType('success');
      setModalMessage('Order accepted successfully! You can now start processing it.');
      
      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setShowModal(false);
      }, 2000);
      
      // Refresh data to show updated state
      await fetchStaffOrders();
      if (user?.officeId) {
        await fetchTemporaryAssignments(user.officeId);
      }
      
    } catch (error) {
      console.error('❌ Staff Home: Failed to accept order:', error);
      setModalType('error');
      setModalMessage('Failed to accept order. Please try again.');
    } finally {
      setAcceptingOrderId(null);
    }
  }, [acceptOrder, user?.officeId, fetchStaffOrders, fetchTemporaryAssignments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isAuthenticated) {
      try {
        await fetchStaffOrders();
        
        // Fetch temporary assignments using user's officeId
        if (user?.officeId) {
          await fetchTemporaryAssignments(user.officeId);
        } else {
          console.log('ℹ️ Staff Home: No officeId available - skipping temporary assignments refresh');
        }
      } catch (error) {
        console.error('Failed to refresh data:', error);
      }
    }
    setTimeout(() => setRefreshing(false), 1000);
  }, [isAuthenticated, fetchStaffOrders, fetchTemporaryAssignments, user?.officeId]);

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
              console.log('✅ Staff: Logout successful');
              // Navigation will be handled by the auth guard
            } catch (error) {
              console.error('❌ Staff: Logout failed:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  }, [logout]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'confirmed': return theme.colors.secondary;
      case 'in_progress': return theme.colors.primary;
      case 'ready': return theme.colors.success;
      case 'delivered': return theme.colors.success;
      case 'TEMPORARILY_ASSIGNED': return theme.colors.warning;
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
      case 'TEMPORARILY_ASSIGNED': return 'Available';
      default: return status;
    }
  }, []);

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
              {getGreeting()}, {user?.fullName || 'Staff Member'}!
            </Text>
            <Text style={styles.subtitle}>
              Manage your work orders and tasks
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

      {/* Business Info */}
      {currentBusiness && (
        <Card style={styles.businessCard}>
          <Card.Content>
            <View style={styles.businessHeader}>
              <View style={styles.businessIconContainer}>
                <Ionicons name="business" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{currentBusiness.name}</Text>
                <Text style={styles.businessRole}>Staff Member</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Today's Summary - Smart Statistics Cards */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cube-outline" size={20} color={theme.colors.text} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{orderStats.newCount + orderStats.inProgress + orderStats.completed}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="briefcase-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{orderStats.newCount + orderStats.inProgress}</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{orderStats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time-outline" size={20} color={theme.colors.warning} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {temporaryAssignments.filter((a: any) => !a.isAccepted && new Date(a.expiresAt) > new Date()).length}
              </Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>
        </View>
      </View>


      {/* No Office Assignment Message */}
      {!user?.officeId && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <View style={styles.emptyIcon}>
              <Ionicons name="business-outline" size={48} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No Office Assignment</Text>
            <Text style={styles.emptyDescription}>
              You haven't been assigned to any office yet. Contact your administrator to get assigned to an office.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/(tabs)/regular-user')}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="cube" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Manage Orders</Text>
                <Text style={styles.actionDescription}>View and manage all orders</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/(tabs)/reports')}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="bar-chart" size={24} color={theme.colors.warning} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Performance</Text>
                <Text style={styles.actionDescription}>View your work reports</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </Card.Content>
      </Card>


      {/* No Orders */}
      {recentOrders.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={48} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No Active Orders</Text>
            <Text style={styles.emptyDescription}>
              You don't have any active orders at the moment. Check back later for new tasks.
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
    
    {/* Order Acceptance Modal */}
    <Modal
      visible={showModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {modalType === 'loading' && (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          )}
          {modalType === 'success' && (
            <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
          )}
          {modalType === 'error' && (
            <Ionicons name="close-circle" size={48} color={theme.colors.error} />
          )}
          
          <Text style={styles.modalMessage}>{modalMessage}</Text>
          
          {modalType !== 'loading' && (
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: modalType === 'success' ? theme.colors.success : theme.colors.error }
              ]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
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
  businessRole: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  // Smart Statistics Cards for Today's Summary
  summaryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
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
  ordersCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
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
  orderPrice: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  orderExpiry: {
    fontSize: 11,
    color: theme.colors.warning,
    fontWeight: '500',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '80%',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    color: theme.colors.text,
    lineHeight: 22,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
