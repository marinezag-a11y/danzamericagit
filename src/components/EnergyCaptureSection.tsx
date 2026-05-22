import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, Leaf, TreePine, ArrowRight, ShieldCheck, Copy, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EnergyAdesaoModal } from './modals/EnergyAdesaoModal';

interface Campaign {
  id: string;
  name: string;
  description: string;
  percentage?: number;
  image_url?: string;
  created_at: string;
}

export function EnergyCaptureSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  
  // Simulator State
  const [billValue, setBillValue] = useState<number>(300);
  const [years, setYears] = useState<number>(1);
  const [isEditingBill, setIsEditingBill] = useState(false);

  useEffect(() => {
    async function loadActiveCampaign() {
      try {
        if (!supabase) return;
        const { data } = await supabase
          .from('energy_campaigns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setCampaign(data);
        }
      } catch (err) {
        console.error('Error loading active energy campaign:', err);
      }
    }
    loadActiveCampaign();
  }, []);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#energia`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Calculations
  const percentage = campaign?.percentage || 15;
  const monthlySavings = billValue * (percentage / 100);
  const totalSavings = monthlySavings * 12 * years;
  
  // Metrics based on reference image: R$ 300/mo -> 320.4kg CO2/year and 100 trees/year
  const co2Avoided = (billValue * 1.068) * years; 
  const treesPlanted = Math.round((billValue / 3)) * years;

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  return (
    <section id="energia" className="py-24 bg-zinc-50 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-white to-zinc-50 pointer-events-none" />
      <div className="absolute top-1/4 -right-1/4 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-[8rem] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Copy & CTA */}
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/50 border border-emerald-200/50 text-emerald-700 text-[11px] font-black uppercase tracking-[0.15em] shadow-sm">
              <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              TATI ENERGY <span className="font-medium px-1 text-emerald-700/50">|</span> Economia limpa e renovável
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] text-zinc-900 font-serif tracking-tight leading-[1.05]">
              Energia inteligente para quem <span className="text-emerald-600 font-bold">valoriza</span> cada centavo.
            </h2>

            <p className="text-zinc-600 text-base sm:text-lg max-w-lg font-serif leading-relaxed">
              A <strong className="text-emerald-700">Tati Energy</strong> transforma sua conta de luz em Energia 100% limpa, sem investimentos e com economia automática na palma da sua mão. <br/><br/><span className="italic font-medium text-zinc-800 bg-emerald-100/50 px-2 py-1 rounded">E o propósito maior:</span> Ao economizar, você apoia automaticamente nossos bailarinos rumo ao Danzamerica. A sustentabilidade encontra a arte!
            </p>

            {/* Social Proof */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex -space-x-3">
                <img src="https://i.pravatar.cc/100?img=1" alt="Cliente" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                <img src="https://i.pravatar.cc/100?img=2" alt="Cliente" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                <img src="https://i.pravatar.cc/100?img=3" alt="Cliente" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div>
                <p className="text-emerald-600 font-bold text-sm tracking-tight">+R$ 600 mil clientes</p>
                <p className="text-zinc-500 text-xs font-medium">Economizando de forma sustentável</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleOpenModal}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-[15px] transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
              >
                Começar agora <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleShare}
                className="px-8 py-4 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer shadow-sm"
              >
                {copied ? <><Check className="w-5 h-5 text-emerald-500" /> Copiado!</> : <><Copy className="w-5 h-5" /> Compartilhar</>}
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Simulator */}
          <div className="w-full max-w-lg mx-auto lg:mx-0">
            <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-zinc-100 relative overflow-hidden">
              
              {/* Simulator Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-white fill-white" />
                </div>
                <h3 className="text-xl font-bold text-zinc-800">Simulador de Economia</h3>
              </div>

              {/* Slider Section */}
              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] uppercase tracking-widest font-black text-zinc-400">
                    Valor da sua conta de luz atual
                  </label>
                  <div className="flex items-center gap-2">
                    {isEditingBill ? (
                      <input 
                        type="number" 
                        autoFocus
                        value={billValue}
                        onChange={(e) => setBillValue(Number(e.target.value))}
                        onBlur={() => setIsEditingBill(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingBill(false)}
                        className="w-24 text-right text-2xl font-bold text-zinc-800 bg-zinc-100 rounded outline-none px-2 py-1"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-zinc-800 tabular-nums">
                        R$ {billValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                    <button onClick={() => setIsEditingBill(!isEditingBill)} className="text-zinc-400 hover:text-emerald-500 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="120"
                    max="10000"
                    step="10"
                    value={billValue}
                    onChange={(e) => setBillValue(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 relative z-10"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(billValue - 120) / (10000 - 120) * 100}%, #f4f4f5 ${(billValue - 120) / (10000 - 120) * 100}%, #f4f4f5 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-3 text-xs font-bold text-zinc-400">
                    <span>R$ 120</span>
                    <span>R$ 10.000+</span>
                  </div>
                </div>
              </div>

              {/* Years Toggle */}
              <div className="flex bg-zinc-50 rounded-xl p-1 mb-8">
                {[1, 3, 6].map(y => (
                  <button
                    key={y}
                    onClick={() => setYears(y)}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                      years === y 
                        ? 'bg-white text-emerald-600 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    {y} ano{y > 1 ? 's' : ''}
                  </button>
                ))}
              </div>

              {/* Green Result Box */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[1.5rem] p-8 text-white relative overflow-hidden mb-6 shadow-lg shadow-emerald-500/20">
                {/* Decorative background element */}
                <div className="absolute -right-10 -bottom-10 opacity-20 rotate-12 pointer-events-none">
                  <div className="w-48 h-48 rounded-full border-[16px] border-white/20" />
                  <div className="w-32 h-32 rounded-full border-[16px] border-white/20 absolute top-8 left-8" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-widest font-black text-emerald-100 mb-2">Economia Estimada</p>
                  <p className="text-4xl font-bold tabular-nums mb-1">
                    R$ {totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
                    No total de {years} ano{years > 1 ? 's' : ''} utilizando nosso plano
                  </p>
                </div>
              </div>

              {/* Impact Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <Leaf className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-black text-zinc-400">CO2 Evitado</p>
                    <p className="text-sm font-bold text-zinc-800">{co2Avoided.toLocaleString('pt-BR')}kg / ano</p>
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <TreePine className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-black text-zinc-400">Árvores plantadas</p>
                    <p className="text-sm font-bold text-zinc-800">{treesPlanted.toLocaleString('pt-BR')} árvores</p>
                  </div>
                </div>
              </div>

              {/* Footer Checks */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" strokeWidth={3}/></div>
                  Sem obras e instalações
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" strokeWidth={3}/></div>
                  Desconto garantido
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" strokeWidth={3}/></div>
                  Controle 100% digital
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {modalOpen && (
          <EnergyAdesaoModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            campaignId={campaign?.id || null}
            initialBillValue={String(billValue)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
