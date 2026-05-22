import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, ArrowRight, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { EnergyAdesaoModal } from './modals/EnergyAdesaoModal';

export function EnergyCaptureSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section id="energia" className="py-32 bg-brand-dark px-6 lg:px-12 border-t border-white/5 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[35rem] h-[35rem] bg-emerald-500/10 rounded-full blur-[8rem] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[30rem] h-[30rem] bg-brand-orange/5 rounded-full blur-[8rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Text and Copy */}
          <div className="lg:col-span-5 space-y-8 text-left">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] font-display">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Sustentabilidade & Economia
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-5xl text-white font-serif tracking-tight leading-[1.1] mb-6">
              Reduza sua conta de luz em até <span className="italic text-emerald-400">20%</span> sem investimento<span className="text-brand-orange">.</span>
            </h2>

            <p className="text-white/60 text-sm sm:text-base max-w-2xl font-serif leading-relaxed italic">
              Conecte-se ao nosso Plano de Injeção de Energia. Você economiza mensalmente apoiando a transição para fontes limpas e renováveis, sem nenhuma obra ou custo de instalação na sua residência ou empresa.
            </p>

            {/* Feature Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 pt-4">
              {[
                { title: 'Zero Taxa de Adesão', desc: 'Sem custos de entrada ou taxas escondidas.' },
                { title: 'Sem Obras ou Alterações', desc: 'Tudo é feito de forma digital e automática.' },
                { title: 'Desconto Mensal Garantido', desc: 'Economia real e recorrente nas faturas.' },
                { title: 'Apoio à Energia Limpa', desc: '100% de fontes renováveis da nossa região.' }
              ].map((feat, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-white font-display text-sm font-bold tracking-wide">{feat.title}</h4>
                    <p className="text-white/40 text-xs mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Image Column (Balanced between Mobile and Desktop) */}
          <div className="lg:col-span-3 flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[320px] sm:max-w-[380px] lg:max-w-none aspect-[4/3] sm:aspect-square lg:aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] shadow-2xl group/img"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 to-transparent z-10 pointer-events-none" />
              <img 
                src="/solar_energy_illustration.png" 
                alt="Injeção de Energia Limpa"
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 z-20 hidden lg:block">
                <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                  Tecnologia Solar
                </span>
              </div>
            </motion.div>
          </div>

          {/* Glowing CTA Card */}
          <div className="lg:col-span-4 flex justify-center w-full">
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[3rem] p-10 md:p-12 relative overflow-hidden shadow-2xl group flex flex-col justify-between min-h-[400px]"
            >
              {/* Highlight border on hover */}
              <div className="absolute inset-0 border border-emerald-500/35 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <Zap className="w-7 h-7 fill-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-white/50 text-[9px] uppercase tracking-widest font-black font-display">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    100% SEGURO
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <h3 className="font-serif text-3xl text-white leading-snug">
                    Simule Grátis & <br/>Adira ao Plano
                  </h3>
                  <p className="text-white/40 text-xs leading-relaxed italic">
                    Preencha o formulário rápido de cadastro para que nossos especialistas analisem a sua fatura atual e iniciem a injeção de créditos garantidos na sua conta.
                  </p>
                </div>
              </div>

              <div className="space-y-6 pt-10">
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 text-brand-dark hover:text-white rounded-[1.8rem] text-[10px] uppercase tracking-[0.3em] font-black transition-all shadow-xl hover:shadow-emerald-500/25 flex items-center justify-center gap-3 font-display hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  Aderir ao Plano <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[9px] text-white/30 uppercase tracking-[0.2em] font-black font-display">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  Injeção de créditos garantida
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Energy Form Modal */}
      <AnimatePresence>
        {modalOpen && (
          <EnergyAdesaoModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
