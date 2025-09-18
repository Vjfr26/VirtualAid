import React from 'react';

interface MedicoSidebarProps {
  isMobile: boolean;
  isTablet: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function MedicoSidebar({
  isMobile,
  isTablet,
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab
}: MedicoSidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'citas', icon: '📅', label: 'Citas' },
    { id: 'disponibilidad', icon: '🕒', label: 'Disponibilidad' },
    { id: 'pacientes', icon: '👤', label: 'Pacientes' },
    { id: 'billing', icon: '💳', label: 'Billing' },
    { id: 'perfil', icon: '⚙️', label: 'Perfil' }
  ];

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Overlay para mobile/tablet cuando sidebar está abierto */}
      {(isMobile || isTablet) && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`transition-all duration-200 z-50 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 backdrop-blur-md border-r border-blue-800/30 text-slate-200 shadow-xl ${
          isMobile || isTablet
            ? `fixed top-0 left-0 h-full w-72 ${sidebarOpen ? 'block' : 'hidden'}`
            : 'fixed top-0 left-0 h-screen w-72'
        }`}
        style={{ paddingTop: "10px" }}>
        
        {/* Header del menú mejorado */}
        <div className="mx-4 my-6 mt-6 p-4 bg-gradient-to-br from-indigo-600/20 via-blue-600/15 to-cyan-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 1 3 3 3 3-2 3-3"/>
                <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                Panel Médico
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs text-slate-300 font-medium">Sistema activo</p>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
            💡 Gestiona tu práctica médica de forma integral
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="mt-2">
          <ul className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <li 
                key={item.id}
                className={`w-full flex items-center gap-3 px-4 py-3 mx-3 rounded-xl font-semibold cursor-pointer transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg shadow-blue-500/25 transform scale-105 ring-2 ring-cyan-300/50'
                    : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-800/60 hover:to-blue-800/60 hover:text-white hover:scale-102 hover:shadow-md'
                }`} 
                onClick={() => handleMenuClick(item.id)}
              >
                <span>{item.icon}</span> {item.label}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
