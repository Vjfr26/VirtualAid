"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { BillingProfile, PaymentMethod, Address, Invoice } from '../services/billing';

interface MedicoData {
  email: string;
  nombre: string;
  apellido: string;
}

interface BillingSectionProps {
  ctx: {
    billingLoading: boolean;
    billingProfile: BillingProfile | null;
    setBillingLoading: (loading: boolean) => void;
    setBillingProfile: (profile: BillingProfile | null) => void;
    createOrUpdateBillingProfile: (data: any) => Promise<BillingProfile>;
    medicoData: MedicoData | null;
    invoices: Invoice[];
    billingNotImplemented: boolean;
    pmList: PaymentMethod[];
    setPmList: (methods: PaymentMethod[]) => void;
    pmForm: Partial<PaymentMethod>;
    setPmForm: (form: Partial<PaymentMethod>) => void;
    pmFormOpen: boolean;
    setPmFormOpen: (open: boolean) => void;
    pmLoading: boolean;
    setPmLoading: (loading: boolean) => void;
    pmEditingId: number | null;
    setPmEditingId: (id: number | null) => void;
    pmEditForm: Partial<PaymentMethod>;
    setPmEditForm: (form: Partial<PaymentMethod>) => void;
    createPaymentMethod: (data: any) => Promise<PaymentMethod>;
    listPaymentMethodsByProfile: (profileId: number) => Promise<PaymentMethod[]>;
    updatePaymentMethod: (id: number, data: any) => Promise<PaymentMethod>;
    deletePaymentMethod: (id: number) => Promise<void>;
    addressForm: Address | null;
    setAddressForm: (address: Address | null) => void;
    addressEditing: boolean;
    setAddressEditing: (editing: boolean) => void;
    addressFormEdit: Partial<Address>;
    setAddressFormEdit: (form: Partial<Address>) => void;
    updateAddress: (id: number, data: Partial<Address>) => Promise<Address>;
    createAddress: (data: any) => Promise<Address>;
    billingProfileEditing: boolean;
    setBillingProfileEditing: (editing: boolean) => void;
    billingProfileForm: Partial<BillingProfile>;
    setBillingProfileForm: (form: Partial<BillingProfile>) => void;
    saldoMedico: number;
    loadingSaldo: boolean;
  };
}

export default function BillingSection({ ctx }: BillingSectionProps) {
  const { t } = useTranslation();
  const {
    billingLoading,
    billingProfile,
    setBillingLoading,
    setBillingProfile,
    createOrUpdateBillingProfile,
    medicoData,
    invoices,
    billingNotImplemented,
    pmList,
    setPmList,
    pmForm,
    setPmForm,
    pmFormOpen,
    setPmFormOpen,
    pmLoading,
    setPmLoading,
    pmEditingId,
    setPmEditingId,
    pmEditForm,
    setPmEditForm,
    createPaymentMethod,
    listPaymentMethodsByProfile,
    updatePaymentMethod,
    deletePaymentMethod,
    addressForm,
    setAddressForm,
    addressEditing,
    setAddressEditing,
    addressFormEdit,
    setAddressFormEdit,
    updateAddress,
    createAddress,
    billingProfileEditing,
    setBillingProfileEditing,
    billingProfileForm,
    setBillingProfileForm,
    saldoMedico,
    loadingSaldo
  } = ctx;

  const [activeTab, setActiveTab] = useState<'perfil' | 'metodos' | 'facturas'>('perfil');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Componente Modal usando Portal
  const ModalPortal = ({ children }: { children: React.ReactNode }) => {
    if (!mounted) return null;
    return createPortal(children, document.body);
  };

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 flex flex-col gap-4 overflow-hidden">
      {/* Header mejorado */}
      <div className="p-6 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-t-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent"></div>
        <div className="relative flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h2 className="font-bold text-white text-xl tracking-wide">{t('medico.billing.title')}</h2>
            <p className="text-emerald-100 text-sm">{t('medico.billing.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Saldo total */}
      <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg mx-4 mt-0 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-white/80 text-sm font-medium mb-1">{t('medico.billing.balance.label')}</span>
            {loadingSaldo ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full border-2 border-white/30 border-t-white h-6 w-6"></div>
                <span className="text-white text-lg">{t('medico.billing.balance.loading')}</span>
              </div>
            ) : (
              <span className="text-white text-3xl font-bold">
                {typeof saldoMedico === 'number'
                  ? `$${saldoMedico.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `-`}
              </span>
            )}
            <span className="text-white/60 text-xs mt-1">
              {t('medico.billing.balance.description')}
            </span>
          </div>
          <button className="bg-white text-teal-700 font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:bg-emerald-50 transition-all duration-300">
            💸 {t('medico.billing.balance.withdraw')}
          </button>
        </div>
      </div>

      <div className="p-6 overflow-hidden">
        <div className="w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded mb-6" />

        {billingLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 h-12 w-12 mb-4"></div>
            <p className="text-emerald-700 font-semibold">{t('medico.billing.loading')}</p>
          </div>
        ) : billingNotImplemented ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-8 rounded-xl text-center my-4">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-xl mb-3">{t('medico.billing.notImplemented.title')}</h3>
            <p className="mb-6 text-gray-700">{t('medico.billing.notImplemented.description')}</p>
            <div className="text-sm text-amber-700 bg-amber-100 p-4 rounded-lg border mb-4">
              <p className="font-medium mb-2">{t('medico.billing.notImplemented.statusTitle')}</p>
              <ul className="text-left space-y-1">
                <li>{t('medico.billing.notImplemented.items.ui')}</li>
                <li>{t('medico.billing.notImplemented.items.payments')}</li>
                <li>{t('medico.billing.notImplemented.items.profiles')}</li>
                <li>{t('medico.billing.notImplemented.items.api')}</li>
                <li>{t('medico.billing.notImplemented.items.database')}</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              {t('medico.billing.notImplemented.note')}
            </p>
          </div>
        ) : !billingProfile ? (
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 text-gray-700 p-8 rounded-xl text-center my-4">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('medico.billing.setup.title')}</h3>
            <p className="mb-6 text-gray-600">{t('medico.billing.setup.description')}</p>
            <button
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
              onClick={async () => {
                if (!medicoData) return;
                setBillingLoading(true);
                try {
                  const created = await createOrUpdateBillingProfile({
                    billable_type: 'App\\Models\\Medico',
                    billable_id: medicoData.email,
                    legal_name: `Dr. ${medicoData.nombre} ${medicoData.apellido}`
                  });
                  setBillingProfile(created);
                } finally {
                  setBillingLoading(false);
                }
              }}
            >
              <span>🚀</span>
              {t('medico.billing.setup.button')}
            </button>
          </div>
        ) : (
          <>
            {/* Tabs de navegación */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
              {[
                { id: 'perfil', label: t('medico.billing.tabs.profile'), icon: '👤' },
                { id: 'metodos', label: t('medico.billing.tabs.methods'), icon: '💳' },
                { id: 'facturas', label: t('medico.billing.tabs.invoices'), icon: '📄' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-emerald-700 shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenido de las tabs */}
            {activeTab === 'perfil' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-emerald-800 flex items-center gap-2">
                      <span>👤</span>
                      {t('medico.billing.profileSection.title')}
                    </h3>
                    <button
                      onClick={() => setBillingProfileEditing(!billingProfileEditing)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                    >
                      <span>{billingProfileEditing ? '❌' : '✏️'}</span>
                      {billingProfileEditing
                        ? t('medico.billing.profileSection.cancel')
                        : t('medico.billing.profileSection.edit')}
                    </button>
                  </div>

                  {billingProfileEditing ? (
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('medico.billing.profileSection.legalName.label')}
                          </label>
                          <input
                            type="text"
                            value={billingProfileForm.legal_name || ''}
                            onChange={(e) => setBillingProfileForm({...billingProfileForm, legal_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder={t('medico.billing.profileSection.legalName.placeholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('medico.billing.profileSection.taxId.label')}
                          </label>
                          <input
                            type="text"
                            value={billingProfileForm.tax_id || ''}
                            onChange={(e) => setBillingProfileForm({...billingProfileForm, tax_id: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder={t('medico.billing.profileSection.taxId.placeholder')}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                          {t('medico.billing.profileSection.save')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingProfileEditing(false)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                          {t('medico.billing.profileSection.cancel')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600">🏢</span>
                          <div>
                            <p className="text-sm text-gray-500">{t('medico.billing.profileSection.fields.legalName')}</p>
                            <p className="font-semibold text-gray-800">{billingProfile?.legal_name || t('medico.billing.profileSection.fields.notSpecified')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600">🆔</span>
                          <div>
                            <p className="text-sm text-gray-500">{t('medico.billing.profileSection.fields.taxId')}</p>
                            <p className="font-semibold text-gray-800">{billingProfile?.tax_id || t('medico.billing.profileSection.fields.notSpecified')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600">📧</span>
                          <div>
                            <p className="text-sm text-gray-500">{t('medico.billing.profileSection.fields.email')}</p>
                            <p className="font-semibold text-gray-800">{medicoData?.email || t('medico.billing.profileSection.fields.notAvailable')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600">📅</span>
                          <div>
                            <p className="text-sm text-gray-500">{t('medico.billing.profileSection.fields.profileId')}</p>
                            <p className="font-semibold text-gray-800">#{billingProfile?.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dirección de facturación */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-blue-800 flex items-center gap-2">
                      <span>📍</span>
                      {t('medico.billing.addressSection.title')}
                    </h3>
                    <button
                      onClick={() => setAddressEditing(!addressEditing)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                    >
                      <span>{addressEditing ? '❌' : '✏️'}</span>
                      {addressEditing ? t('medico.billing.addressSection.cancel') : t('medico.billing.addressSection.edit')}
                    </button>
                  </div>

                  {addressEditing ? (
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('medico.billing.addressSection.fields.address')}
                          </label>
                          <input
                            type="text"
                            value={addressFormEdit.line1 || ''}
                            onChange={(e) => setAddressFormEdit({...addressFormEdit, line1: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('medico.billing.addressSection.placeholders.address')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('medico.billing.addressSection.fields.city')}
                          </label>
                          <input
                            type="text"
                            value={addressFormEdit.city || ''}
                            onChange={(e) => setAddressFormEdit({...addressFormEdit, city: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('medico.billing.addressSection.fields.postalCode')}
                          </label>
                          <input
                            type="text"
                            value={addressFormEdit.postal_code || ''}
                            onChange={(e) => setAddressFormEdit({...addressFormEdit, postal_code: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('medico.billing.addressSection.fields.region')}
                          </label>
                          <input
                            type="text"
                            value={addressFormEdit.region || ''}
                            onChange={(e) => setAddressFormEdit({...addressFormEdit, region: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('medico.billing.addressSection.fields.country')}
                          </label>
                          <input
                            type="text"
                            value={addressFormEdit.country || ''}
                            onChange={(e) => setAddressFormEdit({...addressFormEdit, country: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('medico.billing.addressSection.placeholders.country')}
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                          {t('medico.billing.addressSection.save')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddressEditing(false)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                          {t('medico.billing.addressSection.cancel')}
                        </button>
                      </div>
                    </form>
                  ) : addressForm ? (
                    <div className="space-y-2">
                      <p className="text-gray-800">{addressForm.line1}</p>
                      <p className="text-gray-800">{addressForm.city}, {addressForm.postal_code}</p>
                      {addressForm.region && <p className="text-gray-800">{addressForm.region}</p>}
                      <p className="text-gray-800">{addressForm.country}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <span className="text-3xl mb-2 block">📍</span>
                      <p>{t('medico.billing.addressSection.empty')}</p>
                      <button
                        onClick={() => setAddressEditing(true)}
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                      >
                        {t('medico.billing.addressSection.add')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'metodos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <span>💳</span>
                    {t('medico.billing.paymentMethods.title')}
                  </h3>
                  <button
                    onClick={() => setPmFormOpen(true)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <span>➕</span>
                    {t('medico.billing.paymentMethods.add')}
                  </button>
                </div>

                {pmList.length === 0 ? (
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-8 text-center">
                    <div className="mb-4">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-lg mb-2 text-gray-700">{t('medico.billing.paymentMethods.emptyTitle')}</h4>
                    <p className="text-gray-600 mb-4">{t('medico.billing.paymentMethods.emptyDescription')}</p>
                    <button
                      onClick={() => setPmFormOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <span>💳</span>
                      {t('medico.billing.paymentMethods.addButton')}
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pmList.map((pm: any) => (
                      <div key={pm.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {pm.provider === 'stripe' ? '💳' : pm.provider === 'paypal' ? '🅿️' : '💰'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                •••• •••• •••• {pm.last4 || '****'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : 'Método'} • Expira {pm.exp_month}/{pm.exp_year}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              pm.is_default
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {pm.is_default
                                ? t('medico.billing.paymentMethods.default')
                                : t('medico.billing.paymentMethods.secondary')}
                            </span>
                            <button
                              onClick={() => {
                                setPmEditingId(pm.id);
                                setPmEditForm({...pm});
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(t('medico.billing.paymentMethods.deleteConfirm'))) {
                                  setPmLoading(true);
                                  try {
                                    await deletePaymentMethod(pm.id);
                                    setPmList(pmList.filter((p: any) => p.id !== pm.id));
                                  } finally {
                                    setPmLoading(false);
                                  }
                                }
                              }}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'facturas' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <span>📄</span>
                    {t('medico.billing.invoices.title')}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {t('medico.billing.invoices.count', { count: invoices.length })}
                  </div>
                </div>

                {invoices.length === 0 ? (
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-8 text-center">
                    <div className="mb-4">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-lg mb-2 text-gray-700">{t('medico.billing.invoices.emptyTitle')}</h4>
                    <p className="text-gray-600">{t('medico.billing.invoices.emptyDescription')}</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t('medico.billing.invoices.columns.id')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t('medico.billing.invoices.columns.amount')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t('medico.billing.invoices.columns.status')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t('medico.billing.invoices.columns.date')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t('medico.billing.invoices.columns.actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {invoices.map((invoice: any) => (
                            <tr key={invoice.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{invoice.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {invoice.amount} {invoice.currency?.toUpperCase()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  invoice.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : invoice.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {invoice.status === 'paid'
                                    ? t('medico.billing.invoices.status.paid')
                                    : invoice.status === 'pending'
                                    ? t('medico.billing.invoices.status.pending')
                                    : invoice.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('es-ES') : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button className="text-emerald-600 hover:text-emerald-900 font-medium">
                                  {t('medico.billing.invoices.viewDetails')}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para agregar/editar método de pago */}
      {(pmFormOpen || pmEditingId) && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 text-gray-600 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="font-bold text-gray-600 text-lg mb-4 flex items-center gap-2">
                <span>{pmEditingId ? '✏️' : '➕'}</span>
                {pmEditingId ? t('medico.billing.modal.editTitle') : t('medico.billing.modal.addTitle')}
              </h3>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('medico.billing.modal.provider')}
                  </label>
                  <select
                    value={pmEditingId ? pmEditForm.provider : pmForm.provider}
                    onChange={(e) => pmEditingId
                      ? setPmEditForm({...pmEditForm, provider: e.target.value})
                      : setPmForm({...pmForm, provider: e.target.value})
                    }
                    className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="stripe">{t('medico.billing.modal.providers.stripe')}</option>
                    <option value="paypal">{t('medico.billing.modal.providers.paypal')}</option>
                    <option value="manual">{t('medico.billing.modal.providers.manual')}</option>
                  </select>
                </div>

                {(pmEditingId ? pmEditForm.provider : pmForm.provider) === 'stripe' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('medico.billing.modal.cardNumber')}
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('medico.billing.modal.expMonth')}
                        </label>
                        <input
                          type="text"
                          placeholder="MM"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('medico.billing.modal.expYear')}
                        </label>
                        <input
                          type="text"
                          placeholder="YYYY"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('medico.billing.modal.cvc')}
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={pmEditingId ? pmEditForm.is_default : pmForm.is_default}
                    onChange={(e) => pmEditingId
                      ? setPmEditForm({...pmEditForm, is_default: e.target.checked})
                      : setPmForm({...pmForm, is_default: e.target.checked})
                    }
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                    {t('medico.billing.modal.default')}
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={pmLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {pmLoading
                      ? t('medico.billing.modal.saving')
                      : pmEditingId
                        ? t('medico.billing.modal.updateAction')
                        : t('medico.billing.modal.addAction')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPmFormOpen(false);
                      setPmEditingId(null);
                      setPmEditForm({});
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    {t('medico.billing.modal.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}
