import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info';
  hideCancel?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmLabel, 
  cancelLabel = 'Cancelar', 
  onConfirm, 
  onCancel,
  variant = 'danger',
  hideCancel = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: 'text-red-500 bg-red-500/10 border-red-500/20',
    warning: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20',
    info: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  };

  const btnColors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-brand-orange hover:bg-brand-dark',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-[#111] border border-white/10 w-full max-w-sm overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[3rem]"
        >
          <div className="p-10 md:p-12 flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl transition-transform hover:scale-110 ${colors[variant]}`}>
              <AlertTriangle className="w-10 h-10" strokeWidth={1.5} />
            </div>

            <p className="text-brand-orange text-[9px] uppercase tracking-[0.4em] font-black mb-3 italic opacity-60">CONFIRMAÇÃO NECESSÁRIA</p>
            <h3 className="text-2xl font-serif italic text-white mb-4 leading-tight">{title}</h3>
            <p className="text-sm text-white/40 mb-10 leading-relaxed italic px-2">
              {message}
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={onConfirm}
                className={`w-full py-6 text-white text-[10px] uppercase tracking-[0.4em] font-black transition-all rounded-2xl shadow-xl active:scale-95 ${btnColors[variant]}`}
              >
                {confirmLabel}
              </button>
              {!hideCancel && (
                <button 
                  onClick={onCancel}
                  className="w-full py-6 text-white/20 text-[9px] uppercase tracking-[0.4em] font-black hover:text-white transition-colors"
                >
                  {cancelLabel}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
