import { fetchJSON } from './api';

export type PaymentMethod = {
  id: number;
  billing_profile_id: number;
  provider: string;
  token?: string | null;
  brand?: string | null;
  last4?: string | null;
  exp_month?: number | null;
  exp_year?: number | null;
  is_default: boolean;
  status: string;
};

export type PaymentMethodInput = Omit<PaymentMethod, 'id'>;

export async function listPaymentMethods() {
  return fetchJSON<PaymentMethod[]>(`/api/billing/payment-methods`);
}

export async function listPaymentMethodsByProfile(billing_profile_id: number) {
  return fetchJSON<PaymentMethod[]>(`/api/billing/payment-methods/profile/${billing_profile_id}`);
}

export async function getPaymentMethod(id: number) {
  return fetchJSON<PaymentMethod>(`/api/billing/payment-methods/${id}`);
}

export async function createPaymentMethod(data: PaymentMethodInput) {
  return fetchJSON<PaymentMethod>(`/api/billing/payment-methods`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePaymentMethod(id: number, data: Partial<PaymentMethodInput>) {
  return fetchJSON<PaymentMethod>(`/api/billing/payment-methods/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deletePaymentMethod(id: number) {
  return fetchJSON<{ message: string }>(`/api/billing/payment-methods/${id}`, { method: 'DELETE' });
}
