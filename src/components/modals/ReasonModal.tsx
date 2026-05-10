import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send } from 'lucide-react';

interface ReasonModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ReasonModal({ 
  isOpen, 
  title, 
  message, 
  placeholder = 'Descreva o motivo aqui...',
  confirmLabel, 
  cancelLabel = 'Cancelar', 
  onConfirm, 
  onCancel,
  variant = 'warning'
}: ReasonModalProps) {
  const [reason, setReason] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-[#111] border border-white/10 w-full max-w-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[3.5rem] overflow-hidden"
        >
          <div className="p-10 md:p-12 flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl transition-transform hover:scale-110 ${colors[variant]}`}>
              <MessageSquare className="w-10 h-10" strokeWidth={1.5} />
            </div>

            <p className="text-brand-orange text-[9px] uppercase tracking-[0.4em] font-black mb-3 italic opacity-60">REGISTRO DE MOTIVAÇÃO</p>
            <h3 className="text-2xl font-serif italic text-white mb-4 leading-tight">{title}</h3>
            <p className="text-sm text-white/40 mb-8 leading-relaxed italic px-4">
              {message}
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-8">
              <textarea
                autoFocus required value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={placeholder}
                className="w-full h-40 p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] outline-none focus:bg-white/[0.05] focus:border-brand-orange/40 transition-all font-medium text-white text-sm resize-none placeholder:text-white/10"
              />

              <div className="flex flex-col gap-3 w-full">
                <button 
                  type="submit"
                  disabled={!reason.trim()}
                  className={`w-full py-6 text-white text-[10px] uppercase tracking-widest font-black transition-all rounded-2xl shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 ${btnColors[variant]}`}
                >
                  <Send className="w-4 h-4" />
                  {confirmLabel}
                </button>
                <button 
                  type="button" onClick={onCancel}
                  className="w-full py-4 text-white/20 text-[9px] uppercase tracking-[0.4em] font-black hover:text-white transition-colors"
                >
                  {cancelLabel}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
