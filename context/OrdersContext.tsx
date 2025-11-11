import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

type Order = {
  id: string | number;
  customerName: string;
  type: string;
  status:
    | 'new'
    | 'accepted'
    | 'waiting_delivery'
    | 'in_progress'
    | 'completed'
    | 'rejected';
  time: string;
  price?: number;
  items?: Array<{ name: string; qty: number }>;
  location: { lat: number; lng: number };
};

type OrdersContextValue = {
  orders: Order[];
  refresh: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  acceptOrder: (id: string | number) => void;
  markWaitingDelivery: (id: string | number) => void;
  startCleaning: (id: string | number) => void;
  rejectOrder: (id: string | number) => void;
};

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  const refresh = useCallback(async () => {
    // TODO: replace with real API call
    const now = new Date();
    const mock: Order[] = [
      {
        id: '12345',
        customerName: 'Elisha',
        type: 'Wash & Fold, Ironing',
        status: 'waiting_delivery',
        time: now.toISOString(),
        price: 25000,
        items: [{ name: 'Shirts', qty: 6 }],
        location: { lat: -6.7924, lng: 39.2083 },
      },
      {
        id: '54321',
        customerName: 'Elijah Zakayo',
        type: 'Wash & Fold',
        status: 'new',
        time: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        price: 18000,
        items: [{ name: 'Pants', qty: 4 }],
        location: { lat: -6.8, lng: 39.27 },
      },
      {
        id: '67890',
        customerName: 'Revocatus Shayo',
        type: 'Wash & Fold, Dry cleaning',
        status: 'new',
        time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        price: 32000,
        items: [{ name: 'Suits', qty: 2 }],
        location: { lat: -6.76, lng: 39.22 },
      },
    ];
    setOrders(mock);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const getOrderById = useCallback((id: string) => orders.find((o) => String(o.id) === id), [orders]);

  const acceptOrder = useCallback((id: string | number) => {
    setOrders((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, status: 'accepted' } : o)));
    Toast.show({ type: 'success', text1: 'Order accepted' });
  }, []);

  const markWaitingDelivery = useCallback((id: string | number) => {
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(id) ? { ...o, status: 'waiting_delivery' } : o)),
    );
    Toast.show({ type: 'info', text1: 'Waiting for delivery' });
  }, []);

  const startCleaning = useCallback((id: string | number) => {
    setOrders((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, status: 'in_progress' } : o)));
    Toast.show({ type: 'success', text1: 'Cleaning started' });
  }, []);

  const rejectOrder = useCallback((id: string | number) => {
    setOrders((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, status: 'rejected' } : o)));
    Toast.show({ type: 'error', text1: 'Order rejected' });
  }, []);

  const value = useMemo(
    () => ({ orders, refresh, getOrderById, acceptOrder, markWaitingDelivery, startCleaning, rejectOrder }),
    [orders, refresh, getOrderById, acceptOrder, markWaitingDelivery, startCleaning, rejectOrder],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
};


