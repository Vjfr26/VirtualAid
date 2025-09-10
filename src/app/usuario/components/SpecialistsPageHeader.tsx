"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';

interface SpecialistsPageHeaderProps {
  totalSpecialists: number;
}

export default function SpecialistsPageHeader({
  totalSpecialists
}: SpecialistsPageHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold mb-2">{t('specialists_header')}</h1>
          <p className="text-white/80">{t('specialists_header_sub')}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{totalSpecialists}</div>
          <div className="text-white/80 text-sm">{t('specialists_available')}</div>
        </div>
      </div>
    </div>
  );
}
