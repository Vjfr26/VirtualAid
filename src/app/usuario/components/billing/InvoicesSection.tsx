import React from 'react';
import { useTranslation } from 'next-i18next';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at?: string;
}

interface InvoicesSectionProps {
  invoices: Invoice[];
  loadingInvoices: boolean;
}

const InvoicesSection: React.FC<InvoicesSectionProps> = ({
  invoices,
  loadingInvoices,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-100 p-5 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg text-gray-800">{t('invoices')}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200 text-gray-800">
            <tr>
              <th className="py-2 px-3 text-left">ID</th>
              <th className="py-2 px-3 text-left">{t('amount')}</th>
              <th className="py-2 px-3 text-left">{t('currency')}</th>
              <th className="py-2 px-3 text-left">{t('status')}</th>
              <th className="py-2 px-3 text-left">{t('paid')}</th>
            </tr>
          </thead>
          <tbody>
            {loadingInvoices ? (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 h-12 w-12 mb-2"></div>
                  <p className="text-blue-600">{t('loading_invoices')}</p>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={5} className="py-3 text-center text-gray-600">{t('no_invoices')}</td></tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id} className="even:bg-gray-50">
                  <td className="py-2 px-3">{inv.id}</td>
                  <td className="py-2 px-3">{inv.amount}</td>
                  <td className="py-2 px-3">{inv.currency}</td>
                  <td className="py-2 px-3">{inv.status}</td>
                  <td className="py-2 px-3">{inv.paid_at ? new Date(inv.paid_at).toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicesSection;
