import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function SupportBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [isSupportMode, setIsSupportMode] = React.useState(
    localStorage.getItem('support_mode') === 'true' && isAdminRoute
  );
  const [impersonatedUser, setImpersonatedUser] = React.useState(localStorage.getItem('support_user_name') || 'Usuário');

  React.useEffect(() => {
    const checkSupport = () => {
      const active = localStorage.getItem('support_mode') === 'true' && isAdminRoute;
      setIsSupportMode(active);
      setImpersonatedUser(localStorage.getItem('support_user_name') || 'Usuário');
      
      if (active) {
        document.body.style.paddingTop = '45px';
      } else {
        document.body.style.paddingTop = '0px';
      }
    };
    
    checkSupport();
    
    return () => {
      document.body.style.paddingTop = '0px';
    };
  }, [location.pathname, isAdminRoute]);

  if (!isSupportMode) return null;

  const handleExit = () => {
    localStorage.removeItem('support_mode');
    localStorage.removeItem('support_user_name');
    document.body.style.paddingTop = '0px';
    window.location.reload();
  };

  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 inset-x-0 z-[9999] bg-brand-orange text-white py-2 px-6 shadow-2xl flex items-center justify-between border-b border-white/20 backdrop-blur-md"
    >
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-1.5 rounded-full animate-pulse">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold leading-none">Modo de Suporte Ativado</p>
          <p className="text-[9px] opacity-80 uppercase tracking-wider mt-0.5">Visualizando o sistema como: <span className="font-bold">{impersonatedUser}</span></p>
        </div>
      </div>

      <button 
        onClick={handleExit}
        className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/40 text-[9px] uppercase tracking-widest font-bold transition-all rounded-sm border border-white/10"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Sair do Modo Suporte
      </button>
    </motion.div>
  );
}
