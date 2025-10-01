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

type BillingProfileApi = Omit<BillingProfile, 'paymentMethods'> & {
  payment_methods?: PaymentMethod[];
};

export async function getBillingProfileByOwner(email: string, type?: 'medico'|'usuario'): Promise<BillingProfile> {
  try {
    // La ruta del backend es GET /billing/profile/{id} donde id = email
    const searchParams = new URLSearchParams();
    if (type) {
      searchParams.set('type', type);
    }

    const url = searchParams.size
      ? `${API_URL}/api/billing/profile/${encodeURIComponent(email)}?${searchParams.toString()}`
      : `${API_URL}/api/billing/profile/${encodeURIComponent(email)}`;

    const raw = await fetchJSON<BillingProfileApi>(url);

    const { payment_methods, paymentMethods, address, ...rest } = raw as BillingProfileApi & { paymentMethods?: PaymentMethod[] };

    // Normalizar address: is_billing puede venir como 0/1
    const normalizedAddress = address
      ? {
          ...address,
          is_billing: Boolean(Number((address as any).is_billing)),
        }
      : undefined;

    // Normalizar payment methods: is_default puede venir como 0/1
    const rawMethods = payment_methods ?? (paymentMethods as PaymentMethod[]) ?? [];
    const normalizedMethods: PaymentMethod[] = rawMethods.map((m: any) => ({
      ...m,
      is_default: Boolean(Number(m.is_default)),
    }));

    return {
      ...rest,
      address: normalizedAddress,
      paymentMethods: normalizedMethods,
    };
  } catch (error: any) {
    if (error.message?.includes('Perfil no encontrado') || error.message?.includes('404')) {
      throw new Error('BILLING_PROFILE_NOT_FOUND');
    }
    if (error.message?.includes('500') || error.message?.includes('Error 500')) {
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
    // Si hay cualquier error (500, timeout, etc.) no queremos romper la carga del dashboard.
    console.warn('Error listPaymentMethodsByProfile:', error?.message ?? error);
    return [];
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
