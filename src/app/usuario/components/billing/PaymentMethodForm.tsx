import React from 'react';
import { useTranslation } from 'next-i18next';

interface PaymentMethodFormProps {
  title: string;
  paymentMethod: {
    type: string;
    provider: string;
    holder_name: string;
    email: string;
  };
  setPaymentMethod: (method: {
    type: string;
    provider: string;
    holder_name: string;
    email: string;
  }) => void;
  onSave: () => void;
  onCancel: () => void;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  title,
  paymentMethod,
  setPaymentMethod,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white/70 border border-green-200 rounded-xl p-3 mb-3">
      <div className="grid grid-cols-1 gap-2 text-gray-700">
        <select 
          className="border border-green-200 rounded-lg px-3 py-2 cursor-pointer" 
          value={paymentMethod.provider} 
          onChange={e => setPaymentMethod({ ...paymentMethod, provider: e.target.value })}
        >
          <option value="manual">Manual</option>
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
        </select>
        {paymentMethod.provider === 'paypal' ? (
          <input 
            className="border border-green-200 rounded-lg px-3 py-2" 
            placeholder="Email de PayPal" 
            value={paymentMethod.email} 
            onChange={e => setPaymentMethod({ ...paymentMethod, email: e.target.value })} 
          />
        ) : (
          <>
            <input 
              className="border border-green-200 rounded-lg px-3 py-2" 
              placeholder="Marca (ej. Visa)" 
              value={paymentMethod.holder_name} 
              onChange={e => setPaymentMethod({ ...paymentMethod, holder_name: e.target.value })} 
            />
            <input 
              className="border border-green-200 rounded-lg px-3 py-2" 
              placeholder="Últimos 4" 
              onChange={e => setPaymentMethod({ ...paymentMethod, email: e.target.value })} 
            />
          </>
        )}
        <button
          className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded-lg"
          onClick={onSave}
        >
          Guardar método
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodForm;
