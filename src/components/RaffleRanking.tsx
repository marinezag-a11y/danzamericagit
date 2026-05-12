import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Trophy, Loader2, Check, Copy } from 'lucide-react';
import { usePublicRanking } from '../hooks/usePublicRanking';
import { toPng } from 'html-to-image';

export function RaffleRanking() {
  const { ranking, loading } = usePublicRanking();
  const rankingRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Only need the ref for CSS animation control or manual interaction if needed
  useEffect(() => {
    // We'll use CSS for the animation as it's smoother and handles the seamless loop better
  }, []);

  const handleCopyRanking = async () => {
    if (!rankingRef.current) return;
    
    setIsCapturing(true);
    try {
      // 1. Generate image with high quality
      const dataUrl = await toPng(rankingRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2 // High quality for better looking shares
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'ranking-danzamerica.png', { type: 'image/png' });

      // 2. Try to copy to clipboard (Works on Desktop and Modern Mobile)
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 4000);
          return; // Success!
        } catch (e) {
          console.log('ClipboardItem failed, trying fallback...');
        }
      }

      // 3. Fallback for Mobile or browsers that don't support image clipboard
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Ranking Danzamerica',
          text: 'Confira o Ranking de Talentos! 🚀'
        });
      } else {
        // Ultimate fallback: Download
        const link = document.createElement('a');
        link.download = 'ranking-danzamerica.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Error copying ranking:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  if (loading && ranking.length === 0) {
    return (
      <div className="bg-white border border-black/5 p-6 rounded-[2.5rem] animate-pulse shadow-sm">
        <div className="h-4 w-24 bg-black/5 rounded mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-black/5 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (ranking.length === 0) return null;

  // Ensure strict sorting by sales (tickets then orders)
  const sortedRanking = [...ranking].sort((a, b) => {
    if (b.ticket_count !== a.ticket_count) return b.ticket_count - a.ticket_count;
    return b.order_count - a.order_count;
  });

  const top3 = sortedRanking.slice(0, 3);
  const rest = sortedRanking.slice(3);

  return (
    <div className="relative group max-w-[420px] mx-auto lg:mx-0">
      <div className="absolute inset-0 bg-brand-orange/5 blur-3xl rounded-full opacity-50 pointer-events-none"></div>
      
      <div ref={rankingRef} className="relative bg-white rounded-[3rem] p-8 border border-black/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 bg-brand-orange/10 rounded-2xl">
            <Trophy className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <h3 className="text-sm font-black text-brand-dark uppercase tracking-[0.2em]">Ranking de Apoio</h3>
            <p className="text-[10px] text-brand-dark/30 uppercase tracking-widest font-bold">Destaques da Decolagem</p>
          </div>
        </div>

        <div className="space-y-6">
          {top3.map((item, idx) => {
            const colors = [
              { border: 'border-brand-orange', bg: 'bg-brand-orange/[0.03]', badge: 'bg-brand-orange' },
              { border: 'border-slate-300', bg: 'bg-slate-50', badge: 'bg-slate-400' },
              { border: 'border-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-600' }
            ][idx];

            return (
              <motion.div
                key={item.dancer_name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`relative flex items-center gap-6 p-5 rounded-[2.5rem] border ${colors.border}/20 transition-all hover:shadow-xl ${colors.bg} group/item`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-20 h-20 rounded-[1.5rem] overflow-hidden border-2 ${colors.border} bg-white shadow-lg`}>
                    {item.photo_url ? (
                      <img 
                        src={item.photo_url} 
                        alt={item.dancer_name}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover scale-[1.8] transition-transform duration-1000 group-hover/item:scale-[2.0]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-orange/5 text-brand-orange/20">
                         <Trophy size={32} />
                      </div>
                    )}
                  </div>
                  <div 
                    className={`absolute -top-2 -left-2 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-xl z-20 ${colors.badge}`}
                  >
                    {idx + 1}º
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-serif italic text-brand-dark mb-1 truncate">
                    {item.dancer_name}
                  </h4>
                  <p className="text-[10px] font-black text-brand-dark/20 uppercase tracking-widest">
                    {item.ticket_count} / {item.goal || 50} Apoios
                  </p>
                </div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="opacity-10 group-hover/item:opacity-100 transition-opacity text-brand-orange"
                >
                  <Rocket className="w-6 h-6" />
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Auto-scrolling List (Infinite Seamless Loop) */}
        <div className="relative mt-8 border-t border-black/5 pt-8 overflow-hidden group/marquee">
          <div 
            ref={scrollRef}
            onPointerDown={() => setIsPaused(true)}
            onPointerUp={() => setIsPaused(false)}
            onPointerEnter={() => setIsPaused(true)}
            onPointerLeave={() => setIsPaused(false)}
            className="flex flex-col gap-3 pr-2"
            style={{
              maxHeight: '320px',
              animation: isPaused ? 'none' : `marquee-vertical ${rest.length * 1.5}s linear infinite`,
              maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
            }}
          >
            {/* First Set */}
            {rest.map((item, idx) => (
              <div key={`${item.dancer_name}-1`} className="flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] rounded-2xl transition-all group/list flex-shrink-0">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-brand-dark/10 w-4">{idx + 4}º</span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-black/10 bg-white">
                    <img 
                      src={item.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.dancer_name)}&background=ffffff&color=ccc`} 
                      alt={item.dancer_name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover scale-[1.5] opacity-60 group-hover/list:opacity-100 transition-all"
                    />
                  </div>
                  <span className="text-sm font-medium text-brand-dark/60 group-hover/list:text-brand-dark transition-colors">
                    {item.dancer_name}
                  </span>
                </div>
                <span className="text-xs font-mono text-brand-dark/30">{item.ticket_count} / {item.goal || 50}</span>
              </div>
            ))}

            {/* Loop Separator */}
            <div className="flex items-center justify-center py-4 opacity-20">
              <div className="h-px flex-1 bg-black/10" />
              <span className="px-4 text-[8px] font-black uppercase tracking-[0.3em]">Reiniciar Ranking</span>
              <div className="h-px flex-1 bg-black/10" />
            </div>

            {/* Second Set (for seamless loop) */}
            {rest.map((item, idx) => (
              <div key={`${item.dancer_name}-2`} className="flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] rounded-2xl transition-all group/list flex-shrink-0">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-brand-dark/10 w-4">{idx + 4}º</span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-black/10 bg-white">
                    <img 
                      src={item.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.dancer_name)}&background=ffffff&color=ccc`} 
                      alt={item.dancer_name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover scale-[1.5] opacity-60 group-hover/list:opacity-100 transition-all"
                    />
                  </div>
                  <span className="text-sm font-medium text-brand-dark/60 group-hover/list:text-brand-dark transition-colors">
                    {item.dancer_name}
                  </span>
                </div>
                <span className="text-xs font-mono text-brand-dark/30">{item.ticket_count} / {item.goal || 50}</span>
              </div>
            ))}
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes marquee-vertical {
              0% { transform: translateY(0); }
              100% { transform: translateY(calc(-50% - 24px)); } /* Adjust for separator height */
            }
          `}} />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={handleCopyRanking}
          disabled={isCapturing}
          className={`w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 group shadow-lg ${
            isCopied 
              ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
              : 'bg-brand-dark text-white hover:bg-brand-orange shadow-black/10'
          }`}
        >
          {isCapturing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isCopied ? (
            <Check className="w-5 h-5" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
          {isCapturing ? 'GERANDO...' : isCopied ? 'COPIADO! AGORA É SÓ COLAR' : 'COPIAR IMAGEM DO RANKING'}
        </button>
      </div>
    </div>
  );
}
