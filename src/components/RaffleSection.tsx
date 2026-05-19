import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Ticket, Loader2, Share2, Check } from 'lucide-react';
import { useRaffles, RaffleCampaign } from '../hooks/useRaffles';
import { DancerSponsorshipModal } from './modals/DancerSponsorshipModal';
import { Toast } from './ui/Toast';
import { RaffleRanking } from './RaffleRanking';

export function RaffleSection() {
  const { campaigns, loading, fetchTakenTickets } = useRaffles();
  const [selectedCampaign, setSelectedCampaign] = useState<RaffleCampaign | null>(null);
  const [activeSoldOutCampaign, setActiveSoldOutCampaign] = useState<RaffleCampaign | null>(null);
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
      
      const params = new URLSearchParams(window.location.search);
      const raffleId = params.get('rifa');
      if (raffleId) {
        const campaign = activeCampaigns.find(c => c.id === raffleId);
        if (campaign) {
          const isSoldOut = (soldCounts[campaign.id] || 0) >= campaign.total_numbers;
          if (isSoldOut) {
            setActiveSoldOutCampaign(campaign);
          } else {
            setSelectedCampaign(campaign);
          }
          document.getElementById('rifas')?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [campaigns]);

  if (loading && campaigns.length === 0) return null;
  if (activeCampaigns.length === 0) return null;

  return (
    <section id="rifas" className="py-24 bg-brand-white px-6 lg:px-12 border-t border-black/5 relative overflow-hidden">
      {/* Sold Out Overlay / Celebration */}
      <AnimatePresence>
        {activeSoldOutCampaign && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-brand-dark/95 backdrop-blur-xl"
            onClick={() => setActiveSoldOutCampaign(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-xl w-full bg-white rounded-[3rem] p-12 text-center relative overflow-hidden shadow-[0_64px_128px_-16px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Confetti Animation Elements */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [-20, 500],
                    x: [0, (i % 2 === 0 ? 100 : -100) * Math.random()],
                    rotate: [0, 360],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2, 
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                  className={`absolute w-2 h-2 rounded-sm ${['bg-brand-orange', 'bg-amber-400', 'bg-emerald-400', 'bg-blue-400'][i % 4]}`}
                  style={{ top: -20, left: `${(i * 10) + 5}%` }}
                />
              ))}

              <div className="relative z-10">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Check className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                </div>
                <h3 className="text-4xl font-serif italic text-brand-dark mb-6">Meta Cumprida!</h3>
                <p className="text-brand-dark/60 text-lg font-serif mb-8 leading-relaxed">
                  Todos os números para a ação <span className="text-brand-dark font-black underline decoration-brand-orange/30">"{activeSoldOutCampaign.name}"</span> foram esgotados.
                </p>
                <div className="p-8 bg-brand-orange/5 rounded-[2rem] border border-brand-orange/10 mb-10">
                  <p className="text-sm font-serif italic text-brand-orange font-bold">
                    "Obrigado por ser a ponte para os nossos sonhos. Sua generosidade nos levará mais longe!"
                  </p>
                </div>
                <button 
                  onClick={() => setActiveSoldOutCampaign(null)}
                  className="w-full py-6 bg-brand-dark text-white rounded-2xl text-[10px] uppercase tracking-[0.4em] font-black hover:bg-brand-orange transition-all"
                >
                  CONCLUIR E CONTINUAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-xl">
            <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">Ações entre Amigos</p>
            <h2 className="text-5xl md:text-7xl text-brand-dark mb-0 leading-tight font-serif">
              Apoie nossos <br /><span className="italic">Talentos</span>
            </h2>
          </div>
          <p className="text-brand-dark/40 text-sm font-serif max-w-xs mb-4 italic text-right">
            Participe de nossas ações premiadas e ajude a financiar a nossa jornada internacional.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content: Campaigns */}
          <div className="flex-1 space-y-12 order-2 lg:order-1">
            {activeCampaigns.map((campaign, idx) => (
              <motion.div 
                key={campaign.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-brand-grey group flex flex-col md:flex-row overflow-hidden hover:shadow-[0_64px_128px_-16px_rgba(0,0,0,0.15)] transition-all duration-700 cursor-pointer rounded-[3rem] border border-black/5 relative"
                onClick={() => {
                  const isSoldOut = (soldCounts[campaign.id] || 0) >= campaign.total_numbers;
                  if (isSoldOut) {
                    setActiveSoldOutCampaign(campaign);
                  } else {
                    setSelectedCampaign(campaign);
                  }
                }}
              >
                {/* Tarja Diagonal de Campanha Finalizada */}
                {(soldCounts[campaign.id] || 0) >= campaign.total_numbers && (
                  <div className="absolute top-0 left-0 overflow-hidden w-40 h-40 z-20 pointer-events-none">
                    <div className="absolute top-8 -left-12 w-56 bg-emerald-600 text-white text-[9px] uppercase tracking-[0.2em] font-black py-2.5 text-center -rotate-45 shadow-lg border-y border-white/20 flex items-center justify-center gap-1.5 backdrop-blur-sm bg-emerald-600/90">
                      Finalizada{campaign.completion_text ? ` - ${campaign.completion_text}` : ''}
                    </div>
                  </div>
                )}

                <div className="w-full md:w-2/5 aspect-video md:aspect-auto relative overflow-hidden bg-white">
                  <img 
                    src={campaign.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=1200&auto=format&fit=crop'} 
                    alt={campaign.name}
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 animate-pan"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700" />
                </div>
                <div className="p-8 sm:p-12 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      {(soldCounts[campaign.id] || 0) >= campaign.total_numbers ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-600">Meta Concluída</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-4 h-4 text-brand-orange" />
                          <span className="text-[10px] uppercase tracking-widest font-bold text-brand-orange">Ação Ativa</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-3xl font-serif italic text-brand-dark mb-4 leading-tight group-hover:text-brand-orange transition-colors">
                      {campaign.name}
                    </h3>

                    {campaign.description && (
                      <p className="text-brand-dark/60 text-sm font-serif mb-8 italic leading-relaxed whitespace-pre-line">
                        {campaign.description}
                      </p>
                    )}
                    
                    <div className="space-y-8 mb-10">
                      <div className="flex items-center justify-between gap-4 p-8 bg-brand-grey/50 rounded-[2.5rem] border border-black/[0.03]">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-widest font-bold text-brand-dark/20">Investimento</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-brand-dark/40">R$</span>
                            <span className="text-4xl font-display text-brand-dark leading-none">{Number(campaign.price_per_number).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="h-12 w-px bg-black/10" />

                        <div className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-5xl font-serif italic text-brand-orange font-bold leading-none mb-1">
                              {Math.round(((soldCounts[campaign.id] || 0) / (campaign.total_numbers || 1)) * 100)}%
                            </span>
                            <p className="text-[9px] uppercase tracking-widest font-bold text-brand-dark/20">Meta Cumprida</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="w-full h-4 bg-black/5 rounded-full overflow-hidden relative border border-black/5 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${Math.min(100, ((soldCounts[campaign.id] || 0) / (campaign.total_numbers || 1)) * 100)}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full bg-brand-orange relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white/30" />
                            <motion.div 
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="absolute top-0 bottom-0 w-20 bg-white/20 skew-x-[-20deg]"
                            />
                          </motion.div>
                        </div>
                        <div className="flex justify-between items-center px-2">
                           <p className="text-[10px] uppercase tracking-widest font-bold text-brand-dark/20">Status das Vendas</p>
                           <p className="text-[11px] font-serif italic text-brand-dark/60 font-medium">
                              <span className="text-brand-orange font-bold">{(soldCounts[campaign.id] || 0).toLocaleString()}</span> de <span className="font-bold">{campaign.total_numbers.toLocaleString()}</span> bilhetes garantidos
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const isSoldOut = (soldCounts[campaign.id] || 0) >= campaign.total_numbers;
                        if (isSoldOut) {
                          setActiveSoldOutCampaign(campaign);
                        } else {
                          setSelectedCampaign(campaign);
                        }
                      }}
                      className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold ${
                        (soldCounts[campaign.id] || 0) >= campaign.total_numbers 
                          ? 'text-emerald-600' 
                          : 'text-brand-orange'
                      } hover:gap-4 transition-all`}
                    >
                      {(soldCounts[campaign.id] || 0) >= campaign.total_numbers 
                        ? 'Meta Cumprida! ✨' 
                        : 'Escolher Números'} <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}${window.location.pathname}?rifa=${campaign.id}`;
                        navigator.clipboard.writeText(url);
                        showToast('Link copiado!', 'success');
                      }}
                      className="p-3 bg-brand-orange/5 hover:bg-brand-orange text-brand-orange hover:text-white transition-all rounded-full border border-brand-orange/10"
                      title="Copiar link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sidebar: Ranking */}
          <aside className="w-full lg:w-[400px] order-1 lg:order-2">
            <div className="sticky top-32">
              <RaffleRanking />
              
              <div className="mt-8 p-6 bg-brand-orange/5 border border-brand-orange/10 rounded-[2rem] text-center">
                <p className="text-xs text-brand-dark/40 font-serif italic mb-4">"Cada número adquirido é um passo a mais <br />na realização de um sonho coletivo."</p>
                <div className="flex justify-center gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 rounded-full bg-brand-orange/20" />)}
                </div>
              </div>
            </div>
          </aside>
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
