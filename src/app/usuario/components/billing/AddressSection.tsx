import React from 'react';
import { useTranslation } from 'next-i18next';

interface BillingAddress {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
}

interface AddressSectionProps {
  billingAddress: BillingAddress;
  setBillingAddress: (address: BillingAddress) => void;
  handleSaveAddress: () => void;
}

const AddressSection: React.FC<AddressSectionProps> = ({
  billingAddress,
  setBillingAddress,
  handleSaveAddress,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm min-w-0 break-words">
      <h3 className="font-bold text-lg mb-4">{t('billing_address')}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('address_line_1')}
          </label>
          <input
            type="text"
            value={billingAddress.line1}
            onChange={(e) => setBillingAddress({ ...billingAddress, line1: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('address_line_2')}
          </label>
          <input
            type="text"
            value={billingAddress.line2}
            onChange={(e) => setBillingAddress({ ...billingAddress, line2: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('city')}
          </label>
          <input
            type="text"
            value={billingAddress.city}
            onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('region')}
          </label>
          <input
            type="text"
            value={billingAddress.region}
            onChange={(e) => setBillingAddress({ ...billingAddress, region: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('postal_code')}
          </label>
          <input
            type="text"
            value={billingAddress.postal_code}
            onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('country')}
          </label>
          <select
            value={billingAddress.country}
            onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('select_country')}</option>
            <option value="US">{t('united_states')}</option>
            <option value="CA">{t('canada')}</option>
            <option value="MX">{t('mexico')}</option>
            <option value="ES">{t('spain')}</option>
            <option value="AR">{t('argentina')}</option>
            <option value="CO">{t('colombia')}</option>
            <option value="CL">{t('chile')}</option>
            <option value="PE">{t('peru')}</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={handleSaveAddress}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {t('save_address')}
        </button>
      </div>
    </div>
  );
};

export default AddressSection;
