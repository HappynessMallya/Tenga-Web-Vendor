import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { useOrders } from '../../context/OrdersContext';

export default function OrdersScreen() {
  const { orders, refresh } = useOrders();
  const [filter, setFilter] = useState<'all' | 'received' | 'in_progress' | 'ready' | 'completed'>('all');
  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'received') return orders.filter((o) => o.status === 'waiting_delivery' || o.status === 'accepted');
    if (filter === 'in_progress') return orders.filter((o) => o.status === 'in_progress');
    if (filter === 'ready') return orders.filter((o) => o.status === 'waiting_delivery');
    return orders.filter((o) => o.status === 'completed');
  }, [orders, filter]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 8, marginTop: 52 }}>Orders</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
        {[
          { key: 'all', label: 'All orders' },
          { key: 'received', label: 'Received' },
          { key: 'in_progress', label: 'In progress' },
          { key: 'ready', label: 'Ready' },
          { key: 'completed', label: 'Completed' },
        ].map((t) => (
          <Chip key={t.key} selected={filter === (t.key as any)} onPress={() => setFilter(t.key as any)}>{t.label}</Chip>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={(o) => String(o.id)}
        refreshing={false}
        onRefresh={refresh}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <Card.Title title={item.customerName} right={() => <Text>Order #{item.id}</Text>} />
            <Card.Content>
              <Text>Service type: {item.type}</Text>
              <Text>Pickup time: {new Date(item.time).toLocaleString()}</Text>
              <Text>Delivery time: Tomorrow, 8:00-10:00PM</Text>
            </Card.Content>
            <Card.Actions style={{ gap: 4, justifyContent: 'space-between' }}>
              <Link href={{ pathname: '/orders/[id]', params: { id: String(item.id) } }} asChild>
                <Button mode="outlined">View Details</Button>
              </Link>
              <Button mode="contained" style={{ marginLeft: 8 }}>{item.status === 'in_progress' ? 'Continue' : 'Start cleaning'}</Button>
            </Card.Actions>
          </Card>
        )}
      />
    </View>
  );
}







