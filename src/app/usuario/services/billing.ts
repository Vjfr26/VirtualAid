import { fetchJSON } from './api';
import type { Address } from './addresses';
import type { PaymentMethod } from './paymentMethods';

export type BillingProfile = {
  id: number;
  billable_id: string;
  billable_type: string; // App\\Models\\Usuario | App\\Models\\Medico
  legal_name?: string | null;
  tax_id?: string | null;
  address_id?: number | null;
  default_payment_method_id?: number | null;
  address?: Address | null;
  payment_methods?: PaymentMethod[];
};

// Tipos Address y PaymentMethod se importan desde sus módulos dedicados

export type Invoice = {
  id: number;
  billing_profile_id: number;
  cita_id?: number | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | string;
  provider?: string | null;
  provider_charge_id?: string | null;
  paid_at?: string | null;
};

export async function getBillingProfileByOwner(type: 'usuario' | 'medico', id: string) {
  return fetchJSON<BillingProfile>(`/api/billing/profile/owner/${type}/${encodeURIComponent(id)}`);
}

export async function createOrUpdateBillingProfile(data: Partial<BillingProfile>) {
  if (data.id) {
    return fetchJSON<BillingProfile>(`/api/billing/profile/${data.id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  return fetchJSON<BillingProfile>(`/api/billing/profile`, { method: 'POST', body: JSON.stringify(data) });
}

export async function listInvoices() {
  return fetchJSON<Invoice[]>(`/api/billing/invoices`);
}

export async function createInvoice(payload: Partial<Invoice>) {
  return fetchJSON<Invoice>(`/api/billing/invoices`, { method: 'POST', body: JSON.stringify(payload) });
}
