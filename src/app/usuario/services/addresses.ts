import { fetchJSON } from './api';

export type Address = {
  id: number;
  line1: string;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_billing: boolean;
};

export type AddressInput = Omit<Address, 'id'>;

export async function listAddresses() {
  return fetchJSON<Address[]>(`/api/billing/addresses`);
}

export async function getAddress(id: number) {
  return fetchJSON<Address>(`/api/billing/addresses/${id}`);
}

export async function createAddress(data: AddressInput) {
  return fetchJSON<Address>(`/api/billing/addresses`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAddress(id: number, data: Partial<AddressInput>) {
  return fetchJSON<Address>(`/api/billing/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteAddress(id: number) {
  return fetchJSON<{ message: string }>(`/api/billing/addresses/${id}`, { method: 'DELETE' });
}
