import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Business, businessService, Office, officeService, Order, StaffApiResponse, StaffAssignmentRequest, StaffCreationRequest, staffService, TemporaryAssignment, userOrdersService } from '../services/api';
import { asyncStorage } from '../utils/storage';

// Business State Interface
interface BusinessState {
  // Business Data
  businesses: Business[];
  currentBusiness: Business | null;
  offices: Office[];
  currentOffice: Office | null;
  staff: StaffApiResponse[];
  orders: Order[];
  temporaryAssignments: TemporaryAssignment[];
  userAcceptedOrders: Order[];
  
  // Login Credentials
  savedCredentials: {
    phoneNumber: string;
    password: string;
    businessName: string;
  } | null;
  
  // Current User BusinessId (to avoid circular dependency)
  currentUserBusinessId: string | null;
  
  // User-specific businessId mapping (userId -> businessId)
  userBusinessMapping: Record<string, string>;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedBusinessId: string | null;
  selectedOfficeId: string | null;
  
  // Location Data for Office Registration
  locationData: {
    latitude: string;
    longitude: string;
    city: string;
    country: string;
    streetName: string;
    houseNumber: string;
    postCode: string;
    landMark: string;
    accuracy?: number;
  } | null;
  
  // Actions
  setBusinesses: (businesses: Business[]) => void;
  setCurrentBusiness: (business: Business | null) => void;
  setOffices: (offices: Office[]) => void;
  setCurrentOffice: (office: Office | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedBusinessId: (id: string | null) => void;
  setSelectedOfficeId: (id: string | null) => void;
  saveCredentials: (credentials: { phoneNumber: string; password: string; businessName: string }) => void;
  clearCredentials: () => void;
  setCurrentUserBusinessId: (businessId: string | null) => void;
  setUserBusinessMapping: (userId: string, businessId: string) => void;
  getUserBusinessId: (userId: string) => string | null;
  
  // Location Data Actions
  setLocationData: (locationData: {
    latitude: string;
    longitude: string;
    city: string;
    country: string;
    streetName: string;
    houseNumber: string;
    postCode: string;
    landMark: string;
    accuracy?: number;
  } | null) => void;
  clearLocationData: () => void;
  
  // Business Actions
  addBusiness: (business: Business) => void;
  updateBusiness: (businessId: string, updates: Partial<Business>) => void;
  deleteBusiness: (businessId: string) => void;
  getBusinessById: (businessId: string) => Business | null;
  
  // Office Actions
  addOffice: (office: Office) => void;
  updateOffice: (officeId: string, updates: Partial<Office>) => void;
  deleteOffice: (officeId: string) => void;
  getOfficeById: (officeId: string) => Office | null;
  
  // Staff Actions
  setStaff: (staff: StaffApiResponse[]) => void;
  addStaff: (staff: StaffApiResponse) => void;
  updateStaff: (staffId: string, updates: Partial<StaffApiResponse>) => void;
  deleteStaff: (staffId: string) => void;
  getStaffById: (staffId: string) => StaffApiResponse | null;
  fetchBusinessStaff: (businessId: string) => Promise<void>;
  createStaff: (businessId: string, staffData: StaffCreationRequest) => Promise<any>;
  assignStaffToOffice: (businessId: string, officeId: string, assignmentData: StaffAssignmentRequest) => Promise<any>;
  
  // Orders Actions
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | null;
  fetchStaffOrders: () => Promise<void>;
  acceptOrder: (orderId: string, officeId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, notes?: string) => Promise<void>;
  
  // User Accepted Orders Actions
  fetchUserAcceptedOrders: (userId: string) => Promise<void>;
  setUserAcceptedOrders: (orders: Order[]) => void;
  
  // Temporary Assignments Actions
  setTemporaryAssignments: (assignments: TemporaryAssignment[]) => void;
  addTemporaryAssignment: (assignment: TemporaryAssignment) => void;
  updateTemporaryAssignment: (assignmentId: string, updates: Partial<TemporaryAssignment>) => void;
  deleteTemporaryAssignment: (assignmentId: string) => void;
  getTemporaryAssignmentById: (assignmentId: string) => TemporaryAssignment | null;
  fetchTemporaryAssignments: (officeId: string) => Promise<void>;
  acceptTemporaryAssignment: (assignmentId: string, officeId: string) => Promise<void>;
  getOfficesByBusinessId: (businessId: string) => Office[];
  
  // API Actions
  registerBusiness: (payload: {
    name: string;
    tinNumber: string;
    tinCertificate: string;
    servicePlanType: 'BASIC' | 'STANDARD' | 'PREMIUM';
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    ownerCountryCode: string;
    ownerId: string;
    description: string;
    businessLicense: string;
    taxCertificate: string;
    insuranceDocument: string;
    otherCertificates: string[];
    whatsappGroupLink?: string;
    website?: string;
    logo?: string;
  }) => Promise<{
    business: Business;
    partnerAdmin: {
      id: string;
      fullName: string;
      email: string;
      phoneNumber: string;
      countryCode: string;
      role: string;
      isNewUser: boolean;
      defaultPassword: string;
      isExistingPartnerAdmin: boolean;
    };
  }>;
  registerOffice: (businessId: string, payload: {
    name: string;
    address: {
      latitude: string;
      longitude: string;
      description: string;
      city: string;
      country: string;
      houseNumber: string;
      streetName: string;
      postCode: string;
      landMark: string;
      type: string;
      geoHash: string;
      images: string[];
    };
    isMainOffice: boolean;
    phoneNumber: string;
    email: string;
    managerName: string;
    capacity: number;
    isActive: boolean;
  }) => Promise<void>;
  fetchUserBusinesses: (userId: string) => Promise<void>;
  fetchBusinessOffices: (businessId: string) => Promise<void>;
  checkBusinessOffices: (businessId: string) => Promise<{ hasOffices: boolean; offices: Office[] }>;
  handlePartnerAdminLogin: (user: any) => Promise<void>;
  handleStaffLogin: (user: any) => Promise<void>;
  registerPartnerAdminCallback: () => void;
  
  // Clear state
  clearState: () => void;
}

// Create async storage adapter
const asyncStorageAdapter = createJSONStorage(() => ({
  setItem: async (name: string, value: any) => {
    if (name === 'businessData') {
      await asyncStorage.saveBusiness(value);
    } else if (name === 'officeData') {
      await asyncStorage.saveOffice(value);
    }
  },
  getItem: async (name: string) => {
    if (name === 'businessData') {
      return await asyncStorage.getBusiness();
    } else if (name === 'officeData') {
      return await asyncStorage.getOffice();
    }
    return null;
  },
  removeItem: async (name: string) => {
    if (name === 'businessData') {
      await asyncStorage.clearAll();
    } else if (name === 'officeData') {
      await asyncStorage.clearAll();
    }
  },
}));

// Create business store with Zustand
export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      // Initial State
      businesses: [],
      currentBusiness: null,
      offices: [],
      currentOffice: null,
      staff: [],
      orders: [],
      temporaryAssignments: [],
      userAcceptedOrders: [],
      savedCredentials: null,
      currentUserBusinessId: null,
      userBusinessMapping: {},
      isLoading: false,
      error: null,
      selectedBusinessId: null,
      selectedOfficeId: null,
      locationData: null,

      // Basic Setters
      setBusinesses: (businesses: Business[]) => set({ businesses }),
      setCurrentBusiness: (currentBusiness: Business | null) => set({ currentBusiness }),
      setOffices: (offices: Office[]) => set({ offices: Array.isArray(offices) ? offices : [] }),
      setCurrentOffice: (currentOffice: Office | null) => set({ currentOffice }),
      setStaff: (staff: StaffApiResponse[]) => set({ staff: Array.isArray(staff) ? staff : [] }),
      setOrders: (orders: Order[]) => set({ orders: Array.isArray(orders) ? orders : [] }),
      setTemporaryAssignments: (assignments: TemporaryAssignment[]) => set({ temporaryAssignments: Array.isArray(assignments) ? assignments : [] }),
      setUserAcceptedOrders: (orders: Order[]) => set({ userAcceptedOrders: Array.isArray(orders) ? orders : [] }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setSelectedBusinessId: (selectedBusinessId: string | null) => set({ selectedBusinessId }),
      setSelectedOfficeId: (selectedOfficeId: string | null) => set({ selectedOfficeId }),
      saveCredentials: (credentials: { phoneNumber: string; password: string; businessName: string }) => 
        set({ savedCredentials: credentials }),
      clearCredentials: () => set({ savedCredentials: null }),
      setCurrentUserBusinessId: (businessId: string | null) => set({ currentUserBusinessId: businessId }),
      setUserBusinessMapping: (userId: string, businessId: string) => 
        set((state) => ({ 
          userBusinessMapping: { 
            ...state.userBusinessMapping, 
            [userId]: businessId 
          } 
        })),
      getUserBusinessId: (userId: string) => {
        const state = get();
        return state.userBusinessMapping[userId] || null;
      },

      // Location Data Actions
      setLocationData: (locationData) => set({ locationData }),
      clearLocationData: () => set({ locationData: null }),

      // Business Actions
      addBusiness: (business: Business) => {
        const { businesses } = get();
        set({ businesses: [...businesses, business] });
      },

      updateBusiness: (businessId: string, updates: Partial<Business>) => {
        const { businesses } = get();
        const updatedBusinesses = businesses.map(business =>
          business.id === businessId ? { ...business, ...updates } : business
        );
        set({ businesses: updatedBusinesses });
      },

      deleteBusiness: (businessId: string) => {
        const { businesses } = get();
        const filteredBusinesses = businesses.filter(business => business.id !== businessId);
        set({ businesses: filteredBusinesses });
      },

      getBusinessById: (businessId: string) => {
        const { businesses } = get();
        return businesses.find(business => business.id === businessId) || null;
      },

      // Office Actions
      addOffice: (office: Office) => {
        const { offices } = get();
        set({ offices: [...offices, office] });
      },

      updateOffice: (officeId: string, updates: Partial<Office>) => {
        const { offices } = get();
        const updatedOffices = offices.map(office =>
          office.id === officeId ? { ...office, ...updates } : office
        );
        set({ offices: updatedOffices });
      },

      deleteOffice: (officeId: string) => {
        const { offices } = get();
        const filteredOffices = offices.filter(office => office.id !== officeId);
        set({ offices: filteredOffices });
      },

      getOfficeById: (officeId: string) => {
        const { offices } = get();
        return offices.find(office => office.id === officeId) || null;
      },

      getOfficesByBusinessId: (businessId: string) => {
        const { offices } = get();
        return offices.filter(office => office.businessId === businessId);
      },

      // Staff Actions
      addStaff: (staff: StaffApiResponse) => {
        const { staff: currentStaff } = get();
        set({ staff: [...currentStaff, staff] });
      },

      updateStaff: (staffId: string, updates: Partial<StaffApiResponse>) => {
        const { staff } = get();
        const updatedStaff = staff.map(s =>
          s.id === staffId ? { ...s, ...updates } : s
        );
        set({ staff: updatedStaff });
      },

      deleteStaff: (staffId: string) => {
        const { staff } = get();
        const filteredStaff = staff.filter(s => s.id !== staffId);
        set({ staff: filteredStaff });
      },

      getStaffById: (staffId: string) => {
        const { staff } = get();
        return staff.find(s => s.id === staffId) || null;
      },

      // Orders Actions
      addOrder: (order: Order) => {
        const { orders: currentOrders } = get();
        set({ orders: [...currentOrders, order] });
      },

      updateOrder: (orderId: string, updates: Partial<Order>) => {
        const { orders } = get();
        const updatedOrders = orders.map(o =>
          o.id === orderId ? { ...o, ...updates } : o
        );
        set({ orders: updatedOrders });
      },

      deleteOrder: (orderId: string) => {
        const { orders } = get();
        const filteredOrders = orders.filter(o => o.id !== orderId);
        set({ orders: filteredOrders });
      },

      getOrderById: (orderId: string) => {
        const { orders } = get();
        return orders.find(o => o.id === orderId) || null;
      },

      fetchStaffOrders: async () => {
        console.log('🔍 Business Store: Fetching staff orders');
        set({ isLoading: true, error: null });
        
        try {
          const response = await staffService.getStaffOrders();
          console.log('📊 Business Store: Staff orders response:', response);
          
          if (response.orders) {
            console.log('✅ Business Store: Setting staff orders:', response.orders);
            set({ orders: response.orders, isLoading: false });
          } else {
            console.error('❌ Business Store: Invalid staff orders response structure:', response);
            throw new Error('Invalid response structure');
          }
        } catch (error: any) {
          console.error('💥 Business Store: Fetch staff orders error:', error);
          set({
            orders: [], // Ensure orders is always an array
            isLoading: false,
            error: error.message || 'Failed to fetch staff orders',
          });
          throw error;
        }
      },

      acceptOrder: async (orderId: string, officeId: string) => {
        console.log('🔍 Business Store: Accepting order:', orderId, 'for office:', officeId);
        set({ isLoading: true, error: null });
        
        try {
          const response = await staffService.acceptOrder(orderId, officeId);
          console.log('✅ Business Store: Order acceptance successful:', response);
          
          // Update the order status in the local state
          const { orders } = get();
          const updatedOrders = orders.map(o =>
            o.id === orderId ? { ...o, status: 'AWAITING_PICKUP' } : o
          );
          set({ orders: updatedOrders, isLoading: false });
          
        } catch (error: any) {
          console.error('💥 Business Store: Accept order error:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to accept order',
          });
          throw error;
        }
      },

      updateOrderStatus: async (orderId: string, status: string, notes?: string) => {
        console.log('🔍 Business Store: Updating order status:', orderId, 'to:', status);
        set({ isLoading: true, error: null });
        
        try {
          const response = await staffService.updateOrderStatus(orderId, status, notes);
          console.log('✅ Business Store: Order status update successful:', response);
          
          // Update the order status in the local state
          const { orders } = get();
          const updatedOrders = orders.map(o =>
            o.id === orderId ? { ...o, status } : o
          );
          set({ orders: updatedOrders, isLoading: false });
          
        } catch (error: any) {
          console.error('💥 Business Store: Update order status error:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to update order status',
          });
          throw error;
        }
      },

      // User Accepted Orders Actions
      fetchUserAcceptedOrders: async (userId: string) => {
        console.log('🔍 Business Store: Fetching user accepted orders for user:', userId);
        set({ isLoading: true, error: null });
        
        try {
          const response = await userOrdersService.getUserOrders(userId);
          console.log('✅ Business Store: User accepted orders fetch successful:', response);
          
          if (response.orders) {
            set({ 
              userAcceptedOrders: response.orders, 
              isLoading: false, 
              error: null 
            });
            console.log('✅ Business Store: User accepted orders loaded:', response.orders.length, 'orders');
          } else {
            throw new Error('No orders found in response');
          }
        } catch (error: any) {
          console.error('❌ Business Store: Failed to fetch user accepted orders:', error);
          set({ 
            isLoading: false, 
            error: error.message || 'Failed to fetch user orders' 
          });
        }
      },

      // Temporary Assignments Actions
      addTemporaryAssignment: (assignment: TemporaryAssignment) => {
        const { temporaryAssignments: currentAssignments } = get();
        set({ temporaryAssignments: [...currentAssignments, assignment] });
      },

      updateTemporaryAssignment: (assignmentId: string, updates: Partial<TemporaryAssignment>) => {
        const { temporaryAssignments } = get();
        const updatedAssignments = temporaryAssignments.map(a =>
          a.id === assignmentId ? { ...a, ...updates } : a
        );
        set({ temporaryAssignments: updatedAssignments });
      },

      deleteTemporaryAssignment: (assignmentId: string) => {
        const { temporaryAssignments } = get();
        const filteredAssignments = temporaryAssignments.filter(a => a.id !== assignmentId);
        set({ temporaryAssignments: filteredAssignments });
      },

      getTemporaryAssignmentById: (assignmentId: string) => {
        const { temporaryAssignments } = get();
        return temporaryAssignments.find(a => a.id === assignmentId) || null;
      },

      fetchTemporaryAssignments: async (officeId: string) => {
        console.log('🔍 Business Store: Fetching temporary assignments for office:', officeId);
        set({ isLoading: true, error: null });
        
        try {
          const response = await staffService.getTemporaryAssignments(officeId);
          console.log('📊 Business Store: Temporary assignments response:', response);
          
          if (response.assignments) {
            console.log('✅ Business Store: Setting temporary assignments:', response.assignments);
            set({ temporaryAssignments: response.assignments, isLoading: false });
          } else {
            console.error('❌ Business Store: Invalid temporary assignments response structure:', response);
            throw new Error('Invalid response structure');
          }
        } catch (error: any) {
          console.error('💥 Business Store: Fetch temporary assignments error:', error);
          set({
            temporaryAssignments: [], // Ensure assignments is always an array
            isLoading: false,
            error: error.message || 'Failed to fetch temporary assignments',
          });
          throw error;
        }
      },

      acceptTemporaryAssignment: async (assignmentId: string, officeId: string) => {
        console.log('🔍 Business Store: Accepting temporary assignment:', assignmentId, 'for office:', officeId);
        set({ isLoading: true, error: null });
        
        try {
          const response = await staffService.acceptTemporaryAssignment(assignmentId, officeId);
          console.log('✅ Business Store: Temporary assignment acceptance successful:', response);
          
          // Update the assignment status in the local state
          const { temporaryAssignments } = get();
          const updatedAssignments = temporaryAssignments.map(a =>
            a.id === assignmentId ? { 
              ...a, 
              isAccepted: true, 
              acceptedByStaffId: null, // Will be set by the API response
              acceptedAt: new Date().toISOString()
            } : a
          );
          set({ temporaryAssignments: updatedAssignments, isLoading: false });
          
        } catch (error: any) {
          console.error('💥 Business Store: Accept temporary assignment error:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to accept temporary assignment',
          });
          throw error;
        }
      },

      // API Actions
      registerBusiness: async (payload: any) => {
        console.log('🚀 Business Store: Starting business registration');
        console.log('📋 Business Store: Payload received:', JSON.stringify(payload, null, 2));
        
        set({ isLoading: true, error: null });
        
        try {
          console.log('📡 Business Store: Calling businessService.registerBusiness');
          const response = await businessService.registerBusiness(payload);
          console.log('✅ Business Store: API response received:', JSON.stringify(response, null, 2));
          
          if (response.success && response.data) {
            console.log('💾 Business Store: Adding business to store');
            get().addBusiness(response.data.business);
            set({ currentBusiness: response.data.business, isLoading: false });
            
            // Save login credentials for easy access
            const credentials = {
              phoneNumber: response.data.partnerAdmin.phoneNumber,
              password: response.data.partnerAdmin.defaultPassword,
              businessName: response.data.business.name
            };
            get().saveCredentials(credentials);
            console.log('🔐 Business Store: Login credentials saved');
            
            // Store businessId for current user (to avoid circular dependency)
            get().setCurrentUserBusinessId(response.data.business.id);
            
            // Store businessId with partnerAdmin user ID for user-specific access
            const partnerAdminId = response.data.partnerAdmin.id;
            get().setUserBusinessMapping(partnerAdminId, response.data.business.id);
            
            console.log('💾 Business Store: BusinessId stored for current user:', response.data.business.id);
            console.log('👤 Business Store: BusinessId mapped to user:', partnerAdminId, '->', response.data.business.id);
            
            console.log('🎉 Business Store: Business registration completed successfully');
            
            // Return both business and partnerAdmin data
            return {
              business: response.data.business,
              partnerAdmin: response.data.partnerAdmin
            };
          } else {
            console.error('❌ Business Store: API response indicates failure:', response);
            throw new Error(response?.message || 'Business registration failed');
          }
        } catch (error: any) {
          console.error('💥 Business Store: Registration error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
          });
          set({
            isLoading: false,
            error: error.message || 'Business registration failed',
          });
          throw error;
        }
      },

      registerOffice: async (businessId: string, payload: any) => {
        console.log('🏢 Business Store: Starting office registration for business:', businessId);
        set({ isLoading: true, error: null });
        
        try {
          const response = await officeService.registerOffice(businessId, payload);
          
          // Handle the actual API response format: { message: "...", office: {...} }
          if (response.message && response.office) {
            console.log('✅ Business Store: Office registration successful:', response.office);
            get().addOffice(response.office);
            set({ currentOffice: response.office, isLoading: false });
          } else {
            console.error('❌ Business Store: Invalid response structure:', response);
            throw new Error('Office registration failed - invalid response format');
          }
        } catch (error: any) {
          console.error('💥 Business Store: Office registration error:', error);
          console.error('📊 Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          
          set({
            isLoading: false,
            error: error.message || 'Office registration failed',
          });
          throw error;
        }
      },

      fetchUserBusinesses: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await businessService.getUserBusinesses(userId);
          
          if (response.success && response.data) {
            set({ businesses: response.data, isLoading: false });
          } else {
            throw new Error(response?.message || 'Failed to fetch businesses');
          }
        } catch (error: any) {
          console.error('Fetch businesses error:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch businesses',
          });
          throw error;
        }
      },

      createStaff: async (businessId: string, staffData: StaffCreationRequest) => {
        console.log('👥 Business Store: Starting staff creation for business:', businessId);
        set({ isLoading: true, error: null });
        
        try {
          const response = await staffService.createStaff(businessId, staffData);
          
          if (response.message && response.user) {
            console.log('✅ Business Store: Staff creation successful:', response.user);
            // Refetch staff list to get the updated data in the correct format
            await get().fetchBusinessStaff(businessId);
            set({ isLoading: false });
            return response;
          } else {
            console.error('❌ Business Store: Invalid staff creation response structure:', response);
            throw new Error('Staff creation failed - invalid response format');
          }
        } catch (error: any) {
          console.error('💥 Business Store: Staff creation error:', error);
          console.error('📊 Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          
          set({
            isLoading: false,
            error: error.message || 'Staff creation failed',
          });
          throw error;
        }
      },

      fetchBusinessStaff: async (businessId: string) => {
        console.log('🔍 Business Store: Fetching staff for business:', businessId);
        
        // Check if current user has permission to view business staff
        // Import user store to check user role
        const { useUserStore } = require('./userStore');
        const user = useUserStore.getState().user;
        if (user?.role === 'STAFF') {
          console.log('ℹ️ STAFF user - skipping business staff fetch (insufficient permissions)');
          set({ staff: [], isLoading: false });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await staffService.getBusinessStaff(businessId);
          console.log('📊 Business Store: Fetch staff response:', response);
          
          // Handle the actual API response structure: { pagination: {...}, staff: [...] }
          if (response && response.staff) {
            console.log('✅ Business Store: Setting staff:', response.staff);
            set({ staff: response.staff, isLoading: false });
          } else {
            console.error('❌ Business Store: Invalid staff response structure:', response);
            throw new Error('Failed to fetch staff - invalid response format');
          }
        } catch (error: any) {
          console.error('💥 Business Store: Fetch staff error:', error);
          set({
            staff: [], // Ensure staff is always an array
            isLoading: false,
            error: error.message || 'Failed to fetch staff',
          });
          throw error;
        }
      },

      assignStaffToOffice: async (businessId: string, officeId: string, assignmentData: StaffAssignmentRequest) => {
        console.log('🔍 Business Store: Assigning staff to office:', { businessId, officeId, assignmentData });
        set({ isLoading: true, error: null });
        
        try {
          const response = await staffService.assignStaffToOffice(businessId, officeId, assignmentData);
          
          if (response.message && response.staff) {
            console.log('✅ Business Store: Staff assignment successful:', response.staff);
            
            // Update the staff member in the store with the new office assignment
            const { staff } = get();
            const updatedStaff = staff.map(s => 
              s.userId === assignmentData.userId 
                ? { ...s, officeId: response.staff.officeId, isContactPerson: response.staff.isContactPerson }
                : s
            );
            set({ staff: updatedStaff, isLoading: false });
            
            return response;
          } else {
            console.error('❌ Business Store: Invalid staff assignment response structure:', response);
            throw new Error('Staff assignment failed - invalid response format');
          }
        } catch (error: any) {
          console.error('💥 Business Store: Staff assignment error:', error);
          set({
            isLoading: false,
            error: error.message || 'Staff assignment failed',
          });
          throw error;
        }
      },

      fetchBusinessOffices: async (businessId: string) => {
        console.log('🔍 Business Store: Fetching offices for business:', businessId);
        
        // Check if current user has permission to view business offices
        // Import user store to check user role
        const { useUserStore } = require('./userStore');
        const user = useUserStore.getState().user;
        if (user?.role === 'STAFF') {
          console.log('ℹ️ STAFF user - skipping business offices fetch (insufficient permissions)');
          set({ offices: [], isLoading: false });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await officeService.getBusinessOffices(businessId);
          console.log('📊 Business Store: Fetch offices response:', response);
          
          if (response.success && response.data) {
            console.log('✅ Business Store: Setting offices:', response.data);
            // Extract offices array from nested response structure
            const officesData = response.data.offices || [];
            set({ offices: officesData, isLoading: false });
          } else {
            console.error('❌ Business Store: Invalid response structure:', response);
            throw new Error(response.error || 'Failed to fetch offices');
          }
        } catch (error: any) {
          console.error('💥 Business Store: Fetch offices error:', error);
          
          // If business is not active or access denied, set empty offices instead of throwing
          if (error.message?.includes('Business is not active') || 
              error.message?.includes('Access denied') || 
              error.message?.includes('Insufficient permissions')) {
            console.log('ℹ️ Business access denied or not active - setting empty offices');
            set({
              offices: [], // Set empty offices for inactive business
              isLoading: false,
              error: null, // Don't show error for inactive business
            });
            return; // Don't throw error
          }
          
          set({
            offices: [], // Ensure offices is always an array
            isLoading: false,
            error: error.message || 'Failed to fetch offices',
          });
          throw error;
        }
      },

      checkBusinessOffices: async (businessId: string) => {
        try {
          console.log('🔍 Business Store: Checking offices for business:', businessId);
          
          // Check if current user has permission to view business offices
          // Import user store to check user role
          const { useUserStore } = require('./userStore');
          const user = useUserStore.getState().user;
          if (user?.role === 'STAFF') {
            console.log('ℹ️ STAFF user - skipping business office check (insufficient permissions)');
            return { hasOffices: false, offices: [] };
          }
          
          const response = await businessService.checkBusinessOffices(businessId);
          
          if (response.success && response.data) {
            console.log('✅ Business Store: Office check completed:', response.data);
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to check offices');
          }
        } catch (error: any) {
          console.error('💥 Business Store: Office check error:', error);
          
          // If business is not active or access denied, return empty offices instead of throwing
          if (error.message?.includes('Business is not active') || 
              error.message?.includes('Access denied') || 
              error.message?.includes('Insufficient permissions')) {
            console.log('ℹ️ Business access denied or not active - returning empty offices');
            return { hasOffices: false, offices: [] };
          }
          
          throw error;
        }
      },

      handlePartnerAdminLogin: async (user: any) => {
        try {
          console.log('🔍 Business Store: Handling PARTNER_ADMIN login for user:', user.id);
          console.log('📋 User data:', {
            businessId: user.businessId,
            ownedBusinesses: user.ownedBusinesses?.length || 0,
            primaryBusiness: user.primaryBusiness?.name || 'None'
          });
          
          let businessToSet: Business | null = null;
          let businessIdToUse: string | null = null;
          
          // Priority 1: Use primaryBusiness from login response (most complete data)
          if (user.primaryBusiness) {
            businessToSet = {
              id: user.primaryBusiness.id,
              name: user.primaryBusiness.name,
              tinNumber: user.primaryBusiness.tinNumber,
              servicePlanType: user.primaryBusiness.servicePlanType,
              ownerName: user.primaryBusiness.ownerName,
              ownerEmail: user.primaryBusiness.ownerEmail,
              ownerPhone: user.primaryBusiness.ownerPhone,
              description: '',
              website: '',
              logo: '',
              isActive: user.primaryBusiness.status === 'ACTIVE' || user.primaryBusiness.status === 'APPROVED',
              status: user.primaryBusiness.status,
              createdAt: user.primaryBusiness.createdAt,
              updatedAt: user.primaryBusiness.createdAt
            };
            businessIdToUse = user.primaryBusiness.id;
            console.log('✅ Using primaryBusiness from login response:', businessToSet.name);
          }
          // Priority 2: Use businessId from login response
          else if (user.businessId) {
            businessIdToUse = user.businessId;
            console.log('✅ Using businessId from login response:', businessIdToUse);
            
            // Try to find stored business or create minimal one
            const { businesses } = get();
            const storedBusiness = businesses.find(business => business.id === businessIdToUse);
            
            if (storedBusiness) {
              businessToSet = storedBusiness;
              console.log('✅ Found stored business:', storedBusiness.name);
            } else {
              // Create minimal business object
              businessToSet = {
                id: businessIdToUse || '',
                name: 'Business', // Placeholder name
                tinNumber: '',
                servicePlanType: 'BASIC',
                ownerName: user.fullName || 'Business Owner',
                ownerEmail: user.email || '',
                ownerPhone: user.phoneNumber || '',
                description: '',
                website: '',
                logo: '',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              console.log('✅ Created minimal business for PARTNER_ADMIN:', businessIdToUse);
            }
          }
          // Priority 3: Fallback to stored data
          else {
            const businessIdFromUserMapping = get().getUserBusinessId(user.id);
            const { currentBusiness } = get();
            
            if (businessIdFromUserMapping) {
              businessIdToUse = businessIdFromUserMapping;
              const { businesses } = get();
              const storedBusiness = businesses.find(business => business.id === businessIdToUse);
              businessToSet = storedBusiness || null;
              console.log('✅ Using stored businessId from user mapping:', businessIdToUse);
            } else if (currentBusiness) {
              businessIdToUse = currentBusiness.id;
              businessToSet = currentBusiness;
              console.log('✅ Using current business:', currentBusiness.name);
            } else {
              console.log('⚠️ PARTNER_ADMIN user has no business data available');
              console.log('ℹ️ User will see appropriate UI for business management');
            }
          }
          
          if (businessToSet && businessIdToUse) {
            // Store the business data
            get().addBusiness(businessToSet);
            get().setCurrentBusiness(businessToSet);
            get().setUserBusinessMapping(user.id, businessIdToUse);
            
            console.log('✅ Set current business for PARTNER_ADMIN:', businessToSet.name, '(ID:', businessIdToUse, ')');
            
            // Fetch offices for the business
            await get().fetchBusinessOffices(businessIdToUse);
            console.log('✅ Fetched offices for PARTNER_ADMIN business:', businessIdToUse);
            
            // Fetch staff for the business
            try {
              await get().fetchBusinessStaff(businessIdToUse);
              console.log('✅ Fetched staff for PARTNER_ADMIN business:', businessIdToUse);
            } catch (staffError) {
              console.warn('⚠️ Failed to fetch staff during login:', staffError);
              // Don't fail login if staff fetching fails
            }
          } else {
            console.log('ℹ️ Skipping office fetch - no businessId available');
          }
        } catch (error: any) {
          console.warn('Failed to handle PARTNER_ADMIN login:', error);
          console.log('ℹ️ PARTNER_ADMIN user will proceed without office data');
          // Don't fail login if office fetching fails - PARTNER_ADMIN can still use the app
        }
      },

      handleStaffLogin: async (user: any) => {
        try {
          console.log('🔍 Business Store: Handling STAFF login for user:', user.id);
          console.log('📋 Staff data:', {
            businessId: user.businessId,
            officeId: user.officeId,
            businessName: user.business?.name || 'None'
          });
          
          if (user.businessId) {
            // Store the business information for the staff member
            const businessToSet: Business = {
              id: user.businessId,
              name: user.business?.name || 'Business',
              tinNumber: '',
              servicePlanType: 'BASIC',
              ownerName: '',
              ownerEmail: '',
              ownerPhone: '',
              description: '',
              website: '',
              logo: '',
              isActive: user.business?.status === 'ACTIVE' || user.business?.status === 'APPROVED',
              status: user.business?.status,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Store the business data
            get().addBusiness(businessToSet);
            get().setCurrentBusiness(businessToSet);
            get().setUserBusinessMapping(user.id, user.businessId || '');
            
            console.log('✅ Set current business for STAFF:', businessToSet.name, '(ID:', user.businessId, ')');
            console.log('📊 Business status:', {
              isActive: businessToSet.isActive,
              status: businessToSet.status,
              name: businessToSet.name
            });
            
            // STAFF users don't need to fetch offices - they use their officeId directly
            console.log('ℹ️ STAFF user - skipping office fetch (using officeId directly for assignments)');
          } else {
            console.log('⚠️ STAFF user has no businessId available');
          }
        } catch (error: any) {
          console.warn('Failed to handle STAFF login:', error);
          console.log('ℹ️ STAFF user will proceed without business data');
        }
      },

      registerPartnerAdminCallback: () => {
        // Register callback with user store to handle PARTNER_ADMIN login
        try {
          const { useUserStore } = require('./userStore');
          const userStore = useUserStore.getState();
          
          userStore.setPartnerAdminCallback(async (user: any) => {
            await get().handlePartnerAdminLogin(user);
          });
          
          console.log('✅ Registered PARTNER_ADMIN callback with user store');
        } catch (error) {
          console.warn('Failed to register PARTNER_ADMIN callback:', error);
        }
      },

      clearState: () => {
        set({
          businesses: [],
          currentBusiness: null,
          offices: [],
          currentOffice: null,
          staff: [],
          orders: [],
          temporaryAssignments: [],
          isLoading: false,
          error: null,
          selectedBusinessId: null,
          selectedOfficeId: null,
          userBusinessMapping: {},
          locationData: null,
        });
        console.log('✅ Business Store: State cleared');
      },
    }),
    {
      name: 'business-store',
      storage: asyncStorageAdapter,
      partialize: (state) => ({
        businesses: state.businesses,
        offices: state.offices,
        currentBusiness: state.currentBusiness,
        currentOffice: state.currentOffice,
        currentUserBusinessId: state.currentUserBusinessId,
        userBusinessMapping: state.userBusinessMapping,
      }),
    }
  )
);

// Selectors for better performance
export const useBusinesses = () => useBusinessStore((state) => state.businesses);
export const useCurrentBusiness = () => useBusinessStore((state) => state.currentBusiness);
export const useOffices = () => useBusinessStore((state) => state.offices);
export const useCurrentOffice = () => useBusinessStore((state) => state.currentOffice);
export const useOrders = () => useBusinessStore((state) => state.orders);
export const useTemporaryAssignments = () => useBusinessStore((state) => state.temporaryAssignments);
export const useBusinessLoading = () => useBusinessStore((state) => state.isLoading);
export const useBusinessError = () => useBusinessStore((state) => state.error);
export const useSelectedBusinessId = () => useBusinessStore((state) => state.selectedBusinessId);
export const useSelectedOfficeId = () => useBusinessStore((state) => state.selectedOfficeId);

// Action selectors
export const useBusinessActions = () => useBusinessStore((state) => ({
  registerBusiness: state.registerBusiness,
  registerOffice: state.registerOffice,
  fetchUserBusinesses: state.fetchUserBusinesses,
  fetchBusinessOffices: state.fetchBusinessOffices,
  checkBusinessOffices: state.checkBusinessOffices,
  handlePartnerAdminLogin: state.handlePartnerAdminLogin,
  handleStaffLogin: state.handleStaffLogin,
  setCurrentBusiness: state.setCurrentBusiness,
  setCurrentOffice: state.setCurrentOffice,
  setSelectedBusinessId: state.setSelectedBusinessId,
  setSelectedOfficeId: state.setSelectedOfficeId,
  setError: state.setError,
}));

export const useOrdersActions = () => useBusinessStore((state) => ({
  setOrders: state.setOrders,
  addOrder: state.addOrder,
  updateOrder: state.updateOrder,
  deleteOrder: state.deleteOrder,
  getOrderById: state.getOrderById,
  fetchStaffOrders: state.fetchStaffOrders,
  acceptOrder: state.acceptOrder,
  updateOrderStatus: state.updateOrderStatus,
  fetchUserAcceptedOrders: state.fetchUserAcceptedOrders,
  setUserAcceptedOrders: state.setUserAcceptedOrders,
}));

export const useUserAcceptedOrders = () => useBusinessStore((state) => state.userAcceptedOrders);

export const useTemporaryAssignmentsActions = () => useBusinessStore((state) => ({
  setTemporaryAssignments: state.setTemporaryAssignments,
  addTemporaryAssignment: state.addTemporaryAssignment,
  updateTemporaryAssignment: state.updateTemporaryAssignment,
  deleteTemporaryAssignment: state.deleteTemporaryAssignment,
  getTemporaryAssignmentById: state.getTemporaryAssignmentById,
  fetchTemporaryAssignments: state.fetchTemporaryAssignments,
  acceptTemporaryAssignment: state.acceptTemporaryAssignment,
}));

// Computed selectors
export const useActiveBusinesses = () => useBusinessStore((state) => 
  state.businesses.filter(business => business.isActive)
);

export const useOfficesByBusiness = (businessId: string) => useBusinessStore((state) => 
  state.offices.filter(office => office.businessId === businessId)
);

export const useMainOffices = () => useBusinessStore((state) => 
  state.offices.filter(office => office.isMainOffice)
);
