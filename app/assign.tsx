import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Card, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import { useOrders } from '../context/OrdersContext';
import { assignDriver, Driver, fetchAvailableDrivers } from '../services/drivers';

export default function AssignDriverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { acceptOrder, markWaitingDelivery } = useOrders();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Driver | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    fetchAvailableDrivers('pickup').then(setDrivers);
  }, []);

  const filtered = useMemo(
    () => drivers.filter((d) => d.name.toLowerCase().includes(query.toLowerCase())),
    [drivers, query],
  );

  const handleAssign = async () => {
    if (!id || !selected) return;
    // Optimistic local updates
    acceptOrder(id);
    markWaitingDelivery(id);
    setConfirmVisible(false);
    router.back();
    try {
      await assignDriver(String(id), selected.id, 'pickup');
    } catch {}
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>Search for driver</Text>
      <TextInput mode="outlined" placeholder="Search driver" value={query} onChangeText={setQuery} />
      <FlatList
        style={{ marginTop: 12 }}
        data={filtered}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <Card.Title title={item.name} subtitle={item.phone ?? ''} left={() => <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' }} />} />
            <Card.Actions>
              <Button mode="contained" onPress={() => { setSelected(item); setConfirmVisible(true); }}>Assign</Button>
            </Card.Actions>
          </Card>
        )}
      />

      <Portal>
        <Dialog visible={confirmVisible} onDismiss={() => setConfirmVisible(false)}>
          <Dialog.Title>Confirm assignment</Dialog.Title>
          <Dialog.Content>
            <Text>
              Confirm order #{String(id)} to {selected?.name}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleAssign}>Confirm</Button>
            <Button onPress={() => setConfirmVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}


