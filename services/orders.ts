import API from './api';

export type OrderDTO = {
  id: string;
  customerName: string;
  type: string;
  status: string;
  time: string;
  price?: number;
  items?: Array<{ name: string; qty: number }>;
  location: { lat: number; lng: number };
};

export async function fetchVendorOrders(token?: string) {
  return API.get<OrderDTO[]>('/vendor/orders', { headers: { Authorization: `Bearer ${token}` } });
}

export async function acceptOrderApi(id: string, token?: string) {
  return API.post(`/vendor/orders/${id}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
}







