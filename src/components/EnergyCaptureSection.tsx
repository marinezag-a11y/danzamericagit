import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, Leaf, TreePine, ArrowRight, ShieldCheck, Copy, Pencil, User, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EnergyAdesaoModal } from './modals/EnergyAdesaoModal';
import { useDancers } from '../hooks/useDancers';

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
  const [leads, setLeads] = useState<any[]>([]);
  const { dancers } = useDancers();
  
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

    async function loadApprovedLeads() {
      try {
        if (!supabase) return;
        const { data } = await supabase
          .from('energy_leads')
          .select('average_bill, dancer_name, status')
          .eq('status', 'approved');

        if (data) {
          setLeads(data);
        }
      } catch (err) {
        console.error('Error loading approved energy leads:', err);
      }
    }

    loadActiveCampaign();
    loadApprovedLeads();

    // Assinatura em tempo real para atualizar o ranking automaticamente
    if (!supabase) return;
    const subscription = supabase
      .channel('energy_leads_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'energy_leads' }, () => {
        loadApprovedLeads();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [modalOpen]);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#energia`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Calculations
  const percentage = 15; // Fator de economia fixado em 15% conforme solicitação do usuário
  const monthlySavings = billValue * (percentage / 100);
  const totalSavings = monthlySavings * 12 * years;
  
  // Metrics based on reference image: R$ 300/mo -> 320.4kg CO2/year and 100 trees/year
  const co2Avoided = (billValue * 1.068) * years; 
  const treesPlanted = Math.round((billValue / 3)) * years;

  // Ranking calculation
  const ranking = React.useMemo(() => {
    const stats: Record<string, { count: number; totalBill: number }> = {};
    
    // Initialize stats for all active dancers
    dancers.filter(d => d.is_active).forEach(d => {
      stats[d.name] = { count: 0, totalBill: 0 };
    });

    // Accumulate from leads
    leads.forEach(lead => {
      const name = lead.dancer_name || 'Geral';
      if (name && name !== 'Geral') {
        if (!stats[name]) {
          stats[name] = { count: 0, totalBill: 0 };
        }
        stats[name].count += 1;
        stats[name].totalBill += lead.average_bill || 0;
      }
    });

    // Map to array with dancer details
    return dancers
      .filter(dancer => dancer.is_active)
      .map(dancer => {
        const s = stats[dancer.name] || { count: 0, totalBill: 0 };
        return {
          id: dancer.id,
          name: dancer.name,
          photo_url: dancer.photo_url,
          count: s.count,
          totalBill: s.totalBill
        };
      })
      .filter(row => row.count > 0)
      .sort((a, b) => {
        if (b.totalBill !== a.totalBill) {
          return b.totalBill - a.totalBill;
        }
        return b.count - a.count;
      });
  }, [leads, dancers]);

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
              {campaign?.name || 'TATI ENERGY'} <span className="font-medium px-1 text-emerald-700/50">|</span> Economia limpa e renovável
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] text-zinc-900 font-serif tracking-tight leading-[1.05]">
              {campaign?.name ? (
                <>
                  Energia inteligente com a <span className="text-emerald-600 font-bold">{campaign.name}</span>
                </>
              ) : (
                <>
                  Energia inteligente para quem <span className="text-emerald-600 font-bold">valoriza</span> cada centavo.
                </>
              )}
            </h2>

            <div className="text-zinc-600 text-base sm:text-lg max-w-lg font-serif leading-relaxed">
              {campaign?.description ? (
                <p className="whitespace-pre-line">{campaign.description}</p>
              ) : (
                <p>
                  A <strong className="text-emerald-700">Tati Energy</strong> transforma sua conta de luz em Energia 100% limpa, sem investimentos e com economia automática na palma da sua mão. <br/><br/><span className="italic font-medium text-zinc-800 bg-emerald-100/50 px-2 py-1 rounded">E o propósito maior:</span> Ao economizar, você apoia automaticamente nossos bailarinos rumo ao Danzamerica. A sustentabilidade encontra a arte!
                </p>
              )}
            </div>

            {/* Social Proof & iGreen Endorsement */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12 py-2">
              <div className="flex items-center gap-4">
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

              <div className="h-8 w-px bg-zinc-200 hidden sm:block" />

              <div className="flex items-center gap-3">
                <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-[0.2em] leading-none shrink-0">by</span>
                <img 
                  src="/igreen_logo.png" 
                  className="h-9 sm:h-11 object-contain mix-blend-multiply" 
                  alt="iGreen Energy" 
                  style={{ mixBlendMode: 'multiply' }}
                />
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

        {/* Seção de Ranking Público */}
        <div className="mt-24 pt-16 border-t border-zinc-200/80 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3 px-4">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 font-sans block">
              🩰 Apoio aos Talentos
            </span>
            <h3 className="text-3xl sm:text-4xl font-serif italic text-zinc-900 leading-tight">
              Ranking de Captação
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 font-serif italic leading-relaxed">
              Acompanhe a classificação de apoio dos nossos bailarinos rumo ao Danzamerica 2026. Cada plano de energia aprovado soma faturamento para o projeto!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Top 3 Podium (Left 5 Cols) */}
            <div className="lg:col-span-5 bg-white/95 backdrop-blur-sm border border-zinc-100 rounded-[2rem] md:rounded-[2.5rem] p-4 xs:p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden min-h-[380px] sm:min-h-[420px] transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.015] to-transparent pointer-events-none" />
              
              <div className="relative space-y-2 text-left z-10">
                <h5 className="text-[10px] uppercase tracking-[0.25em] text-emerald-600 font-black">Pódio de Liderança</h5>
                <p className="text-[11px] text-zinc-400 font-serif italic">Os três bailarinos com maior captação de energia limpa aprovada!</p>
              </div>

              {/* Podium layout */}
              <div className="flex items-end justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-6 mt-14 pb-4 relative z-10">
                {/* 2nd Place */}
                {ranking[1] && (
                  <div className="flex flex-col items-center flex-1 group min-w-0">
                    <div className="relative">
                      <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-slate-300 shadow-md group-hover:scale-105 transition-transform bg-zinc-50 shrink-0">
                        {ranking[1].photo_url ? (
                          <img src={ranking[1].photo_url} className="w-full h-full object-cover scale-[1.7]" alt="" />
                        ) : (
                          <User className="w-5 h-5 text-zinc-300 m-auto" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-slate-300 text-slate-800 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow border border-white">
                        2
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-zinc-700 font-serif italic mt-3 font-semibold text-center truncate w-full px-1">{ranking[1].name.split(' ')[0]}</p>
                    <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold font-mono mt-0.5">R$ {ranking[1].totalBill.toFixed(0)}</p>
                    <div className="w-full h-14 sm:h-16 bg-gradient-to-t from-slate-200/30 to-slate-100/10 border-t border-slate-300/30 rounded-t-xl mt-3 flex items-center justify-center">
                      <span className="text-[8px] font-black text-slate-400 tracking-wider">PRATA</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {ranking[0] && (
                  <div className="flex flex-col items-center flex-1 group -translate-y-4 min-w-0">
                    <div className="relative">
                      {/* Premium gold glow effect */}
                      <div className="absolute inset-0 bg-yellow-400/25 rounded-full blur-[8px] group-hover:blur-[12px] transition-all" />
                      
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-500 animate-bounce">
                        <Crown className="w-5 h-5 fill-yellow-400" />
                      </div>

                      <div className="relative w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg group-hover:scale-105 transition-transform bg-zinc-50 shrink-0">
                        {ranking[0].photo_url ? (
                          <img src={ranking[0].photo_url} className="w-full h-full object-cover scale-[1.7]" alt="" />
                        ) : (
                          <User className="w-7 h-7 text-zinc-300 m-auto" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-yellow-400 text-yellow-950 rounded-full flex items-center justify-center text-xs sm:text-sm font-black shadow border-2 border-white">
                        1
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-900 font-serif italic mt-3 font-bold text-center truncate w-full px-1">{ranking[0].name.split(' ')[0]}</p>
                    <p className="text-[10px] sm:text-xs text-yellow-600 font-black font-mono mt-0.5">R$ {ranking[0].totalBill.toFixed(0)}</p>
                    <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-yellow-100/40 to-yellow-50/10 border-t border-yellow-400/40 rounded-t-2xl mt-3 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {ranking[2] && (
                  <div className="flex flex-col items-center flex-1 group min-w-0">
                    <div className="relative">
                      <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-amber-600 shadow-md group-hover:scale-105 transition-transform bg-zinc-50 shrink-0">
                        {ranking[2].photo_url ? (
                          <img src={ranking[2].photo_url} className="w-full h-full object-cover scale-[1.7]" alt="" />
                        ) : (
                          <User className="w-5 h-5 text-zinc-300 m-auto" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow border border-white">
                        3
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-zinc-700 font-serif italic mt-3 font-semibold text-center truncate w-full px-1">{ranking[2].name.split(' ')[0]}</p>
                    <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold font-mono mt-0.5">R$ {ranking[2].totalBill.toFixed(0)}</p>
                    <div className="w-full h-10 sm:h-12 bg-gradient-to-t from-amber-600/20 to-amber-500/5 border-t border-amber-600/20 rounded-t-xl mt-3 flex items-center justify-center">
                      <span className="text-[8px] font-black text-amber-700 tracking-wider">BRONZE</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard Table (Right 7 Cols) */}
            <div className="lg:col-span-7 bg-white/95 backdrop-blur-sm border border-zinc-100 rounded-[2rem] md:rounded-[2.5rem] p-4 xs:p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] duration-500">
              <div className="space-y-4">
                <h5 className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 font-black text-left">Classificação Geral</h5>
                
                <div className="max-h-[340px] overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
                  {ranking.length > 0 ? (
                    ranking.map((row, idx) => {
                      // Custom premium ranking badge design
                      let badgeStyle = "bg-zinc-50 text-zinc-500 border border-zinc-100";
                      if (idx === 0) badgeStyle = "bg-amber-50 text-amber-800 border border-amber-200/50 shadow-sm shadow-amber-100";
                      else if (idx === 1) badgeStyle = "bg-slate-50 text-slate-800 border border-slate-200/50 shadow-sm shadow-slate-100";
                      else if (idx === 2) badgeStyle = "bg-orange-50/70 text-orange-800 border border-orange-200/30 shadow-sm shadow-orange-50";

                      return (
                        <div key={row.id} className="flex items-center justify-between p-3 sm:p-4 bg-zinc-50/30 hover:bg-emerald-500/[0.015] hover:border-emerald-500/20 hover:-translate-y-0.5 transition-all duration-300 border border-zinc-100/70 rounded-2xl group cursor-pointer">
                          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                            <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold leading-none ${badgeStyle}`}>
                              {idx + 1}º
                            </span>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-zinc-200 shrink-0 bg-white flex items-center justify-center">
                              {row.photo_url ? (
                                <img src={row.photo_url} className="w-full h-full object-cover scale-[1.7]" alt="" />
                              ) : (
                                <User className="w-4 h-4 text-zinc-300" />
                              )}
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-xs sm:text-sm font-serif italic text-zinc-800 font-bold leading-tight truncate">{row.name}</p>
                              <p className="text-[8px] sm:text-[9px] text-zinc-400 uppercase tracking-widest mt-1 font-bold">
                                {row.count} {row.count === 1 ? 'Adesão aprovada' : 'Adesões aprovadas'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0 pl-2">
                            <p className="text-xs sm:text-sm font-serif italic text-emerald-600 font-bold tabular-nums">
                              R$ {row.totalBill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[8px] text-zinc-400 uppercase tracking-wider font-extrabold mt-0.5">Apoiados</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-zinc-400 text-xs italic">
                      Nenhum faturamento aprovado registrado até o momento.
                    </div>
                  )}
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
