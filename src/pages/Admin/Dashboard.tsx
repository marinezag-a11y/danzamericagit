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
  Heart,
  Star,
  DollarSign
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
import { HelpItemsManager } from './components/HelpItemsManager';
import { FinancialManager } from './components/FinancialManager';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  useEffect(() => {
    const isSupport = localStorage.getItem('support_mode') === 'true';
    const supportPerms = localStorage.getItem('support_permissions');

    const getPerms = async () => {
      setLoadingPermissions(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);

        if (isSupport && supportPerms) {
          setUserPermissions(JSON.parse(supportPerms));
        } else if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('permissions')
            .eq('id', user.id)
            .single();
          
          setUserPermissions(profile?.permissions || []);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
      } finally {
        setLoadingPermissions(false);
      }
    };

    getPerms();
  }, []);

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
    { id: 'help', label: 'Compre um sonho', icon: Heart },
    { id: 'gallery', label: 'Galeria de Fotos', icon: Images },
    { id: 'sponsorship', label: 'Apoiadores', icon: Star },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'banners', label: 'Banners Iniciais', icon: ImageIcon },
    { id: 'users', label: 'Administradores', icon: Users },
  ].filter(item => userPermissions.includes(item.id));

  // Redirect to first allowed tab if current is not allowed
  useEffect(() => {
    if (!loadingPermissions && userPermissions.length > 0) {
      if (!userPermissions.includes(activeTab)) {
        setActiveTab(userPermissions[0]);
      }
    }
  }, [loadingPermissions, userPermissions, activeTab]);

  if (loadingPermissions) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/40">Verificando Permissões</p>
      </div>
    </div>
  );

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

              <a 
                href="https://wa.me/5531984211900"
                target="_blank"
                className="flex items-center gap-3 pt-6 border-t border-white/5 group"
              >
                <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center group-hover:bg-brand-orange/20 transition-all shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-brand-orange">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.035c0 2.123.554 4.197 1.608 6.022L0 24l6.117-1.605a11.847 11.847 0 005.932 1.577h.005c6.631 0 12.032-5.396 12.035-12.035.002-3.217-1.253-6.241-3.535-8.522z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/30 font-bold">Desenvolvedor</p>
                  <p className="text-[10px] text-white/60 font-sans truncate">Farizo — (31) 98421-1900</p>
                </div>
              </a>
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
              {activeTab === 'help' && <HelpItemsManager onAlert={onAlert} />}
              {activeTab === 'gallery' && <GalleryManager onAlert={onAlert} />}
              {activeTab === 'sponsorship' && <SponsorshipManager onAlert={onAlert} />}
              {activeTab === 'financial' && <FinancialManager onAlert={onAlert} />}
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
