import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Calendar, Phone, Instagram, Mail, MapPin } from 'lucide-react';

export type ModalType = 'store' | 'raffle' | 'event' | 'donation' | 'contact' | null;

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

const PRODUCTS: Product[] = [
  {
    id: 'mug-01',
    name: 'Caneca do Bem',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2670&auto=format&fit=crop',
    description: 'Caneca oficial do projeto Talentos de Minas. Edição limitada.'
  },
  {
    id: 'shirt-01',
    name: 'Camiseta do Projeto',
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2670&auto=format&fit=crop',
    description: 'Camiseta técnica em tecido respirável, com logo oficial.'
  }
];

interface MainModalProps {
  activeModal: ModalType;
  onClose: () => void;
}

export function MainModal({ activeModal, onClose }: MainModalProps) {
  const modalContent = (
    <AnimatePresence>
      {activeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6 py-10 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark/95 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-brand-white w-full max-w-4xl p-8 md:p-16 max-h-[90vh] overflow-y-auto z-[10000] shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 text-brand-dark/20 hover:text-brand-orange transition-colors"
            >
              <X className="w-8 h-8" strokeWidth={1} />
            </button>

            {activeModal === 'store' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div>
                  <h2 className="text-4xl mb-8 font-serif text-brand-dark">Itens Solidários</h2>
                  <div className="space-y-4">
                    {PRODUCTS.map(product => (
                      <div key={product.id} className="p-6 bg-brand-grey group flex gap-6 items-center">
                        <img src={product.image} className="w-24 h-24 object-cover" alt={product.name} />
                        <div className="flex-1">
                          <h4 className="font-serif text-xl text-brand-dark">{product.name}</h4>
                          <p className="text-brand-orange font-display">R$ {product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-brand-grey p-8 flex flex-col justify-between">
                  <button className="w-full bg-brand-orange text-white py-5 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-dark transition-all shadow-lg">
                    Solicitar via WhatsApp
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'raffle' && (
              <div className="max-w-xl mx-auto text-center">
                <Ticket className="w-16 h-16 text-brand-orange mx-auto mb-8" strokeWidth={1} />
                <h2 className="text-5xl mb-4 font-serif text-brand-dark">Ação entre Amigos</h2>
                <div className="bg-brand-grey p-12 mb-8 text-5xl font-display text-brand-orange shadow-inner">R$ 25,00</div>
              </div>
            )}

            {activeModal === 'event' && (
              <div className="max-w-xl mx-auto text-center">
                <Calendar className="w-16 h-16 text-brand-orange mx-auto mb-8" strokeWidth={1} />
                <h2 className="text-5xl mb-4 font-serif text-brand-dark">Ação Junina</h2>
              </div>
            )}

            {activeModal === 'contact' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Entre em Contato</p>
                  <h2 className="text-4xl md:text-6xl font-serif text-brand-dark italic">Fale Conosco</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* WhatsApp */}
                  <a 
                    href="https://wa.me/5531993615488" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500 shadow-sm hover:shadow-xl"
                  >
                    <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                      <Phone className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">WhatsApp</p>
                      <p className="text-xl font-serif text-brand-dark group-hover:text-white">(31) 99361-5488</p>
                    </div>
                  </a>

                  {/* Instagram */}
                  <a 
                    href="https://instagram.com/nucleodedanca" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500 shadow-sm hover:shadow-xl"
                  >
                    <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                      <Instagram className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">Instagram</p>
                      <p className="text-xl font-serif text-brand-dark group-hover:text-white">@nucleodedanca</p>
                    </div>
                  </a>

                  {/* E-mail */}
                  <a 
                    href="mailto:nucleodedanca@yahoo.com.br" 
                    className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500 shadow-sm hover:shadow-xl"
                  >
                    <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">E-mail</p>
                      <p className="text-base md:text-xl font-serif text-brand-dark group-hover:text-white break-all">nucleodedanca@yahoo.com.br</p>
                    </div>
                  </a>

                  {/* Localização */}
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Av.+Abílio+Machado,+3997+–+Belo+Horizonte,+MG" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500 shadow-sm hover:shadow-xl"
                  >
                    <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">Endereço</p>
                      <p className="text-sm md:text-base font-serif text-brand-dark group-hover:text-white leading-tight">Av. Abílio Machado, 3997 – BH</p>
                    </div>
                  </a>
                </div>

                <div className="mt-12 pt-8 border-t border-brand-dark/5 text-center">
                  <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-brand-dark/20 italic">
                    Danzamerica 2026 • Talentos de Minas • Córdoba, Argentina
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
