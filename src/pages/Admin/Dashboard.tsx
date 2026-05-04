import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Settings, 
  Images, 
  ShoppingBag, 
  LogOut, 
  ImageIcon, 
  Users, 
  User,
  X,
  Menu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Heart
} from 'lucide-react';

// Modular Components
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { OrdersManager } from './components/OrdersManager';
import { ContentEditor } from './components/ContentEditor';
import { GalleryManager } from './components/GalleryManager';
import { SponsorshipManager } from './components/SponsorshipManager';
import { BannerManager } from './components/BannerManager';
import { UserManager } from './components/UserManager';
import { ProfileManager } from './components/ProfileManager';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  const onAlert = (title: string, message: string, variant: 'danger' | 'warning' | 'info') => {
    const id = Math.random().toString(36).substring(7);
    setAlerts(prev => [...prev, { id, title, message, variant }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'analytics', label: 'Estatísticas', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos Recebidos', icon: ShoppingBag },
    { id: 'content', label: 'Conteúdo Geral', icon: Settings },
    { id: 'gallery', label: 'Galeria de Fotos', icon: Images },
    { id: 'sponsorship', label: 'Apoiadores', icon: Heart },
    { id: 'banners', label: 'Banners Iniciais', icon: ImageIcon },
    { id: 'users', label: 'Administradores', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-orange selection:text-white">
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

            <nav className="flex-1 px-6 space-y-2 py-4">
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
                      : 'text-white/30 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-white' : 'text-white/20'}`} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-8 mt-auto border-t border-white/5">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-red-500 hover:bg-red-500/5 transition-all rounded-sm border border-transparent hover:border-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                Sair do Sistema
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`transition-all duration-500 min-h-screen ${isSidebarOpen ? 'lg:pl-72' : 'pl-0'}`}>
        <div className="max-w-7xl mx-auto px-6 py-12 lg:px-16 lg:py-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-16">
                <p className="text-brand-orange text-[10px] uppercase tracking-[0.5em] font-bold mb-4">
                  {menuItems.find(m => m.id === activeTab)?.label}
                </p>
                <h2 className="text-5xl lg:text-6xl font-serif text-white italic tracking-tight">
                  Gerenciamento<span className="text-brand-orange opacity-50">.</span>
                </h2>
              </div>

              {activeTab === 'profile' && <ProfileManager />}
              {activeTab === 'analytics' && <AnalyticsDashboard onAlert={onAlert} />}
              {activeTab === 'orders' && <OrdersManager onAlert={onAlert} />}
              {activeTab === 'content' && <ContentEditor onAlert={onAlert} />}
              {activeTab === 'gallery' && <GalleryManager onAlert={onAlert} />}
              {activeTab === 'sponsorship' && <SponsorshipManager onAlert={onAlert} />}
              {activeTab === 'banners' && <BannerManager onAlert={onAlert} />}
              {activeTab === 'users' && <UserManager onAlert={onAlert} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Alerts Container */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 max-w-sm w-full">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-5 rounded-sm shadow-2xl flex items-start gap-4 border-l-4 backdrop-blur-md ${
                alert.variant === 'danger' 
                  ? 'bg-red-500/10 border-red-500 text-red-500' 
                  : alert.variant === 'warning'
                  ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                  : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
              }`}
            >
              <div className="mt-0.5">
                {alert.variant === 'danger' && <XCircle className="w-5 h-5" />}
                {alert.variant === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {alert.variant === 'info' && <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] uppercase tracking-widest font-bold mb-1">{alert.title}</h4>
                <p className="text-sm font-sans opacity-80 leading-relaxed">{alert.message}</p>
              </div>
              <button 
                onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="opacity-40 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Page Transition Overlay */}
      <AnimatePresence>
        {activeTab === 'loading' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-dark flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
              <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/40">Sincronizando Sistema</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
