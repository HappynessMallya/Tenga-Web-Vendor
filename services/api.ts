import axios, { AxiosInstance, AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import { secureStorage } from '../utils/storage';

// Get API base URL from environment
const getApiBaseUrl = (): string => {
  // On web platform, use proxy server (runs on same origin, no CORS issues)
  if (Platform.OS === 'web') {
    // Check if we're in development (proxy should be running)
    const isDev = (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Use local proxy server (bypasses CORS)
      const proxyUrl = 'http://localhost:3001/api';
      console.log('🌐 [Web Dev] Using proxy server to avoid CORS:', proxyUrl);
      return proxyUrl;
    }
    
    // ✅ In production web, always use relative path for Vercel proxy
    console.log('🌐 [Web Production] Using Vercel proxy: /api');
    return '/api';
  }
  
  // For native platforms, use direct API URL
  const fromConstants = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL;
  if (fromConstants) {
    return fromConstants;
  }
  
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv;
  }
  
  // Final fallback
  return ENV.API_BASE_URL;
};

// Create axios instance with base configuration
const API: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Add CORS configuration for web
if (Platform.OS === 'web') {
  API.defaults.withCredentials = false;
}

// Request interceptor - Auto-attach JWT token
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error attaching token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
API.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Unauthorized access - clearing token');
      
      try {
        // Clear stored token
        await secureStorage.removeToken();
        await secureStorage.removeUser();
      } catch (clearError) {
        console.warn('Failed to clear stored credentials:', clearError);
      }
      // You can dispatch a logout action here if using Redux/Zustand
    }
    
    // Handle network errors
    if (!error.response) {
      const isWeb = Platform.OS === 'web';
      const isDev = (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.NODE_ENV === 'development';
      
      if (isWeb && isDev) {
        // Provide helpful error message for web dev
        const proxyUrl = 'http://localhost:3001';
        const errorMessage = `Network Error: Cannot connect to API. 
        
Please ensure the proxy server is running:
1. Open a new terminal
2. Run: npm run web:proxy
3. Or run both together: npm run web:dev

Proxy should be running at: ${proxyUrl}
Original error: ${error.message}`;
        
        console.error('🌐 [Web Dev] Network Error:', errorMessage);
        error.message = errorMessage;
      } else {
        console.error('Network error:', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface OfficeRegistrationResponse {
  message: string;
  office: Office;
}

export interface OfficesResponse {
  offices: Office[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface Staff {
  id: string;
  userId: string;
  businessId: string;
  officeId: string | null;
  isContactPerson: boolean;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    name: string;
  };
}

export interface StaffUser {
  id: string;
  uuid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  role: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  Staff: Staff;
}

// API Response structure for staff list
export interface StaffApiResponse {
  id: string;
  userId: string;
  businessId: string;
  officeId: string | null;
  isContactPerson: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    role: string;
  };
  office: any | null;
}

// API Response structure for staff assignment
export interface StaffAssignmentRequest {
  userId: string;
  isContactPerson: boolean;
}

export interface StaffAssignmentResponse {
  message: string;
  staff: {
    id: string;
    userId: string;
    businessId: string;
    officeId: string;
    isContactPerson: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface StaffCreationRequest {
  phoneNumber: string;
  fullName: string;
  email: string;
  password: string;
  countryCode: string;
}

export interface StaffCreationResponse {
  message: string;
  user: StaffUser;
  business: {
    id: string;
    name: string;
  };
}

// Order interfaces
export interface Order {
  id: string;
  customerName: string;
  type: string;
  status: string;
  time: string;
  price?: number;
  items?: Array<{ name: string; qty: number }>;
  location: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
}

export interface StaffOrdersResponse {
  orders: Order[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Temporary Assignment interfaces
export interface OrderItem {
  id: string;
  orderId: string;
  serviceType: string;
  garmentTypeId: string;
  description: string;
  quantity: number;
  weightLbs: number;
  price: number;
  externalTagId: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  loyaltyPoints: number;
  defaultPaymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    fullName: string;
    phoneNumber: string;
  };
}

export interface DetailedOrder {
  id: string;
  uuid: string;
  customerId: string;
  businessId: string | null;
  officeId: string | null;
  acceptedByStaffId: string | null;
  acceptedAt: string | null;
  isTemporarilyAssigned: boolean;
  permanentlyAssignedToOfficeId: string | null;
  assignedByStaffId: string | null;
  assignedAt: string | null;
  workflowId: string;
  workflowStatus: string;
  status: string;
  pickupAddressId: string | null;
  deliveryAddressId: string | null;
  preferredPickupTimeStart: string;
  preferredPickupTimeEnd: string;
  preferredDeliveryTimeStart: string;
  preferredDeliveryTimeEnd: string;
  cleanerId: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  items: OrderItem[];
}

export interface TemporaryAssignment {
  id: string;
  orderId: string;
  officeId: string;
  businessId: string;
  distanceKm: number;
  isAccepted: boolean;
  acceptedByStaffId: string | null;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  order: DetailedOrder;
  office: {
    id: string;
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
      cityGeoHash: string | null;
      locationGeoHash: string | null;
      regionGeoHash: string | null;
      slotId: string | null;
      images: any[];
      customerCare: any[];
      storageSpace: any | null;
      openingHours: any | null;
      locationTypeUuid: string | null;
      street: string | null;
      state: string | null;
      zipCode: string | null;
      geo: any | null;
      unit: string | null;
      formatted: string | null;
    };
  };
  business: {
    id: string;
    name: string;
  };
}

export interface TemporaryAssignmentsResponse {
  message: string;
  assignments: TemporaryAssignment[];
  count: number;
}

// Order acceptance interfaces
export interface OrderAcceptanceRequest {
  officeId: string;
}

export interface OrderAcceptanceResponse {
  message: string;
  order: Order;
}

// Temporary assignment acceptance interfaces
export interface TemporaryAssignmentAcceptanceRequest {
  officeId: string;
}

export interface TemporaryAssignmentAcceptanceResponse {
  message: string;
  assignment: TemporaryAssignment;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface User {
  id: string;
  uuid?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode?: string;
  role: string;
  verified?: boolean;
  businessId?: string; // Available for both PARTNER_ADMIN and STAFF
  officeId?: string; // Available for STAFF
  isContactPerson?: boolean; // Available for STAFF
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // PARTNER_ADMIN specific fields
  ownedBusinesses?: Business[];
  primaryBusiness?: Business;
  
  // STAFF specific fields
  business?: {
    id: string;
    name: string;
    status: string;
  };
  office?: Office | null;
  
  // Legacy fields (for backward compatibility)
  country?: string;
  customerProfile?: any;
  driverProfile?: any;
  cleanerProfile?: any;
}

export interface Business {
  id: string;
  name: string;
  tinNumber: string;
  servicePlanType: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  description?: string;
  website?: string;
  logo?: string;
  isActive?: boolean;
  status?: string; // PENDING_APPROVAL, APPROVED, etc.
  createdAt?: string;
  updatedAt?: string;
  offices?: Office[]; // Available in ownedBusinesses
}

export interface Office {
  id: string;
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
    landMark?: string;
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
  businessId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Authentication Service
export const authService = {

  // POST /auth/signIn
  loginUser: async (payload: {
    phoneNumber: string;
    password: string;
    countryCode?: string;
  }): Promise<AuthResponse> => {
    try {
      console.log('Login attempt with payload:', payload);
      console.log('API Base URL:', ENV.API_BASE_URL);
      
      const response = await API.post('/auth/signIn', payload);
      console.log('Login response:', response.data);
      
      // Handle the actual API response format
      if (response.data.message === 'Sign-in successful.' && response.data.token && response.data.user) {
        return {
          success: true,
          token: response.data.token,
          user: {
            id: response.data.user.id,
            uuid: response.data.user.uuid,
            fullName: response.data.user.fullName,
            email: response.data.user.email,
            phoneNumber: response.data.user.phoneNumber,
            countryCode: response.data.user.countryCode,
            country: response.data.user.countryCode || 'Tanzania',
            role: response.data.user.role || 'PARTNER_ADMIN',
            verified: response.data.user.verified,
            businessId: response.data.user.businessId,
            officeId: response.data.user.officeId,
            isContactPerson: response.data.user.isContactPerson,
            
            // PARTNER_ADMIN specific fields
            ownedBusinesses: response.data.user.ownedBusinesses,
            primaryBusiness: response.data.user.primaryBusiness,
            
            // STAFF specific fields
            business: response.data.user.business,
            office: response.data.user.office,
            
            // Legacy fields
            customerProfile: response.data.user.customerProfile,
            driverProfile: response.data.user.driverProfile,
            cleanerProfile: response.data.user.cleanerProfile,
          },
          message: response.data.message,
        };
      } else if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        }
      });
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  },

  // GET /auth/verify
  verifyToken: async (): Promise<{ valid: boolean; user?: User }> => {
    try {
      const response = await API.get('/auth/verify');
      return { valid: true, user: response.data.user };
    } catch (error: any) {
      console.error('Token verification error:', error.response?.data || error.message);
      return { valid: false };
    }
  },

  // POST /auth/logout
  logoutUser: async (): Promise<void> => {
    try {
      await API.post('/auth/logout');
      console.log('Logout successful');
    } catch (error: any) {
      // Handle 404 (endpoint not found) gracefully
      if (error.response?.status === 404) {
        console.log('Logout endpoint not found - clearing local data only');
      } else {
        console.error('Logout error:', error.response?.data || error.message);
      }
      // Don't throw error for logout - always clear local data
    }
  },
};

// Business Service
export const businessService = {
  // POST /businesses
  registerBusiness: async (payload: {
    name: string;
    tinNumber: string;
    tinCertificate: string;
    servicePlanType: string;
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
  }): Promise<ApiResponse<{
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
  }>> => {
    try {
      console.log('🌐 API Service: Starting business registration request');
      console.log('🔗 API Service: Endpoint: POST /businesses');
      console.log('📡 API Service: Base URL:', ENV.API_BASE_URL);
      console.log('📋 API Service: Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await API.post('/businesses', payload);
      
      console.log('✅ API Service: Response received');
      console.log('📊 API Service: Response status:', response.status);
      console.log('📄 API Service: Response data:', JSON.stringify(response.data, null, 2));
      
      // Handle the expected response format with business and partnerAdmin
      if (response.data.business && response.data.partnerAdmin) {
        return {
          success: true,
          data: {
            business: response.data.business,
            partnerAdmin: response.data.partnerAdmin
          },
          message: response.data?.message
        };
      } else {
        // Fallback for different response format
        return {
          success: true,
          data: response.data,
          message: response.data?.message
        };
      }
    } catch (error: any) {
      console.error('💥 API Service: Business registration error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestConfig: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.config?.data,
        }
      });
      
      // Extract validation details if available
      const validationDetails = error.response?.data?.error?.details;
      let errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Business registration failed';
      
      if (validationDetails && Array.isArray(validationDetails)) {
        const validationErrors = validationDetails.map((detail: any) => detail.message || detail).join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
        console.error('❌ API Service: Validation errors:', validationDetails);
      }
      
      console.error('❌ API Service: Final error message:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // GET /businesses/{id}
  getBusiness: async (businessId: string): Promise<ApiResponse<Business>> => {
    try {
      const response = await API.get(`/businesses/${businessId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get business error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get business');
    }
  },

  // PUT /businesses/{id}
  updateBusiness: async (businessId: string, payload: Partial<Business>): Promise<ApiResponse<Business>> => {
    try {
      const response = await API.put(`/businesses/${businessId}`, payload);
      return response.data;
    } catch (error: any) {
      console.error('Update business error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update business');
    }
  },

  // GET /businesses/user/{userId}
  getUserBusinesses: async (userId: string): Promise<ApiResponse<Business[]>> => {
    try {
      const response = await API.get(`/businesses/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get user businesses error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get user businesses');
    }
  },

  // GET /businesses/{businessId}/offices - Check if business has offices
  checkBusinessOffices: async (businessId: string): Promise<ApiResponse<{ hasOffices: boolean; offices: Office[] }>> => {
    try {
      console.log('🔍 Business Service: Checking offices for business:', businessId);
      const response = await API.get(`/businesses/${businessId}/offices`);
      
      const offices = response.data || [];
      const hasOffices = offices.length > 0;
      
      console.log('📊 Business Service: Office check result:', { hasOffices, officeCount: offices.length });
      
      return {
        success: true,
        data: { hasOffices, offices },
        message: hasOffices ? 'Business has offices' : 'No offices found'
      };
    } catch (error: any) {
      console.error('💥 Business Service: Office check error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check offices';
      throw new Error(errorMessage);
    }
  },
};

// Office Service
export const officeService = {
  // POST /businesses/{businessId}/offices
  registerOffice: async (businessId: string, payload: {
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
      landMark?: string;
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
  }): Promise<OfficeRegistrationResponse> => {
    try {
      console.log('📡 Office Service: Registering office for business:', businessId);
      console.log('📋 Office Service: Payload:', JSON.stringify(payload, null, 2));
      
      const response = await API.post(`/businesses/${businessId}/offices`, payload);
      console.log('✅ Office Service: Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('💥 Office Service: Registration failed');
      console.error('📊 Error response:', error.response?.data);
      console.error('📊 Error status:', error.response?.status);
      console.error('📊 Error message:', error.message);
      
      // Extract more detailed error information
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || errorData?.error || error.message || 'Office registration failed';
      
      throw new Error(errorMessage);
    }
  },

  // GET /businesses/{businessId}/offices
  getBusinessOffices: async (businessId: string): Promise<ApiResponse<OfficesResponse>> => {
    try {
      const response = await API.get(`/businesses/${businessId}/offices`);
      
      // Handle the response - API might return offices array directly
      const offices = response.data || [];
      
      return {
        success: true,
        data: offices,
        message: 'Offices fetched successfully'
      };
    } catch (error: any) {
      console.error('Get business offices error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get business offices');
    }
  },

  // GET /offices/{id}
  getOffice: async (officeId: string): Promise<ApiResponse<Office>> => {
    try {
      const response = await API.get(`/offices/${officeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get office error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get office');
    }
  },

  // PUT /offices/{id}
  updateOffice: async (officeId: string, payload: Partial<Office>): Promise<ApiResponse<Office>> => {
    try {
      const response = await API.put(`/offices/${officeId}`, payload);
      return response.data;
    } catch (error: any) {
      console.error('Update office error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update office');
    }
  },

  // DELETE /offices/{id}
  deleteOffice: async (officeId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await API.delete(`/offices/${officeId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete office error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete office');
    }
  },
};

// File Upload Service
export const fileService = {
  // POST /upload
  uploadFile: async (file: any, type: 'document' | 'image' = 'image'): Promise<ApiResponse<{ url: string }>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await API.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('File upload error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'File upload failed');
    }
  },

  // POST /upload/multiple
  uploadMultipleFiles: async (files: any[], type: 'document' | 'image' = 'image'): Promise<ApiResponse<{ urls: string[] }>> => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
      formData.append('type', type);

      const response = await API.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Multiple file upload error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Multiple file upload failed');
    }
  },
};

// Staff Service
export const staffService = {
  // GET /businesses/{businessId}/staff
  getBusinessStaff: async (businessId: string): Promise<{ pagination: any; staff: StaffApiResponse[] }> => {
    try {
      console.log('🔍 Staff Service: Fetching staff for business:', businessId);
      
      const response = await API.get(`/businesses/${businessId}/staff`);
      
      console.log('✅ Staff Service: Staff fetch successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Staff Service: Staff fetch failed:', error);
      
      let errorMessage = 'Failed to fetch staff members';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('📝 Staff Service: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  },

  // POST /businesses/{businessId}/staff/create
  createStaff: async (businessId: string, staffData: StaffCreationRequest): Promise<StaffCreationResponse> => {
    try {
      console.log('🔍 Staff Service: Creating staff for business:', businessId);
      console.log('📋 Staff data:', staffData);
      
      const response = await API.post(`/businesses/${businessId}/staff/create`, staffData);
      
      console.log('✅ Staff Service: Staff creation successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Staff Service: Staff creation failed:', error);
      
      let errorMessage = 'Failed to create staff member';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('📝 Staff Service: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  },

  // POST /businesses/{businessId}/offices/{officeId}/staff
  assignStaffToOffice: async (businessId: string, officeId: string, assignmentData: StaffAssignmentRequest): Promise<StaffAssignmentResponse> => {
    try {
      console.log('🔍 Staff Service: Assigning staff to office:', { businessId, officeId, assignmentData });
      
      const response = await API.post(`/businesses/${businessId}/offices/${officeId}/staff`, assignmentData);
      
      console.log('✅ Staff Service: Staff assignment successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Staff Service: Staff assignment failed:', error);
      
      let errorMessage = 'Failed to assign staff to office';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('📝 Staff Service: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  },

  // GET /staff/office/orders
  getStaffOrders: async (): Promise<StaffOrdersResponse> => {
    try {
      console.log('🔍 Staff Service: Fetching staff office orders');
      
      const response = await API.get('/staff/office/orders');
      
      console.log('✅ Staff Service: Staff orders fetch successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Staff Service: Staff orders fetch failed:', error);
      
      let errorMessage = 'Failed to fetch staff orders';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('📝 Staff Service: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  },

  // GET /staff/offices/{officeId}/temporary-assignments
  getTemporaryAssignments: async (officeId: string): Promise<TemporaryAssignmentsResponse> => {
    try {
      console.log('🔍 Staff Service: Fetching temporary assignments for office:', officeId);
      
      const response = await API.get(`/staff/offices/${officeId}/temporary-assignments`);
      
      console.log('✅ Staff Service: Temporary assignments fetch successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Staff Service: Temporary assignments fetch failed:', error);
      
      let errorMessage = 'Failed to fetch temporary assignments';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('📝 Staff Service: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  },

  // POST /staff/orders/{orderId}/accept
  acceptOrder: async (orderId: string, officeId: string): Promise<OrderAcceptanceResponse> => {
    try {
      console.log('🔍 Staff Service: Accepting order:', orderId, 'for office:', officeId);
      
      const payload: OrderAcceptanceRequest = { officeId };
      const response = await API.post(`/staff/orders/${orderId}/accept`, payload);
      
      console.log('✅ Staff Service: Order acceptance successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Staff Service: Order acceptance failed:', error);
      
      let errorMessage = 'Failed to accept order';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('📝 Staff Service: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  },

  // POST /staff/temporary-assignments/{assignmentId}/accept
  acceptTemporaryAssignment: async (assignmentId: string, officeId: string): Promise<TemporaryAssignmentAcceptanceResponse> => {
    try {
      console.log('🔍 Staff Service: Accepting temporary assignment:', assignmentId, 'for office:', officeId);
      
      const payload: TemporaryAssignmentAcceptanceRequest = { officeId };
      const response = await API.post(`/staff/temporary-assignments/${assignmentId}/accept`, payload);
      
      console.log('✅ Staff Service: Temporary assignment acceptance successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Staff Service: Temporary assignment acceptance failed:', error);
      
      let errorMessage = 'Failed to accept temporary assignment';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('📝 Staff Service: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  },

  // POST /staff/orders/{orderId}/status
  updateOrderStatus: async (orderId: string, status: string, notes?: string): Promise<any> => {
    try {
      console.log('🔍 Staff Service: Updating order status:', orderId, 'to:', status);
      
      const payload = { 
        status,
        notes: notes || `Order status updated to ${status}`
      };
      const response = await API.post(`/staff/orders/${orderId}/status`, payload);
      
      console.log('✅ Staff Service: Order status update successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Staff Service: Order status update failed:', error);
      
      let errorMessage = 'Failed to update order status';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },
};

// User Orders Service
export const userOrdersService = {
  // GET /orders/user/{userId}
  getUserOrders: async (userId: string): Promise<{
    orders: Order[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
    type: string;
    user: {
      id: string;
      role: string;
    };
  }> => {
    try {
      console.log('🔍 User Orders Service: Fetching orders for user:', userId);
      
      const response = await API.get(`/orders/user/${userId}`);
      
      console.log('✅ User Orders Service: User orders fetch successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ User Orders Service: User orders fetch failed:', error);
      
      let errorMessage = 'Failed to fetch user orders';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },
};

// Utility function to generate geohash
export const generateGeoHash = (latitude: string, longitude: string): string => {
  // This is a mock implementation. In a real app, you'd use a library like 'ngeohash'
  // or a backend service to generate a geohash from lat/long.
  return `mock_geohash_${latitude}_${longitude}`;
};

export default API;