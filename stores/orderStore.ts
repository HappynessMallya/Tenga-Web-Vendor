import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { asyncStorage } from '../utils/storage';

// Order Types
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: 'wash' | 'dry_clean' | 'iron' | 'fold';
  serviceType: 'standard' | 'express' | 'premium';
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'mobile_money';
  deliveryDate: string;
  pickupDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// Order State Interface
interface OrderState {
  // Order Data
  orders: Order[];
  currentOrder: Order | null;
  orderStats: OrderStats | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedOrderId: string | null;
  
  // Actions
  setOrders: (orders: Order[]) => void;
  setCurrentOrder: (order: Order | null) => void;
  setOrderStats: (stats: OrderStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedOrderId: (id: string | null) => void;
  
  // Order Actions
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | null;
  
  // Statistics
  calculateStats: () => void;
  
  // Clear state
  clearState: () => void;
}

// Create async storage adapter
const asyncStorageAdapter = createJSONStorage(() => ({
  setItem: async (name: string, value: any) => {
    if (name === 'orderData') {
      await asyncStorage.saveBusiness(value);
    }
  },
  getItem: async (name: string) => {
    if (name === 'orderData') {
      return await asyncStorage.getBusiness();
    }
    return null;
  },
  removeItem: async (name: string) => {
    if (name === 'orderData') {
      await asyncStorage.clearAll();
    }
  },
}));

// Create order store with Zustand
export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      // Initial State
      orders: [],
      currentOrder: null,
      orderStats: null,
      isLoading: false,
      error: null,
      selectedOrderId: null,

      // Basic Setters
      setOrders: (orders: Order[]) => set({ orders }),
      setCurrentOrder: (currentOrder: Order | null) => set({ currentOrder }),
      setOrderStats: (orderStats: OrderStats | null) => set({ orderStats }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setSelectedOrderId: (selectedOrderId: string | null) => set({ selectedOrderId }),

      // Order Actions
      addOrder: (order: Order) => {
        const { orders } = get();
        set({ orders: [...orders, order] });
      },

      updateOrder: (orderId: string, updates: Partial<Order>) => {
        const { orders } = get();
        const updatedOrders = orders.map(order =>
          order.id === orderId ? { ...order, ...updates, updatedAt: new Date().toISOString() } : order
        );
        set({ orders: updatedOrders });
      },

      deleteOrder: (orderId: string) => {
        const { orders } = get();
        const filteredOrders = orders.filter(order => order.id !== orderId);
        set({ orders: filteredOrders });
      },

      getOrderById: (orderId: string) => {
        const { orders } = get();
        return orders.find(order => order.id === orderId) || null;
      },

      // Statistics Calculation
      calculateStats: () => {
        const { orders } = get();
        
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => 
          ['pending', 'confirmed', 'in_progress'].includes(order.status)
        ).length;
        const completedOrders = orders.filter(order => 
          order.status === 'delivered'
        ).length;
        
        const totalRevenue = orders.reduce((sum, order) => {
          return order.paymentStatus === 'paid' ? sum + order.totalAmount : sum;
        }, 0);
        
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const stats: OrderStats = {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue,
          averageOrderValue,
        };

        set({ orderStats: stats });
      },

      clearState: () => {
        set({
          orders: [],
          currentOrder: null,
          orderStats: null,
          isLoading: false,
          error: null,
          selectedOrderId: null,
        });
      },
    }),
    {
      name: 'order-store',
      storage: asyncStorageAdapter,
      partialize: (state) => ({
        orders: state.orders,
        orderStats: state.orderStats,
      }),
    }
  )
);

// Selectors for better performance
export const useOrders = () => useOrderStore((state) => state.orders);
export const useCurrentOrder = () => useOrderStore((state) => state.currentOrder);
export const useOrderStats = () => useOrderStore((state) => state.orderStats);
export const useOrderLoading = () => useOrderStore((state) => state.isLoading);
export const useOrderError = () => useOrderStore((state) => state.error);
export const useSelectedOrderId = () => useOrderStore((state) => state.selectedOrderId);

// Action selectors
export const useOrderActions = () => useOrderStore((state) => ({
  addOrder: state.addOrder,
  updateOrder: state.updateOrder,
  deleteOrder: state.deleteOrder,
  getOrderById: state.getOrderById,
  setCurrentOrder: state.setCurrentOrder,
  setSelectedOrderId: state.setSelectedOrderId,
  setError: state.setError,
}));

// Computed selectors
export const usePendingOrders = () => useOrderStore((state) => 
  state.orders.filter(order => ['pending', 'confirmed', 'in_progress'].includes(order.status))
);

export const useCompletedOrders = () => useOrderStore((state) => 
  state.orders.filter(order => order.status === 'delivered')
);

export const useOrdersByStatus = (status: Order['status']) => useOrderStore((state) => 
  state.orders.filter(order => order.status === status)
);

// Initialize with mock data
export const initializeOrderStore = () => {
  const { setOrders, calculateStats } = useOrderStore.getState();
  
  // Mock data for development
  const mockOrders: Order[] = [
    {
      id: '1',
      customerId: 'customer-1',
      customerName: 'John Doe',
      customerPhone: '+255123456789',
      customerAddress: '123 Main Street, Dar es Salaam',
      items: [
        { id: '1', name: 'Shirt', quantity: 3, price: 1500, category: 'wash', serviceType: 'standard' },
        { id: '2', name: 'Pants', quantity: 2, price: 2000, category: 'wash', serviceType: 'standard' },
      ],
      totalAmount: 3500,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      deliveryDate: '2024-01-15',
      pickupDate: '2024-01-14',
      notes: 'Handle with care',
      createdAt: '2024-01-13T10:00:00Z',
      updatedAt: '2024-01-13T10:00:00Z',
    },
    {
      id: '2',
      customerId: 'customer-2',
      customerName: 'Jane Smith',
      customerPhone: '+255987654321',
      customerAddress: '456 Oak Avenue, Dar es Salaam',
      items: [
        { id: '3', name: 'Dress', quantity: 1, price: 3000, category: 'dry_clean', serviceType: 'premium' },
      ],
      totalAmount: 3000,
      status: 'in_progress',
      paymentStatus: 'paid',
      paymentMethod: 'mobile_money',
      deliveryDate: '2024-01-16',
      pickupDate: '2024-01-15',
      createdAt: '2024-01-12T14:30:00Z',
      updatedAt: '2024-01-13T09:15:00Z',
    },
  ];

  setOrders(mockOrders);
};
