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
          onClick={onCancel || onConfirm}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#111] border border-white/10 w-full max-w-md p-8 shadow-2xl rounded-sm"
        >
          <button 
            onClick={onCancel || onConfirm}
            className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className={`p-4 rounded-full mb-6 ${colors[variant]}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-serif italic text-white mb-2">{title}</h3>
            <p className="text-sm text-white/60 mb-8 leading-relaxed font-sans">
              {message}
            </p>

            <div className="flex gap-3 w-full">
              {!hideCancel && (
                <button 
                  onClick={onCancel}
                  className="flex-1 px-6 py-4 border border-white/10 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-all"
                >
                  {cancelLabel}
                </button>
              )}
              <button 
                onClick={onConfirm}
                className={`flex-1 px-6 py-4 text-white text-[10px] uppercase tracking-widest font-bold transition-all ${btnColors[variant]}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
