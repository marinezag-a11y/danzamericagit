import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Menu, 
  LogOut, 
  LayoutDashboard,
  AlertTriangle
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  menuItems: any[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  userEmail: string | null;
  handleLogout: () => void;
  isSupport?: boolean;
  supportUserName?: string | null;
  handleExitSupport?: () => void;
}

export function AdminLayout({
  children,
  menuItems,
  activeTab,
  setActiveTab,
  userEmail,
  handleLogout,
  isSupport,
  supportUserName,
  handleExitSupport
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-orange selection:text-white">
      {/* Support Mode Bar */}
      {isSupport && (
        <div className="fixed top-0 left-0 w-full z-[100] bg-brand-orange text-white py-2 px-6 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-[10px] uppercase tracking-widest font-bold">
              MODO SUPORTE ATIVO: Visualizando como <span className="underline">{supportUserName}</span>
            </p>
          </div>
          <button 
            onClick={handleExitSupport}
            className="bg-brand-dark text-white px-4 py-1 text-[9px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all rounded-sm border border-brand-dark"
          >
            Sair do Suporte
          </button>
        </div>
      )}

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-6 right-6 z-[60]">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 bg-brand-orange text-white rounded-full shadow-2xl"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed inset-y-0 left-0 w-72 bg-black border-r border-white/5 z-50 flex flex-col"
          >
            <div className="p-10">
              <h1 className="text-2xl font-serif italic tracking-tighter text-white">
                Danzamerica<span className="text-brand-orange">.</span>
                <span className="block text-[8px] uppercase tracking-[0.5em] mt-1 text-white/30 font-sans font-bold">Admin Panel</span>
              </h1>
            </div>

            <nav className="flex-1 px-6 space-y-2 py-4 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all group rounded-sm ${
                    activeTab === item.id 
                      ? 'bg-brand-orange text-white shadow-[0_0_20px_rgba(190,49,68,0.2)]' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-white/50'}`} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="px-10 py-8 mt-auto border-t border-white/5 space-y-8">
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-[0.2em] text-white/30 font-bold">Logado como</p>
                <p className="text-[11px] text-white/60 truncate font-sans">{userEmail || 'Admin'}</p>
              </div>

              <div className="space-y-4">
                <a 
                  href="/" 
                  target="_blank" 
                  className="flex items-center gap-3 text-white/40 hover:text-white transition-all group"
                >
                  <div className="p-2 bg-white/5 rounded-sm group-hover:bg-brand-orange/20 transition-all">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold">Ver Site Público</span>
                </a>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 text-white/40 hover:text-red-500 transition-all group"
                >
                  <div className="p-2 bg-white/5 rounded-sm group-hover:bg-red-500/20 transition-all">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold">Sair do Sistema</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`transition-all duration-500 min-h-screen ${isSidebarOpen ? 'lg:pl-72' : 'pl-0'} ${isSupport ? 'pt-12' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-12 lg:px-16 lg:py-20">
          {children}
        </div>
      </main>
    </div>
  );
}
