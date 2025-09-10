import React from 'react';
import { useTranslation } from 'next-i18next';

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

interface PaymentMethodItemProps {
  method: PaymentMethod;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

const PaymentMethodItem: React.FC<PaymentMethodItemProps> = ({
  method,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  const { t } = useTranslation();

  const getMethodDisplay = () => {
    if (method.provider === 'paypal' && method.token) {
      return `PayPal (${method.token})`;
    } else if (method.last4 && method.brand) {
      return `${method.brand} •••• ${method.last4}`;
    } else {
      return `${method.provider}`;
    }
  };

  const getProviderIcon = () => {
    switch (method.provider.toLowerCase()) {
      case 'paypal':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">PP</span>
          </div>
        );
      case 'stripe':
        return (
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.549-2.354 1.549-2.749 0-5.789-1.146-7.618-2.255l-.932 5.58c1.615.706 4.045 1.106 6.844 1.106 2.581 0 4.719-.671 6.253-1.917 1.616-1.291 2.4-3.134 2.4-5.394 0-4.307-2.666-6.036-6.295-7.534z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-green-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-green-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getProviderIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 truncate">{getMethodDisplay()}</span>
              {method.is_default && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Predeterminado
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 capitalize">{method.provider} • {method.status || 'Activo'}</div>
          </div>
        </div>
        <div className="flex gap-1 items-center ml-3">
          {!method.is_default && (
            <button
              onClick={onSetDefault}
              className="flex items-center gap-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-3 rounded-lg transition-colors"
              title="Establecer como predeterminado"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Predeterminar
            </button>
          )}
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-3 rounded-lg transition-colors"
            title="Editar método"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-lg transition-colors"
            title="Eliminar método"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodItem;
