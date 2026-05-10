import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Ticket, Loader2, Share2 } from 'lucide-react';
import { useRaffles, RaffleCampaign } from '../hooks/useRaffles';
import { DancerSponsorshipModal } from './modals/DancerSponsorshipModal';
import { Toast } from './ui/Toast';

export function RaffleSection() {
  const { campaigns, loading, fetchTakenTickets } = useRaffles();
  const [selectedCampaign, setSelectedCampaign] = useState<RaffleCampaign | null>(null);
  const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ show: boolean, message: string, variant: 'success' | 'danger' | 'warning' | 'info' }>({
    show: false,
    message: '',
    variant: 'success'
  });

  const showToast = (message: string, variant: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
    setToast({ show: true, message, variant });
  };

  const activeCampaigns = campaigns.filter(c => c.is_active);

  useEffect(() => {
    const loadProgress = async () => {
      const counts: Record<string, number> = {};
      for (const campaign of activeCampaigns) {
        const taken = await fetchTakenTickets(campaign.id);
        counts[campaign.id] = taken.length;
      }
      setSoldCounts(counts);
    };
    if (activeCampaigns.length > 0) {
      loadProgress();
      
      // Auto-open campaign from URL parameter ?rifa=ID
      const params = new URLSearchParams(window.location.search);
      const raffleId = params.get('rifa');
      if (raffleId) {
        const campaign = activeCampaigns.find(c => c.id === raffleId);
        if (campaign) {
          setSelectedCampaign(campaign);
          // Scroll to section
          document.getElementById('rifas')?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [campaigns]);

  if (loading && campaigns.length === 0) return null;
  if (activeCampaigns.length === 0) return null;

  return (
    <section id="rifas" className="py-24 bg-brand-white px-6 lg:px-12 border-t border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-xl">
            <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">Ações entre Amigos</p>
            <h2 className="text-5xl md:text-7xl text-brand-dark mb-8 leading-tight font-serif">
              Garanta seu <br /><span className="italic">Número da Sorte</span>
            </h2>
          </div>
          <p className="text-brand-dark/40 text-sm font-serif max-w-xs mb-4 italic">
            Participe de nossas ações premiadas e ajude a financiar a nossa viagem para a Argentina.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {activeCampaigns.map((campaign, idx) => (
            <motion.div 
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-brand-grey group flex flex-col overflow-hidden hover:shadow-[0_64px_128px_-16px_rgba(0,0,0,0.15)] transition-all duration-700 cursor-pointer rounded-[3rem] border border-black/5"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="w-full aspect-video relative overflow-hidden bg-white">
                <img 
                  src={campaign.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=1200&auto=format&fit=crop'} 
                  alt={campaign.name}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700" />
              </div>
              <div className="p-8 sm:p-12 flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Ticket className="w-4 h-4 text-brand-orange" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-orange">Sorteio Ativo</span>
                  </div>
                  <h3 className="text-3xl font-serif italic text-brand-dark mb-4 leading-tight group-hover:text-brand-orange transition-colors">
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-brand-dark/60 font-serif leading-relaxed mb-6">
                    {campaign.description}
                  </p>
                  <div className="space-y-6 mb-8">
                    <div className="flex justify-between items-end gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-brand-dark/20">Valor por número</p>
                        <p className="text-3xl font-display text-brand-dark leading-none">R$ {Number(campaign.price_per_number).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-brand-dark/20 mb-1">Status da Meta</p>
                        <p className="text-sm font-serif italic text-brand-orange font-bold leading-none">
                          {soldCounts[campaign.id] || 0} de {campaign.total_numbers} vendidos
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.min(100, ((soldCounts[campaign.id] || 0) / campaign.total_numbers) * 100)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-brand-orange to-[#ff6b6b] shadow-[0_0_15px_rgba(204,0,0,0.4)]"
                        />
                      </div>
                      <div className="flex justify-between text-[8px] uppercase tracking-widest font-bold text-brand-dark/20">
                        <span>Início</span>
                        <span className="text-brand-orange/40">{Math.round(((soldCounts[campaign.id] || 0) / campaign.total_numbers) * 100)}% Concluído</span>
                        <span>Meta</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                  <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-brand-orange hover:gap-4 transition-all">
                    Escolher Números <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = `${window.location.origin}${window.location.pathname}?rifa=${campaign.id}`;
                      navigator.clipboard.writeText(url);
                      showToast('Link da campanha copiado!', 'success');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white transition-all rounded-full group/share border border-brand-orange/20"
                    title="Copiar link desta campanha"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-[9px] uppercase tracking-widest font-black">Copiar Link</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedCampaign && (
          <DancerSponsorshipModal 
            campaignId={selectedCampaign.id}
            isOpen={!!selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
          />
        )}
      </AnimatePresence>
      <Toast 
        show={toast.show} 
        message={toast.message} 
        variant={toast.variant} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
    </section>
  );
}
