import { apiGet, apiPost } from './api';

export type Driver = { id: string; name: string; phone?: string; lat?: number; lng?: number };

// Placeholder endpoints for Bolt integration
export async function fetchAvailableDrivers(purpose: 'pickup' | 'delivery') {
  try {
    return await apiGet<Driver[]>(`/drivers/available?purpose=${purpose}`);
  } catch (e) {
    // Fallback mock
    return [
      { id: 'bolt-1', name: 'James Katundu' },
      { id: 'bolt-2', name: 'John Lameck' },
    ];
  }
}

export async function assignDriver(orderId: string, driverId: string, purpose: 'pickup' | 'delivery') {
  return apiPost(`/orders/${orderId}/assign-driver`, { driverId, purpose });
}







