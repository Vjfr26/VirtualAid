import { fetchJSON } from './api';

const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

export interface BillingProfile {
  id: number;
  billable_id: string;
  billable_type: string;
  legal_name?: string;
  tax_id?: string;
  address_id?: number;
  default_payment_method_id?: number;
  address?: Address;
  paymentMethods?: PaymentMethod[];
}

export interface Address {
  id: number;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
  is_billing?: boolean;
}

export interface PaymentMethod {
  id: number;
  billing_profile_id: number;
  provider: string;
  token?: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default?: boolean;
  status?: string;
}

export interface Invoice {
  id: number;
  billing_profile_id: number;
  cita_id?: number;
  amount: number;
  currency?: string;
  status?: string;
  provider?: string;
  provider_charge_id?: string;
  paid_at?: string;
}

export async function getBillingProfileByOwner(type: 'medico'|'usuario', id: string): Promise<BillingProfile> {
  try {
    return await fetchJSON<BillingProfile>(`${API_URL}/api/billing/profile/owner/${type}/${encodeURIComponent(id)}`);
  } catch (error: any) {
    // Si el endpoint no existe o devuelve error del servidor, indicar que no está implementado
    if (error.message?.includes('404') || error.message?.includes('500') || error.message?.includes('Error 404') || error.message?.includes('Error 500')) {
      throw new Error('BILLING_NOT_IMPLEMENTED');
    }
    console.error('Error en getBillingProfileByOwner:', error);
    throw error;
  }
}

export async function listPaymentMethodsByProfile(profileId: number): Promise<PaymentMethod[]> {
  try {
    return await fetchJSON<PaymentMethod[]>(`${API_URL}/api/billing/payment-methods/profile/${profileId}`);
  } catch (error: any) {
    // Si el endpoint no existe, devolver array vacío
    if (error.message?.includes('404') || error.message?.includes('500')) {
      return [];
    }
    throw error;
  }
}

export async function listInvoices(): Promise<Invoice[]> {
  try {
    return await fetchJSON<Invoice[]>(`${API_URL}/api/billing/invoices`);
  } catch (error: any) {
    // Si el endpoint no existe, devolver array vacío
    if (error.message?.includes('404') || error.message?.includes('500')) {
      return [];
    }
    throw error;
  }
}

export async function createOrUpdateBillingProfile(data: Partial<BillingProfile>): Promise<BillingProfile> {
  if (data.id) {
    return fetchJSON<BillingProfile>(`${API_URL}/api/billing/profile/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  return fetchJSON<BillingProfile>(`${API_URL}/api/billing/profile`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function createAddress(data: Partial<Address>): Promise<Address> {
  return fetchJSON<Address>(`${API_URL}/api/billing/addresses`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateAddress(id: number, data: Partial<Address>): Promise<Address> {
  return fetchJSON<Address>(`${API_URL}/api/billing/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function createPaymentMethod(data: Partial<PaymentMethod>): Promise<PaymentMethod> {
  return fetchJSON<PaymentMethod>(`${API_URL}/api/billing/payment-methods`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updatePaymentMethod(id: number, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
  return fetchJSON<PaymentMethod>(`${API_URL}/api/billing/payment-methods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deletePaymentMethod(id: number): Promise<void> {
  await fetchJSON(`${API_URL}/api/billing/payment-methods/${id}`, {
    method: 'DELETE'
  });
}
