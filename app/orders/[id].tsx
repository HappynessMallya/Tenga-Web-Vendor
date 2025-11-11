import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useOrderStore } from '../../stores/orderStore';
import { theme } from '../../styles/theme';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const getOrderById = useOrderStore((state) => state.getOrderById);
  const updateOrder = useOrderStore((state) => state.updateOrder);
  const order = getOrderById(String(id));

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const handleAcceptOrder = async () => {
    try {
      await updateOrder(order.id, { status: 'confirmed' });
      Alert.alert('Success', 'Order accepted successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept order');
    }
  };

  const handleStartOrder = async () => {
    try {
      await updateOrder(order.id, { status: 'in_progress' });
      Alert.alert('Success', 'Order started successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to start order');
    }
  };

  const handleCompleteOrder = async () => {
    try {
      await updateOrder(order.id, { status: 'ready' });
      Alert.alert('Success', 'Order completed successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'confirmed': return theme.colors.secondary;
      case 'in_progress': return theme.colors.primary;
      case 'ready': return theme.colors.green;
      case 'delivered': return theme.colors.green;
      default: return theme.colors.grayMedium;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'in_progress': return 'refresh-outline';
      case 'ready': return 'checkmark-done-outline';
      case 'delivered': return 'checkmark-done-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return theme.colors.success;
      case 'pending': return theme.colors.warning;
      case 'failed': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Order Status Card */}
      <Card style={styles.statusCard}>
        <Card.Content style={styles.statusCardContent}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Text style={styles.orderNumber}>Order #{order.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Ionicons name={getStatusIcon(order.status)} size={16} color="white" />
                <Text style={styles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.orderDate}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Customer Information */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <View style={styles.customerDetails}>
              <View style={styles.customerDetailRow}>
                <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.customerDetailText}>{order.customerPhone}</Text>
              </View>
              <View style={styles.customerDetailRow}>
                <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.customerDetailText} numberOfLines={2}>
                  {order.customerAddress}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Order Items */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Ionicons name="cube-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Order Items</Text>
          </View>
          <View style={styles.itemsList}>
            {order.items.map((item, index) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetails}>
                    {item.quantity}x • {item.category} • {item.serviceType}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  TSh {(item.price * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Service Details */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Service Details</Text>
          </View>
          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailRow}>
              <Text style={styles.serviceDetailLabel}>Pickup Date</Text>
              <Text style={styles.serviceDetailValue}>
                {new Date(order.pickupDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <Text style={styles.serviceDetailLabel}>Delivery Date</Text>
              <Text style={styles.serviceDetailValue}>
                {new Date(order.deliveryDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <Text style={styles.serviceDetailLabel}>Payment Method</Text>
              <Text style={styles.serviceDetailValue}>
                {order.paymentMethod.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <Text style={styles.serviceDetailLabel}>Payment Status</Text>
              <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(order.paymentStatus) }]}>
                <Text style={styles.paymentStatusText}>
                  {order.paymentStatus.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Customer Notes */}
      {order.notes && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Customer Notes</Text>
            </View>
            <Text style={styles.notesText}>{order.notes}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Pricing Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Pricing Summary</Text>
          </View>
          <View style={styles.pricingSummary}>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Subtotal</Text>
              <Text style={styles.pricingValue}>
                TSh {order.totalAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Service Fee</Text>
              <Text style={styles.pricingValue}>TSh 0</Text>
            </View>
            <View style={[styles.pricingRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                TSh {order.totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {order.status === 'pending' && (
          <Button
            mode="contained"
            onPress={handleAcceptOrder}
            style={styles.actionButton}
            icon="check"
          >
            Accept Order
          </Button>
        )}
        {order.status === 'confirmed' && (
          <Button
            mode="contained"
            onPress={handleStartOrder}
            style={styles.actionButton}
            icon="play"
          >
            Start Order
          </Button>
        )}
        {order.status === 'in_progress' && (
          <Button
            mode="contained"
            onPress={handleCompleteOrder}
            style={styles.actionButton}
            icon="check-circle"
          >
            Mark as Ready
          </Button>
        )}
        {order.status === 'ready' && (
          <Button
            mode="contained"
            disabled
            style={styles.actionButton}
            icon="time"
          >
            Waiting for Delivery
          </Button>
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
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  placeholder: {
    width: 40,
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusCardContent: {
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamilyBold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: theme.typography.fontFamilyBold,
  },
  orderDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  customerInfo: {
    gap: 12,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  customerDetails: {
    gap: 8,
  },
  customerDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  customerDetailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
    fontFamily: theme.typography.fontFamily,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
    fontFamily: theme.typography.fontFamily,
  },
  itemDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  serviceDetails: {
    gap: 12,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  serviceDetailLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  serviceDetailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: theme.typography.fontFamilyBold,
  },
  notesText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    fontFamily: theme.typography.fontFamily,
  },
  pricingSummary: {
    gap: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pricingLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamilyBold,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamilyBold,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 50,
    fontFamily: theme.typography.fontFamily,
  },
});