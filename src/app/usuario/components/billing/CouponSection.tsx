import React from 'react';
import { useTranslation } from 'next-i18next';

const CouponSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-yellow-50 p-5 rounded-xl shadow-sm min-w-0 break-words">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-lg text-yellow-800 break-words">{t('coupon')}</h3>
          <p className="text-gray-600 break-words">{t('no_active_coupon')}</p>
        </div>
        <button className="text-sm bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer">
          {t('redeem_coupon')}
        </button>
      </div>
    </div>
  );
};

export default CouponSection;
