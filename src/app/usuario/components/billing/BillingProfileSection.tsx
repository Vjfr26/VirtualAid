import React from 'react';
import { useTranslation } from 'next-i18next';

interface BillingProfile {
  id: number;
  legal_name?: string | null;
  tax_id?: string | null;
}

interface BillingProfileSectionProps {
  billingProfiles: BillingProfile[];
  currentProfile: BillingProfile | null;
  loadingProfiles: boolean;
  showCreateProfile: boolean;
  showEditProfile: boolean;
  newProfile: { legal_name: string; tax_id: string };
  setShowCreateProfile: (show: boolean) => void;
  setShowEditProfile: (show: boolean) => void;
  setNewProfile: (profile: { legal_name: string; tax_id: string }) => void;
  handleCreateProfile: () => void;
  handleEditProfile: () => void;
}

const BillingProfileSection: React.FC<BillingProfileSectionProps> = ({
  billingProfiles,
  currentProfile,
  loadingProfiles,
  showCreateProfile,
  showEditProfile,
  newProfile,
  setShowCreateProfile,
  setShowEditProfile,
  setNewProfile,
  handleCreateProfile,
  handleEditProfile,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200 min-w-0 break-words hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-xl text-blue-800">{t('billing_profile_title')}</h3>
        </div>
        {!currentProfile && showCreateProfile && (
          <button 
            onClick={handleCreateProfile}
            className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear perfil
          </button>
        )}
      </div>
      
      {loadingProfiles ? (
        <div className="bg-white/60 rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <div className="h-4 bg-blue-200 rounded w-1/4"></div>
            </div>
            <div className="h-12 bg-blue-100 rounded-lg"></div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <div className="h-4 bg-blue-200 rounded w-1/3"></div>
            </div>
            <div className="h-12 bg-blue-100 rounded-lg"></div>
            <div className="h-10 bg-blue-200 rounded-lg w-full"></div>
          </div>
        </div>
      ) : currentProfile ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-inner">
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-900 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Nombre legal
              </label>
              <input 
                className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                value={newProfile.legal_name || ''} 
                onChange={e => setNewProfile({ ...newProfile, legal_name: e.target.value })}
                placeholder="Ingrese el nombre legal completo"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-900 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                Identificación fiscal
              </label>
              <input 
                className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                value={newProfile.tax_id || ''} 
                onChange={e => setNewProfile({ ...newProfile, tax_id: e.target.value })}
                placeholder="Ej: RFC, NIT, Tax ID"
              />
            </div>
            <button
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
              onClick={handleEditProfile}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar perfil
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/60 rounded-lg p-6 border-2 border-dashed border-blue-300 text-center">
          <svg className="w-12 h-12 text-blue-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-blue-700 font-medium">{t('no_billing_profile_yet')}</p>
          <p className="text-blue-600 text-sm mt-1">Crea un perfil para gestionar tu facturación</p>
        </div>
      )}

      {showCreateProfile && (
        <div className="mt-4 p-5 bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl shadow-inner">
          <h4 className="flex items-center gap-2 font-bold text-lg text-blue-900 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('create_billing_profile')}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('legal_name')}
              </label>
              <input
                type="text"
                value={newProfile.legal_name}
                onChange={(e) => setNewProfile({ ...newProfile, legal_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                placeholder={t('enter_legal_name')}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                {t('tax_id')}
              </label>
              <input
                type="text"
                value={newProfile.tax_id}
                onChange={(e) => setNewProfile({ ...newProfile, tax_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                placeholder={t('enter_tax_id')}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowCreateProfile(false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('cancel')}
            </button>
            <button
              onClick={handleCreateProfile}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('create')}
            </button>
          </div>
        </div>
      )}

      {showEditProfile && currentProfile && (
        <div className="mt-4 p-5 bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl shadow-inner">
          <h4 className="flex items-center gap-2 font-bold text-lg text-blue-900 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t('edit_billing_profile')}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('legal_name')}
              </label>
              <input
                type="text"
                value={newProfile.legal_name}
                onChange={(e) => setNewProfile({ ...newProfile, legal_name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                {t('tax_id')}
              </label>
              <input
                type="text"
                value={newProfile.tax_id}
                onChange={(e) => setNewProfile({ ...newProfile, tax_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowEditProfile(false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('cancel')}
            </button>
            <button
              onClick={handleEditProfile}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingProfileSection;
