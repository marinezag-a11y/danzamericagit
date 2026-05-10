import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { AdminLayout } from './layouts/AdminLayout';
import { AlertCenter, Alert } from './components/AlertCenter';
import { ADMIN_MENU_ITEMS } from './config/menu';

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
import { RaffleManager } from './components/RaffleManager';
import { DancersManager } from './components/DancersManager';

export default function Dashboard() {
  const {
    userEmail,
    userRole,
    userPermissions,
    loading,
    isSupport,
    supportUserName,
    handleLogout,
    handleExitSupport
  } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [visitedTabs, setVisitedTabs] = useState<string[]>(['profile']);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const onAlert = (title: string, message: string, variant: Alert['variant']) => {
    const id = Math.random().toString(36).substring(7);
    setAlerts(prev => [...prev, { id, title, message, variant }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const menuItems = userPermissions ? ADMIN_MENU_ITEMS.filter(item => userPermissions.includes(item.id)) : [];

  // Redirect to first allowed tab if current is not allowed
  useEffect(() => {
    if (!loading && userPermissions.length > 0) {
      if (!userPermissions.includes(activeTab)) {
        const target = userPermissions[0];
        setActiveTab(target);
        if (!visitedTabs.includes(target)) {
          setVisitedTabs(prev => [...prev, target]);
        }
      }
    }
  }, [loading, userPermissions, activeTab]);

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/40">Verificando Permissões</p>
      </div>
    </div>
  );

  return (
    <AdminLayout
      menuItems={menuItems}
      activeTab={activeTab}
      setActiveTab={(id) => {
        setActiveTab(id);
        if (!visitedTabs.includes(id)) setVisitedTabs(prev => [...prev, id]);
      }}
      userEmail={userEmail}
      handleLogout={handleLogout}
      isSupport={isSupport}
      supportUserName={supportUserName}
      handleExitSupport={handleExitSupport}
    >
      <div className="relative">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <motion.div
              key={item.id}
              initial={isActive ? { opacity: 1, scale: 1, display: 'block' } : { opacity: 0, scale: 0.98, display: 'none' }}
              animate={isActive ? { 
                opacity: 1, 
                scale: 1,
                y: 0,
                display: 'block',
                transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] }
              } : { 
                opacity: 0, 
                scale: 0.98,
                y: 10,
                transitionEnd: { display: 'none' },
                transition: { duration: 0.15, ease: 'easeIn' }
              }}
              className="w-full"
            >
              {/* Tab Title */}
              <div className="mb-16">
                <p className="text-brand-orange text-[10px] uppercase tracking-[0.5em] font-bold mb-4">
                  {item.label}
                </p>
                <h2 className="text-5xl lg:text-6xl font-serif text-white italic tracking-tight">
                  Gerenciamento<span className="text-brand-orange opacity-50">.</span>
                </h2>
              </div>

              {/* Lazy Content Rendering */}
              <div className="min-h-[400px]">
                {visitedTabs.includes(item.id) ? ( 
                  <>
                    {item.id === 'profile' && <ProfileManager userRole={userRole} />}
                    {item.id === 'analytics' && <AnalyticsDashboard onAlert={onAlert} />}
                    {item.id === 'orders' && <OrdersManager onAlert={onAlert} userRole={userRole} />}
                    {item.id === 'content' && <ContentEditor onAlert={onAlert} />}
                    {item.id === 'help' && <HelpItemsManager onAlert={onAlert} />}
                    {item.id === 'raffles' && <RaffleManager onAlert={onAlert} userRole={userRole} />}
                    {item.id === 'gallery' && <GalleryManager onAlert={onAlert} />}
                    {item.id === 'sponsorship' && <SponsorshipManager onAlert={onAlert} />}
                    {item.id === 'financial' && <FinancialManager onAlert={onAlert} userRole={userRole} />}
                    {item.id === 'banners' && <BannerManager onAlert={onAlert} />}
                    {item.id === 'users' && <UserManager onAlert={onAlert} userRole={userRole} />}
                  </>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AlertCenter 
        alerts={alerts} 
        onClose={(id) => setAlerts(prev => prev.filter(a => a.id !== id))} 
      />
    </AdminLayout>
  );
}
