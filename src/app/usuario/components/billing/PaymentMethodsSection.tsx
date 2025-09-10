import React from 'react';
import { useTranslation } from 'next-i18next';
import PaymentMethodItem from './PaymentMethodItem';
import PaymentMethodForm from './PaymentMethodForm';

interface PaymentMethod {
  id: number;
  provider: string;
  brand?: string | null;
  last4?: string | null;
  exp_month?: number | null;
  exp_year?: number | null;
  token?: string | null;
  is_default: boolean;
  status?: string;
  billing_profile_id: number;
}

interface PaymentMethodsSectionProps {
  paymentMethods: PaymentMethod[];
  loadingPaymentMethods: boolean;
  showAddPayment: boolean;
  editingPayment: PaymentMethod | null;
  newPaymentMethod: {
    type: string;
    provider: string;
    holder_name: string;
    email: string;
  };
  setShowAddPayment: (show: boolean) => void;
  setEditingPayment: (payment: PaymentMethod | null) => void;
  setNewPaymentMethod: (method: {
    type: string;
    provider: string;
    holder_name: string;
    email: string;
  }) => void;
  handleAddPaymentMethod: () => void;
  handleEditPaymentMethod: () => void;
  handleDeletePaymentMethod: (id: number) => void;
  handleSetDefaultPayment: (id: number) => void;
}

const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({
  paymentMethods,
  loadingPaymentMethods,
  showAddPayment,
  editingPayment,
  newPaymentMethod,
  setShowAddPayment,
  setEditingPayment,
  setNewPaymentMethod,
  handleAddPaymentMethod,
  handleEditPaymentMethod,
  handleDeletePaymentMethod,
  handleSetDefaultPayment,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200 min-w-0 break-words hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="font-bold text-xl text-green-800">{t('payment_methods')}</h3>
        </div>
        <button
          onClick={() => setShowAddPayment(!showAddPayment)}
          className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-all shadow-md hover:shadow-lg ${
            showAddPayment 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {showAddPayment ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cerrar
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Añadir método
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {paymentMethods.length === 0 ? (
          <div className="bg-white/60 rounded-lg p-6 border-2 border-dashed border-green-300 text-center">
            <svg className="w-12 h-12 text-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-green-700 font-medium">{t('no_payment_methods')}</p>
            <p className="text-green-600 text-sm mt-1">Agrega un método de pago para realizar transacciones</p>
          </div>
        ) : (
          paymentMethods.map(method => (
            <PaymentMethodItem
              key={method.id}
              method={method}
              onEdit={() => {
                setNewPaymentMethod({
                  type: method.provider === 'paypal' ? 'paypal' : 'card',
                  provider: method.provider,
                  holder_name: method.brand || '',
                  email: method.token || '',
                });
                setEditingPayment(method);
              }}
              onDelete={() => handleDeletePaymentMethod(method.id)}
              onSetDefault={() => handleSetDefaultPayment(method.id)}
            />
          ))
        )}
      </div>

      {showAddPayment && (
        <PaymentMethodForm
          title={t('add_payment_method')}
          paymentMethod={newPaymentMethod}
          setPaymentMethod={setNewPaymentMethod}
          onSave={handleAddPaymentMethod}
          onCancel={() => setShowAddPayment(false)}
        />
      )}

      {editingPayment && (
        <PaymentMethodForm
          title={t('edit_payment_method')}
          paymentMethod={newPaymentMethod}
          setPaymentMethod={setNewPaymentMethod}
          onSave={handleEditPaymentMethod}
          onCancel={() => setEditingPayment(null)}
        />
      )}
    </div>
  );
};

export default PaymentMethodsSection;
