"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { MedicoResumen } from '../services/medicos';

interface SpecialistProfileModalProps {
  medico: MedicoResumen | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleAppointment: (email: string) => void;
}

export default function SpecialistProfileModal({
  medico,
  isOpen,
  onClose,
  onScheduleAppointment
}: SpecialistProfileModalProps) {
  const { t } = useTranslation('common');

  if (!isOpen || !medico) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleScheduleAppointment = () => {
    if (medico.email) {
      onScheduleAppointment(medico.email);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{t('specialist_profile')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <div className="relative">
              {medico.avatar ? (
                <Image
                  src={medico.avatar && medico.avatar.startsWith('http') ? medico.avatar : medico.avatar ? medico.avatar : 'https://randomuser.me/api/portraits/lego/1.jpg'}
                  alt={medico.nombre + ' avatar'}
                  width={100}
                  height={100}
                  className="rounded-full object-cover border-4 border-orange-200"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://randomuser.me/api/portraits/lego/1.jpg'; }}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center border-4 border-orange-200">
                  <span className="text-orange-600 font-bold text-4xl">
                    {medico.nombre?.charAt(0).toUpperCase() || 'D'}
                  </span>
                </div>
              )}
              <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${
                medico.disponible ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {t('doctor_short')} {medico.nombre} {medico.apellido || ''}
                </h3>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  medico.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {medico.disponible ? t('available') : t('not_available')}
                </span>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                </svg>
                <span className="text-lg font-semibold text-orange-600">{medico.especialidad}</span>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{medico.disponible ? t('available_today') : t('not_available')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('contact_information')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="text-gray-900">{medico.email || t('not_available')}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="text-gray-900">{medico.telefono || t('not_available')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-orange-50 rounded-xl p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              {t('professional_information')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('specialty')}</label>
                <span className="text-orange-600 font-semibold">{medico.especialidad}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('years_experience')}</label>
                <span className="text-gray-900">{medico.experiencia || t('not_specified')} {t('years')}</span>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('education')}</label>
                <span className="text-gray-900">{medico.educacion || t('not_specified')}</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(medico.experiencia || medico.educacion) && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t('additional_information')}
              </h4>
              
              {medico.experiencia && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">{t('experience')}</h5>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {medico.experiencia}
                  </p>
                </div>
              )}
              
              {medico.educacion && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">{t('education')}</h5>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {medico.educacion}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {t('close')}
          </button>
          <button
            onClick={handleScheduleAppointment}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{t('schedule_appointment')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
