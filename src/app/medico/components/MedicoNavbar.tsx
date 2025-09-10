/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import HeaderLogo from '../../components/HeaderLogo';
import TopActions from '../../components/TopActions';

interface MedicoNavbarProps {
  isMobile: boolean;
  isTablet: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  handleLogout: () => void;
}

export default function MedicoNavbar({
  isMobile,
  isTablet,
  sidebarOpen,
  setSidebarOpen,
  handleLogout
}: MedicoNavbarProps) {
  return (
    <nav className={`fixed top-0 right-0 z-30 bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl shadow-2xl border-b border-blue-500/30 transition-all duration-300 ${
      isMobile || isTablet ? 'left-0' : 'left-72'
    }`}>
      {/* Efecto de gradiente superior */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10"></div>
      
      <div className="relative flex items-center justify-between px-8 py-4">
        {/* Logo igual que en página principal */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-xl blur opacity-40 transition duration-300"></div>
            <div className="relative flex items-center gap-3">
              <HeaderLogo variant="icon" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                VirtualAid
              </span>
            </div>
          </div>
        </div>
        
        {/* Controles del navbar */}
        <div className="flex items-center gap-3">
          {/* Botón para mostrar/ocultar el menú en mobile/tablet */}
          {((isMobile || isTablet) && !sidebarOpen) && (
            <button
              className="md:hidden relative bg-gradient-to-r from-slate-700/80 to-blue-700/80 hover:from-slate-600 hover:to-blue-600 text-white rounded-xl p-3 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 border border-white/10 backdrop-blur-sm group"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Abrir menú"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg width="24" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="relative z-10">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          
          {/* Selector de idiomas con efectos */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-1">
              <TopActions />
            </div>
          </div>
          
          {/* Botón de cerrar sesión con efectos premium */}
          <button 
            className="relative bg-gradient-to-r from-red-500/90 to-pink-500/90 hover:from-red-500 hover:to-pink-500 text-white rounded-xl p-3 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group border border-red-400/30 backdrop-blur-sm cursor-pointer"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-pink-400/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg 
              width="20" 
              height="20" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              className="relative z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" 
              />
            </svg>
            <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Cerrar sesión
            </span>
          </button>
        </div>
      </div>
      
      {/* Línea de gradiente inferior */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
    </nav>
  );
}
