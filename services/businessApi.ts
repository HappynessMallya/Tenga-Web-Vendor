const BASE_URL = 'https://lk-7ly1.onrender.com/api';

// Types for API responses
export interface BusinessRegistrationPayload {
  name: string;
  tinNumber: string;
  tinCertificate?: string;
  servicePlanType: string;
  whatsappGroupLink?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCountryCode: string;
  ownerId: string;
  description: string;
  website?: string;
  logo?: string;
  businessLicense?: string;
  taxCertificate?: string;
  insuranceDocument?: string;
  otherCertificates?: string[];
}

export interface OfficeRegistrationPayload {
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
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    console.log(`API Call: ${method} ${url}`, data);

    const response = await fetch(url, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// Business Registration API
export const businessApi = {
  // Register a new business
  registerBusiness: async (payload: BusinessRegistrationPayload, token?: string): Promise<ApiResponse<any>> => {
    return apiCall('/business/register', 'POST', payload, token);
  },

  // Get business details
  getBusiness: async (businessId: string, token?: string): Promise<ApiResponse<any>> => {
    return apiCall(`/business/${businessId}`, 'GET', undefined, token);
  },

  // Update business details
  updateBusiness: async (businessId: string, payload: Partial<BusinessRegistrationPayload>, token?: string): Promise<ApiResponse<any>> => {
    return apiCall(`/business/${businessId}`, 'PUT', payload, token);
  },

  // Get all businesses for a user
  getUserBusinesses: async (userId: string, token?: string): Promise<ApiResponse<any[]>> => {
    return apiCall(`/business/user/${userId}`, 'GET', undefined, token);
  },
};

// Office Registration API
export const officeApi = {
  // Register a new office
  registerOffice: async (payload: OfficeRegistrationPayload, token?: string): Promise<ApiResponse<any>> => {
    return apiCall('/office/register', 'POST', payload, token);
  },

  // Get office details
  getOffice: async (officeId: string, token?: string): Promise<ApiResponse<any>> => {
    return apiCall(`/office/${officeId}`, 'GET', undefined, token);
  },

  // Update office details
  updateOffice: async (officeId: string, payload: Partial<OfficeRegistrationPayload>, token?: string): Promise<ApiResponse<any>> => {
    return apiCall(`/office/${officeId}`, 'PUT', payload, token);
  },

  // Get all offices for a business
  getBusinessOffices: async (businessId: string, token?: string): Promise<ApiResponse<any[]>> => {
    return apiCall(`/office/business/${businessId}`, 'GET', undefined, token);
  },

  // Delete office
  deleteOffice: async (officeId: string, token?: string): Promise<ApiResponse<any>> => {
    return apiCall(`/office/${officeId}`, 'DELETE', undefined, token);
  },
};

// File Upload API (for documents and images)
export const fileApi = {
  // Upload a single file
  uploadFile: async (file: any, type: 'document' | 'image', token?: string): Promise<ApiResponse<{ url: string }>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const url = `${BASE_URL}/upload`;
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error('File Upload Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
      };
    }
  },

  // Upload multiple files
  uploadMultipleFiles: async (files: any[], type: 'document' | 'image', token?: string): Promise<ApiResponse<{ urls: string[] }>> => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });
      formData.append('type', type);

      const url = `${BASE_URL}/upload/multiple`;
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error('Multiple File Upload Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Multiple file upload failed',
      };
    }
  },
};

// Utility function to generate geoHash from coordinates
export const generateGeoHash = (latitude: string, longitude: string): string => {
  // This is a simplified implementation
  // In a real app, you'd use a proper geohash library
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  return `${Math.round(lat * 1000)}${Math.round(lng * 1000)}`;
};

// Utility function to validate API responses
export const validateApiResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.success) {
    throw new Error(response.error || 'API call failed');
  }
  if (!response.data) {
    throw new Error('No data returned from API');
  }
  return response.data;
};

export default {
  businessApi,
  officeApi,
  fileApi,
  generateGeoHash,
  validateApiResponse,
};
