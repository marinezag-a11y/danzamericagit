import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Ticket, Loader2 } from 'lucide-react';
import { useRaffles, RaffleCampaign } from '../hooks/useRaffles';
import { DancerSponsorshipModal } from './modals/DancerSponsorshipModal';

export function RaffleSection() {
  const { campaigns, loading, fetchTakenTickets } = useRaffles();
  const [selectedCampaign, setSelectedCampaign] = useState<RaffleCampaign | null>(null);
  const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});

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
    }
  }, [campaigns]);

  if (loading && campaigns.length === 0) return null;
  if (activeCampaigns.length === 0) return null;

  return (
    <section className="py-24 bg-brand-white px-6 lg:px-12 border-t border-black/5">
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
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-brand-grey group flex flex-col md:flex-row overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="md:w-1/2 aspect-square md:aspect-auto relative overflow-hidden bg-white">
                <img 
                  src={campaign.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=1200&auto=format&fit=crop'} 
                  alt={campaign.name}
                  className="w-full h-full object-cover transition-all duration-1000 scale-[1.6] group-hover:scale-[1.8]"
                />
              </div>
              <div className="md:w-1/2 p-10 flex flex-col justify-between">
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
                <button className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-bold text-brand-orange">
                  Escolher Números <ChevronRight className="w-4 h-4" />
                </button>
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
    </section>
  );
}
