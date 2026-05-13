import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  show: boolean;
  message: string;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ show, message, variant = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -100, x: '-50%', transition: { duration: 0.2 } }}
          className="fixed top-12 sm:top-8 left-1/2 z-[200000] w-[calc(100%-3rem)] max-w-sm"
        >
          <div className={`p-4 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex items-center gap-4 backdrop-blur-md border border-white/20 ${
            variant === 'success' ? 'bg-emerald-500 text-white' :
            variant === 'danger' ? 'bg-red-500 text-white' :
            variant === 'warning' ? 'bg-yellow-500 text-brand-dark' :
            'bg-brand-dark text-white'
          }`}>
            <div className="shrink-0">
              {variant === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {variant === 'danger' && <XCircle className="w-5 h-5" />}
              {variant === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {variant === 'info' && <Info className="w-5 h-5" />}
            </div>
            <p className="flex-1 text-[10px] uppercase tracking-widest font-bold leading-tight">
              {message}
            </p>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
