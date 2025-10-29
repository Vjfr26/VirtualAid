import { fetchJSON } from './api';

export interface Payout {
  id: number;
  medico_email: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processed' | 'rejected' | string;
  requested_at: string;
  processed_at?: string | null;
  invoice_id?: number | null;
  notes?: string | null;
  provider_transaction_id?: string | null;
}

export interface PayoutsResponse {
  payouts: Payout[];
}

export async function requestPayout(medicoEmail: string, payload: { amount: number; currency?: string; payment_method_id?: number; notes?: string }) {
  return fetchJSON<Payout>(`/api/medico/${encodeURIComponent(medicoEmail)}/payouts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listPayouts(medicoEmail: string): Promise<PayoutsResponse> {
  return fetchJSON<PayoutsResponse>(`/api/medico/${encodeURIComponent(medicoEmail)}/payouts`);
}

// Admin helpers (optional)
export async function approvePayout(id: number, body?: { provider_transaction_id?: string; provider?: string }) {
  return fetchJSON<any>(`/api/admin/payouts/${id}/approve`, { method: 'PUT', body: JSON.stringify(body || {}) });
}

export async function rejectPayout(id: number) {
  return fetchJSON<any>(`/api/admin/payouts/${id}/reject`, { method: 'PUT' });
}
