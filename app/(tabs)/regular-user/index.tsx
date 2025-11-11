import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useBusinessStore, useUserAcceptedOrders } from '../../../stores/businessStore';
import { useUserStore } from '../../../stores/userStore';
import { theme } from '../../../styles/theme';

const { width } = Dimensions.get('window');

export default function OrdersScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { logout } = useUserStore();
  const orders = useBusinessStore((state) => state.orders);
  const userAcceptedOrders = useUserAcceptedOrders();
  const { fetchStaffOrders, acceptOrder, updateOrderStatus, fetchUserAcceptedOrders } = useBusinessStore();
  const temporaryAssignments = useBusinessStore((state) => state.temporaryAssignments);
  const { fetchTemporaryAssignments } = useBusinessStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'available' | 'accepted' | 'completed'>('available');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'loading'>('loading');

  // Fetch orders and temporary assignments when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        try {
          console.log('🔍 Orders Screen: User data:', {
            userId: user?.id,
            officeId: user?.officeId,
            businessId: user?.businessId,
            role: user?.role
          });
          
          await fetchStaffOrders();
          console.log('✅ Orders Screen: Orders loaded successfully');
          
          // Fetch user accepted orders using user's ID
          if (user?.id) {
            console.log('🔍 Orders Screen: Fetching user accepted orders for userId:', user.id);
            await fetchUserAcceptedOrders(user.id);
            console.log('✅ Orders Screen: User accepted orders loaded successfully for user:', user.id);
          } else {
            console.log('ℹ️ Orders Screen: No userId available - skipping user accepted orders fetch');
          }
          
          // Fetch temporary assignments using user's officeId
          if (user?.officeId) {
            console.log('🔍 Orders Screen: Fetching temporary assignments for officeId:', user.officeId);
            await fetchTemporaryAssignments(user.officeId);
            console.log('✅ Orders Screen: Temporary assignments loaded successfully for office:', user.officeId);
          } else {
            console.log('ℹ️ Orders Screen: No officeId available - skipping temporary assignments fetch');
          }
        } catch (error) {
          console.error('❌ Orders Screen: Failed to load data:', error);
        }
      }
    };

    loadData();
  }, [isAuthenticated, fetchStaffOrders, fetchTemporaryAssignments, fetchUserAcceptedOrders, user?.officeId, user?.id]);

  // Memoize filtered data
  const filteredData = useMemo(() => {
    if (filter === 'available') {
      // Available orders: CREATED orders + available temporary assignments
      const createdOrders = orders.filter((o: any) => o.status === 'CREATED');
      const availableAssignments = temporaryAssignments.filter((a: any) => !a.isAccepted && new Date(a.expiresAt) > new Date());
      return [...createdOrders, ...availableAssignments];
    } else if (filter === 'accepted') {
      // Accepted orders: Show user's accepted orders from the API
      return userAcceptedOrders;
    } else if (filter === 'completed') {
      // Completed orders: DELIVERED orders from user accepted orders
      return userAcceptedOrders.filter((o: any) => o.status === 'DELIVERED');
    } else {
      // Fallback: return all active orders
      return orders.filter((o: any) => ['CREATED', 'AWAITING_PICKUP', 'PICKED_UP', 'IN_CLEANING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(o.status));
    }
  }, [orders, temporaryAssignments, userAcceptedOrders, filter]);

  const handleAcceptOrder = useCallback(async (orderId: string) => {
    if (!user?.officeId) {
      console.error('❌ Orders Screen: No officeId available for order acceptance');
      return;
    }
    
    setModalType('loading');
    setModalMessage('Accepting order...');
    setShowModal(true);
    
    try {
      await acceptOrder(orderId, user.officeId);
      console.log('✅ Orders Screen: Order accepted successfully:', orderId);
      
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
      console.error('❌ Orders Screen: Failed to accept order:', error);
      setModalType('error');
      setModalMessage('Failed to accept order. Please try again.');
    }
  }, [acceptOrder, user?.officeId, fetchStaffOrders, fetchTemporaryAssignments]);


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
      console.error('❌ Orders Screen: No officeId available for order acceptance');
      return;
    }
    
    setModalType('loading');
    setModalMessage('Accepting order...');
    setShowModal(true);
    
    try {
      // Use the orderId from the assignment to accept the order
      await acceptOrder(assignment.orderId, user.officeId);
      console.log('✅ Orders Screen: Order accepted successfully:', assignment.orderId);
      
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
      console.error('❌ Orders Screen: Failed to accept order:', error);
      setModalType('error');
      setModalMessage('Failed to accept order. Please try again.');
    }
  }, [acceptOrder, user?.officeId, fetchStaffOrders, fetchTemporaryAssignments]);

  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: string, notes: string) => {
    setModalType('loading');
    setModalMessage(`Updating order status to ${getStatusText(status)}...`);
    setShowModal(true);
    
    try {
      await updateOrderStatus(orderId, status, notes);
      console.log('✅ Orders Screen: Order status updated successfully:', orderId, 'to:', status);
      
      // Show success in modal
      setModalType('success');
      setModalMessage(`Order status updated to ${getStatusText(status)} successfully!`);
      
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
      console.error('❌ Orders Screen: Failed to update order status:', error);
      setModalType('error');
      setModalMessage('Failed to update order status. Please try again.');
    }
  }, [updateOrderStatus, fetchStaffOrders, fetchTemporaryAssignments, user?.officeId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isAuthenticated) {
      try {
        await fetchStaffOrders();
        
        // Fetch user accepted orders using user's ID
        if (user?.id) {
          await fetchUserAcceptedOrders(user.id);
        } else {
          console.log('ℹ️ Orders Screen: No userId available - skipping user accepted orders refresh');
        }
        
        // Fetch temporary assignments using user's officeId
        if (user?.officeId) {
          await fetchTemporaryAssignments(user.officeId);
        } else {
          console.log('ℹ️ Orders Screen: No officeId available - skipping temporary assignments refresh');
        }
      } catch (error) {
        console.error('Failed to refresh data:', error);
      }
    }
    setTimeout(() => setRefreshing(false), 1000);
  }, [isAuthenticated, fetchStaffOrders, fetchTemporaryAssignments, fetchUserAcceptedOrders, user?.officeId, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return theme.colors.info;
      case 'AWAITING_PICKUP': return theme.colors.warning;
      case 'PICKED_UP': return theme.colors.primary;
      case 'IN_CLEANING': return theme.colors.primary;
      case 'READY_FOR_DELIVERY': return theme.colors.success;
      case 'OUT_FOR_DELIVERY': return theme.colors.info;
      case 'DELIVERED': return theme.colors.success;
      case 'CANCELED': return theme.colors.error;
      case 'RETURNED': return theme.colors.error;
      case 'TEMPORARILY_ASSIGNED': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CREATED': return 'Created';
      case 'AWAITING_PICKUP': return 'Awaiting Pickup';
      case 'PICKED_UP': return 'Picked Up';
      case 'IN_CLEANING': return 'In Cleaning';
      case 'READY_FOR_DELIVERY': return 'Ready for Delivery';
      case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELED': return 'Canceled';
      case 'RETURNED': return 'Returned';
      case 'TEMPORARILY_ASSIGNED': return 'Available';
      default: return status;
    }
  };

  const renderOrderItem = (item: any, isAssignment: boolean = false) => {
    const itemId = isAssignment ? item.id : item.id;
    const customerName = isAssignment ? item.order.customer.user.fullName : item.customerName;
    const itemsCount = isAssignment ? item.order.items?.length || 0 : item.items?.length || 0;
    const status = isAssignment ? item.order.status : item.status;
    const totalAmount = isAssignment ? item.order.totalAmount : item.price;
    const createdAt = isAssignment ? item.createdAt : item.createdAt;

    // Get appropriate icon for the item type
    const getItemIcon = () => {
      if (isAssignment) return 'briefcase-outline';
      switch (status) {
        case 'pending': return 'time-outline';
        case 'confirmed': return 'checkmark-circle-outline';
        case 'in_progress': return 'play-circle-outline';
        case 'ready': return 'checkmark-done-circle-outline';
        case 'delivered': return 'checkmark-circle';
        default: return 'cube-outline';
      }
    };

    // Get priority indicator
    const getPriorityIndicator = () => {
      if (isAssignment) {
        const hoursUntilExpiry = (new Date(item.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
        if (hoursUntilExpiry < 2) return { color: theme.colors.error, text: 'Urgent' };
        if (hoursUntilExpiry < 6) return { color: theme.colors.warning, text: 'Soon' };
        return null;
      }
      return null;
    };

    const priority = getPriorityIndicator();

    return (
      <View key={itemId} style={styles.orderItemCard}>
        <View style={styles.orderItemHeader}>
          <View style={styles.orderItemIcon}>
            <Ionicons name={getItemIcon()} size={24} color={getStatusColor(status)} />
          </View>
          <View style={styles.orderItemInfo}>
            <View style={styles.orderItemTitleRow}>
              <Text style={styles.orderItemTitle}>
                {isAssignment ? 'Assignment' : 'Order'} #{itemId.slice(-6)}
              </Text>
              {priority && (
                <View style={[styles.priorityBadge, { backgroundColor: priority.color }]}>
                  <Text style={styles.priorityText}>{priority.text}</Text>
                </View>
              )}
            </View>
            <Text style={styles.orderCustomer}>{customerName}</Text>
            <View style={styles.orderItemMeta}>
              <View style={styles.orderMetaItem}>
                <Ionicons name="cube-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.orderMetaText}>{itemsCount} items</Text>
              </View>
              {totalAmount && (
                <View style={styles.orderMetaItem}>
                  <Ionicons name="cash-outline" size={14} color={theme.colors.success} />
                  <Text style={styles.orderPrice}>TZS {totalAmount?.toLocaleString()}</Text>
                </View>
              )}
            </View>
            {isAssignment && (
              <View style={styles.orderMetaItem}>
                <Ionicons name="time-outline" size={14} color={theme.colors.warning} />
                <Text style={styles.orderExpiry}>
                  Expires: {new Date(item.expiresAt).toLocaleDateString()} at {new Date(item.expiresAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.orderItemFooter}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{getStatusText(status)}</Text>
          </View>
          <View style={styles.actionButtons}>
            {isAssignment ? (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => handleAcceptTempAssignment(item)}
              >
                <Ionicons name="checkmark-outline" size={16} color="white" />
                <Text style={styles.actionBtnText}>Accept</Text>
              </TouchableOpacity>
            ) : (
              <>
                {status === 'CREATED' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleAcceptOrder(itemId)}
                  >
                    <Ionicons name="checkmark-outline" size={16} color="white" />
                    <Text style={styles.actionBtnText}>Accept</Text>
                  </TouchableOpacity>
                )}
                {status === 'AWAITING_PICKUP' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.startBtn]}
                    onPress={() => handleUpdateOrderStatus(itemId, 'PICKED_UP', 'Order picked up from customer location')}
                  >
                    <Ionicons name="car-outline" size={16} color="white" />
                    <Text style={styles.actionBtnText}>Picked Up</Text>
                  </TouchableOpacity>
                )}
                {status === 'PICKED_UP' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.startBtn]}
                    onPress={() => handleUpdateOrderStatus(itemId, 'IN_CLEANING', 'Order received and cleaning started')}
                  >
                    <Ionicons name="shirt-outline" size={16} color="white" />
                    <Text style={styles.actionBtnText}>Start Cleaning</Text>
                  </TouchableOpacity>
                )}
                {status === 'IN_CLEANING' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.completeBtn]}
                    onPress={() => handleUpdateOrderStatus(itemId, 'READY_FOR_DELIVERY', 'Cleaning completed, ready for delivery')}
                  >
                    <Ionicons name="checkmark-done-outline" size={16} color="white" />
                    <Text style={styles.actionBtnText}>Ready</Text>
                  </TouchableOpacity>
                )}
                {status === 'READY_FOR_DELIVERY' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.startBtn]}
                    onPress={() => handleUpdateOrderStatus(itemId, 'OUT_FOR_DELIVERY', 'Order out for delivery')}
                  >
                    <Ionicons name="car-sport-outline" size={16} color="white" />
                    <Text style={styles.actionBtnText}>Out for Delivery</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    );
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
                Orders Management
              </Text>
              <Text style={styles.subtitle}>
                Manage your laundry orders
              </Text>
            </View>
          </View>
        </View>

        {/* Smart Statistics Cards */}
        {/* <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{orders.length}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time-outline" size={20} color={theme.colors.warning} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {orders.filter((o: any) => ['pending', 'confirmed'].includes(o.status)).length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {orders.filter((o: any) => ['ready', 'delivered'].includes(o.status)).length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="briefcase-outline" size={20} color={theme.colors.info} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {temporaryAssignments.filter((a: any) => !a.isAccepted && new Date(a.expiresAt) > new Date()).length}
              </Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>
        </View> */}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {[
            { key: 'available', label: 'Available Orders' },
            { key: 'accepted', label: 'Accepted Orders' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                filter === tab.key && styles.filterTabActive
              ]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text style={[
                styles.filterTabText,
                filter === tab.key && styles.filterTabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Orders List */}
        {filteredData.length > 0 ? (
          <Card style={styles.ordersCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                {filter === 'available' ? 'Available Orders' : 
                 filter === 'accepted' ? 'Accepted Orders' : 
                 filter === 'completed' ? 'Completed Orders' : 'Orders'}
              </Text>
              {filteredData.map((item: any) => {
                const isAssignment = filter === 'available' && item.expiresAt; // Check if it's an assignment
                return renderOrderItem(item, isAssignment);
              })}
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <View style={styles.emptyIcon}>
                <Ionicons 
                  name={
                    filter === 'available' ? 'time-outline' :
                    filter === 'accepted' ? 'checkmark-circle-outline' :
                    filter === 'completed' ? 'checkmark-done-circle-outline' :
                    'list-outline'
                  } 
                  size={64} 
                  color={theme.colors.textSecondary} 
                />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'available' ? 'No Available Orders' :
                 filter === 'accepted' ? 'No Accepted Orders' :
                 filter === 'completed' ? 'No Completed Orders' :
                 'No Orders Available'}
              </Text>
              <Text style={styles.emptyDescription}>
                {filter === 'available' ? 'No orders are currently available for acceptance. Check back later for new assignments.' :
                 filter === 'accepted' ? 'No orders have been accepted yet. Accept some available orders to get started.' :
                 filter === 'completed' ? 'No orders have been completed yet. Complete some orders to see them here.' :
                 'No orders are currently available. Pull down to refresh and check for updates.'}
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={onRefresh}
              >
                <Ionicons name="refresh-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: 'white',
  },
  ordersCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  // Statistics Cards
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
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

  // Enhanced Order Item Cards
  orderItemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderItemHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  orderItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  orderCustomer: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  orderItemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  orderMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderMetaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  orderPrice: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  orderExpiry: {
    fontSize: 11,
    color: theme.colors.warning,
    fontWeight: '500',
  },
  orderItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
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
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  acceptBtn: {
    backgroundColor: theme.colors.success,
  },
  startBtn: {
    backgroundColor: theme.colors.primary,
  },
  completeBtn: {
    backgroundColor: theme.colors.info,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
