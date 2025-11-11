import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { Badge, Button, Card, Chip, IconButton, Text } from 'react-native-paper';
import { useBusinessStore } from '../../stores/businessStore';
import { useUserStore } from '../../stores/userStore';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

interface ScheduleItem {
  id: string;
  orderId: string;
  time: string;
  type: 'pickup' | 'delivery' | 'processing';
  status: string;
  customer: string;
  address: string;
  priority: 'urgent' | 'high' | 'normal';
  driver?: string;
  items: number;
  amount: number;
  notes?: string;
}

export default function ScheduleScreen() {
  const [dayOffset, setDayOffset] = useState(0);
  const [filter, setFilter] = useState('All Orders');
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const { 
    orders, 
    temporaryAssignments, 
    fetchStaffOrders, 
    fetchTemporaryAssignments, 
    updateOrderStatus,
    isLoading 
  } = useBusinessStore();
  const { user } = useUserStore();

  const dateLabel = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    const label = d.toLocaleString(undefined, { month: 'short', day: '2-digit' });
    return `${dayOffset === 0 ? 'Today' : dayOffset === -1 ? 'Yesterday' : d.toLocaleDateString()} : ${label}`;
  }, [dayOffset]);

  // Create schedule items from orders and assignments
  const scheduleItems: ScheduleItem[] = useMemo(() => {
    const items: ScheduleItem[] = [];
    
    // Add orders based on their status
    orders.forEach(order => {
      const preferredPickupTime = new Date(order.time || order.createdAt);
      const preferredDeliveryTime = new Date(order.time || order.createdAt);
      
      // Determine if order is overdue
      const now = new Date();
      const isOverdue = (order.status === 'AWAITING_PICKUP' && preferredPickupTime < now) ||
                      (order.status === 'READY_FOR_DELIVERY' && preferredDeliveryTime < now);
      
      // Add pickup schedule item
      if (['AWAITING_PICKUP', 'PICKED_UP'].includes(order.status)) {
        items.push({
          id: `pickup-${order.id}`,
          orderId: order.id,
          time: preferredPickupTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          type: 'pickup',
          status: order.status,
          customer: order.customerName || 'Unknown Customer',
          address: order.location ? `${order.location.lat}, ${order.location.lng}` : 'Address not specified',
          priority: isOverdue ? 'urgent' : 'normal',
          items: order.items?.length || 0,
          amount: order.price || 0,
          notes: undefined
        });
      }
      
      // Add delivery schedule item
      if (['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(order.status)) {
        items.push({
          id: `delivery-${order.id}`,
          orderId: order.id,
          time: preferredDeliveryTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          type: 'delivery',
          status: order.status,
          customer: order.customerName || 'Unknown Customer',
          address: order.location ? `${order.location.lat}, ${order.location.lng}` : 'Address not specified',
          priority: isOverdue ? 'urgent' : 'normal',
          items: order.items?.length || 0,
          amount: order.price || 0,
          notes: undefined
        });
      }
      
      // Add processing schedule item
      if (['IN_CLEANING'].includes(order.status)) {
        items.push({
          id: `processing-${order.id}`,
          orderId: order.id,
          time: new Date(order.updatedAt).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          type: 'processing',
          status: order.status,
          customer: order.customerName || 'Unknown Customer',
          address: 'In Processing',
          priority: 'normal',
          items: order.items?.length || 0,
          amount: order.price || 0,
          notes: undefined
        });
      }
    });

    // Sort by time
    return items.sort((a, b) => {
      const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
      const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
      return timeA - timeB;
    });
  }, [orders]);

  // Filter schedule items
  const filteredItems = useMemo(() => {
    if (filter === 'All Orders') return scheduleItems;
    if (filter === 'Pickups') return scheduleItems.filter(item => item.type === 'pickup');
    if (filter === 'Deliveries') return scheduleItems.filter(item => item.type === 'delivery');
    if (filter === 'Washing') return scheduleItems.filter(item => item.type === 'processing');
    if (filter === 'Overdue') return scheduleItems.filter(item => item.priority === 'urgent');
    return scheduleItems;
  }, [scheduleItems, filter]);

  // Daily summary statistics
  const dailyStats = useMemo(() => {
    const todayItems = scheduleItems;
    return {
      total: todayItems.length,
      pickups: todayItems.filter(item => item.type === 'pickup').length,
      deliveries: todayItems.filter(item => item.type === 'delivery').length,
      washing: todayItems.filter(item => item.type === 'processing').length,
      overdue: todayItems.filter(item => item.priority === 'urgent').length,
      completed: orders.filter(order => order.status === 'DELIVERED').length
    };
  }, [scheduleItems, orders]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStaffOrders(),
        fetchTemporaryAssignments(user?.officeId || '')
      ]);
    } catch (error) {
      console.error('Error refreshing schedule:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      await updateOrderStatus(orderId, newStatus, `Status updated to ${newStatus}`);
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AWAITING_PICKUP': return theme.colors.warning;
      case 'PICKED_UP': return theme.colors.info;
      case 'IN_CLEANING': return theme.colors.primary;
      case 'READY_FOR_DELIVERY': return theme.colors.success;
      case 'OUT_FOR_DELIVERY': return theme.colors.secondary;
      case 'DELIVERED': return theme.colors.success;
      default: return theme.colors.text;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AWAITING_PICKUP': return 'Awaiting Pickup';
      case 'PICKED_UP': return 'Picked Up';
      case 'IN_CLEANING': return 'In Cleaning';
      case 'READY_FOR_DELIVERY': return 'Ready for Delivery';
      case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
      case 'DELIVERED': return 'Delivered';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return theme.colors.error;
      case 'high': return theme.colors.warning;
      default: return theme.colors.success;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pickup': return 'arrow-down-circle';
      case 'delivery': return 'arrow-up-circle';
      case 'processing': return 'refresh-circle';
      default: return 'time';
    }
  };

  const renderScheduleItem = (item: ScheduleItem) => (
    <Card key={item.id} style={styles.scheduleCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.itemHeader}>
          <View style={styles.timeContainer}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <Badge 
              style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}
              size={8}
            />
          </View>
          <View style={styles.typeContainer}>
            <View style={[styles.typeIconContainer, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Ionicons 
                name={getTypeIcon(item.type)} 
                size={20} 
                color={getStatusColor(item.status)} 
              />
            </View>
            <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.customerName}>{item.customer}</Text>
          <Text style={styles.addressText}>{item.address}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.itemMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="cube-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{item.items} items</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>${item.amount}</Text>
          </View>
        </View>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        {item.status === 'AWAITING_PICKUP' && (
          <Button 
            mode="contained" 
            onPress={() => handleStatusUpdate(item.orderId, 'PICKED_UP')}
            loading={updatingOrder === item.orderId}
            disabled={updatingOrder === item.orderId}
            style={styles.actionButton}
            labelStyle={styles.actionButtonText}
            icon="check"
          >
            Mark Picked Up
          </Button>
        )}
        {item.status === 'PICKED_UP' && (
          <Button 
            mode="contained" 
            onPress={() => handleStatusUpdate(item.orderId, 'IN_CLEANING')}
            loading={updatingOrder === item.orderId}
            disabled={updatingOrder === item.orderId}
            style={styles.actionButton}
            labelStyle={styles.actionButtonText}
            icon="refresh"
          >
            Start Cleaning
          </Button>
        )}
        {item.status === 'IN_CLEANING' && (
          <Button 
            mode="contained" 
            onPress={() => handleStatusUpdate(item.orderId, 'READY_FOR_DELIVERY')}
            loading={updatingOrder === item.orderId}
            disabled={updatingOrder === item.orderId}
            style={styles.actionButton}
            labelStyle={styles.actionButtonText}
            icon="check"
          >
            Mark Ready
          </Button>
        )}
        {item.status === 'READY_FOR_DELIVERY' && (
          <Button 
            mode="contained" 
            onPress={() => handleStatusUpdate(item.orderId, 'OUT_FOR_DELIVERY')}
            loading={updatingOrder === item.orderId}
            disabled={updatingOrder === item.orderId}
            style={styles.actionButton}
            labelStyle={styles.actionButtonText}
            icon="truck"
          >
            Out for Delivery
          </Button>
        )}
        <Button 
          mode="outlined" 
          style={styles.viewButton}
          labelStyle={styles.viewButtonText}
          icon="eye"
        >
          View Details
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Schedule</Text>
        
        <View style={styles.dateNavigation}>
          <IconButton icon="chevron-left" onPress={() => setDayOffset((v) => v - 1)} />
          <Text style={styles.dateLabel}>{dateLabel}</Text>
          <IconButton icon="chevron-right" onPress={() => setDayOffset((v) => v + 1)} />
          <IconButton icon="calendar" onPress={() => setDayOffset(0)} />
        </View>
      </View>

      {/* Daily Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statIcon}>
                <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.statNumber}>{dailyStats.total}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statIcon}>
                <Ionicons name="arrow-down-outline" size={20} color={theme.colors.warning} />
              </View>
              <Text style={styles.statNumber}>{dailyStats.pickups}</Text>
              <Text style={styles.statLabel}>Pickups</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statIcon}>
                <Ionicons name="arrow-up-outline" size={20} color={theme.colors.success} />
              </View>
              <Text style={styles.statNumber}>{dailyStats.deliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statIcon}>
                <Ionicons name="refresh-outline" size={20} color={theme.colors.info} />
              </View>
              <Text style={styles.statNumber}>{dailyStats.washing}</Text>
              <Text style={styles.statLabel}>Washing</Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['All Orders', 'Pickups', 'Deliveries', 'Washing', 'Overdue'].map((filterType) => (
          <Chip 
            key={filterType} 
            selected={filter === filterType} 
            onPress={() => setFilter(filterType)}
            style={styles.filterChip}
          >
            {filterType}
          </Chip>
        ))}
      </ScrollView>

      {/* Schedule Items */}
      <View style={styles.scheduleContainer}>
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading schedule...</Text>
          </View>
        ) : filteredItems.length > 0 ? (
          filteredItems.map(renderScheduleItem)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.text} />
            <Text style={styles.emptyTitle}>No {filter.toLowerCase()} scheduled</Text>
            <Text style={styles.emptyDescription}>
              {filter === 'All Orders' 
                ? 'No orders scheduled for this day'
                : `No ${filter.toLowerCase()} found for this day`
              }
            </Text>
            <Button 
              mode="contained" 
              onPress={onRefresh}
              style={styles.refreshButton}
            >
              Refresh
            </Button>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginHorizontal: 8,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '500',
  },
  filterContainer: {
    marginVertical: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  scheduleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  scheduleCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 16,
  },
  cardContent: {
    padding: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  priorityBadge: {
    borderRadius: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  itemDetails: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  cardActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flex: 1.2,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewButton: {
    flex: 0.8,
    borderRadius: 12,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    paddingHorizontal: 24,
  },
});
