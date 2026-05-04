import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, CreditCard, Copy, Target, ExternalLink } from 'lucide-react';
import { useEventTracking } from '../hooks/useEventTracking';

export function DonationDropdown({ variant = 'default', pixKey, vakinhaUrl }: { variant?: 'default' | 'large', pixKey?: string, vakinhaUrl?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);
  const { trackEvent } = useEventTracking();

  const finalPixKey = pixKey || "ballettatianafigueiredo@gmail.com";
  const finalVakinhaUrl = vakinhaUrl || "https://www.vakinha.com.br/vaquinha/talentos-de-minas-nossa-turma-no-palco-internacional";

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(finalPixKey);
      setCopied(true);
      trackEvent('Copiar PIX', 'click');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Only close if it's NOT clicking on the portal content
        // This is tricky with Portals, but usually the overlay click handles it.
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white text-brand-dark shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 md:p-12 border border-black/5 overflow-y-auto max-h-[90vh] z-[10000]"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 p-2 text-brand-dark/40 hover:text-brand-orange transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-5 border-b border-black/5 pb-6">
                <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-brand-orange" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Opção 01</p>
                  <h4 className="text-xl font-serif">Doação via PIX</h4>
                </div>
              </div>
              
              <div className="bg-brand-grey p-6 flex flex-col gap-4">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Chave PIX (Copia e Cola)</p>
                <div className="flex justify-between items-center bg-white p-4 border border-black/5">
                  <code className="text-xs font-mono break-all">{finalPixKey}</code>
                  <button 
                    onClick={handleCopyPix}
                    className="p-3 hover:bg-brand-grey transition-colors text-brand-orange ml-4"
                    title="Copiar Chave"
                  >
                    {copied ? <span className="text-[10px] font-bold uppercase tracking-tighter">Copiado!</span> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-5 border-b border-black/5 pb-6 pt-2">
                <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-brand-orange" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Opção 02</p>
                  <h4 className="text-xl font-serif">Campanha Vakinha</h4>
                </div>
              </div>

              <a 
                href={finalVakinhaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('Acessar Vakinha', 'click')}
                className="w-full bg-brand-dark text-white py-5 text-center font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-brand-orange transition-all flex items-center justify-center gap-4 shadow-lg"
              >
                Acessar Vakinha <ExternalLink className="w-4 h-4" />
              </a>

              <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 leading-relaxed text-center italic mt-4">
                Sua ajuda cobre custos de 22 bailarinos mineiros em Córdoba, Argentina.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative inline-block" ref={dropdownRef}>
       <motion.button 
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
         onClick={toggleOpen}
         className={
           variant === 'large' 
           ? "bg-brand-orange text-white px-12 py-5 font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all flex items-center gap-4 group"
           : "bg-brand-orange text-white px-4 sm:px-10 py-3 sm:py-4 text-[10px] sm:text-xs uppercase tracking-widest font-bold hover:bg-black transition-all shadow-lg"
         }
       >
         {variant === 'large' ? 'Apoie Agora' : 'Doar Agora'}
         {variant === 'large' && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
       </motion.button>

      {typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </div>
  );
}
