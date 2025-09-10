"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';

interface SpecialistsSearchFiltersProps {
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
  especialidadFiltro: string;
  setEspecialidadFiltro: (especialidad: string) => void;
  ordenamiento: 'nombre' | 'especialidad' | 'disponibilidad';
  setOrdenamiento: (ordenamiento: 'nombre' | 'especialidad' | 'disponibilidad') => void;
  especialidadesUnicas: string[];
  filteredCount: number;
}

export default function SpecialistsSearchFilters({
  busqueda,
  setBusqueda,
  especialidadFiltro,
  setEspecialidadFiltro,
  ordenamiento,
  setOrdenamiento,
  especialidadesUnicas,
  filteredCount
}: SpecialistsSearchFiltersProps) {
  const { t } = useTranslation('common');

  const handleClearFilters = () => {
    setBusqueda('');
    setEspecialidadFiltro('');
    setOrdenamiento('nombre');
  };

  return (
    <div className="bg-white rounded-xl text-gray-600 shadow-md p-6">
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 min-w-0 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('search_by_name_specialty_email')}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <select
              value={especialidadFiltro}
              onChange={e => setEspecialidadFiltro(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">Todas las especialidades</option>
              {especialidadesUnicas.map((especialidad) => (
                <option key={especialidad} value={especialidad}>
                  {especialidad}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <div className="relative">
            <select
              value={ordenamiento}
              onChange={e => setOrdenamiento(e.target.value as 'nombre' | 'especialidad' | 'disponibilidad')}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[160px]"
            >
              <option value="nombre">{t('sort_by_name')}</option>
              <option value="especialidad">Ordenar por especialidad</option>
              <option value="disponibilidad">Ordenar por disponibilidad</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleClearFilters}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center whitespace-nowrap"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpiar
        </button>
      </div>
      
      {(busqueda || especialidadFiltro) && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex flex-wrap gap-2">
            <span>Resultados: <strong>{filteredCount}</strong></span>
            {busqueda && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                Búsqueda: &quot;{busqueda}&quot;
              </span>
            )}
            {especialidadFiltro && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Especialidad: {especialidadFiltro}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
