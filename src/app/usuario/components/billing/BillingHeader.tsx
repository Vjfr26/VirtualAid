import React from 'react';
import { useTranslation } from 'next-i18next';

const BillingHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl text-gray-700 font-bold mb-6">{t('billing')}</h2>
    </div>
  );
};

export default BillingHeader;
