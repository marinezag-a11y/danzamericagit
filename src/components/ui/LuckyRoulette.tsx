import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, AlertCircle, Ticket } from 'lucide-react';

interface LuckyRouletteProps {
  availableNumbers: number[];
  quantityToSelect: number;
  onNumbersSelected: (numbers: number[]) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  fixedIndices: number[];
  onToggleFix: (index: number) => void;
  selectedNumbers: number[];
  hasSpunOnce: boolean;
}

export function LuckyRoulette({ 
  availableNumbers, 
  quantityToSelect, 
  onNumbersSelected, 
  isSpinning, 
  setIsSpinning,
  fixedIndices,
  onToggleFix,
  selectedNumbers,
  hasSpunOnce
}: LuckyRouletteProps) {
  const controls = useAnimation();
  const [displayNumbers, setDisplayNumbers] = useState<number[]>([]);

  // Initialize display numbers (the candidates on the wheel)
  useEffect(() => {
    if (availableNumbers.length > 0 && displayNumbers.length === 0) {
      const pool = availableNumbers.length >= 12
        ? [...availableNumbers].sort(() => 0.5 - Math.random()).slice(0, 12)
        : [...availableNumbers, ...Array(12 - availableNumbers.length).fill(0)].sort(() => 0.5 - Math.random());
      setDisplayNumbers(pool);
    }
  }, [availableNumbers, displayNumbers.length]);

  const lastSelected = React.useRef(selectedNumbers);
  const lastFixed = React.useRef(fixedIndices);
  const lastHasSpun = React.useRef(hasSpunOnce);
  const lastAvailable = React.useRef(availableNumbers);

  useEffect(() => {
    lastSelected.current = selectedNumbers;
    lastFixed.current = fixedIndices;
    lastHasSpun.current = hasSpunOnce;
    lastAvailable.current = availableNumbers;
  }, [selectedNumbers, fixedIndices, hasSpunOnce, availableNumbers]);

  const rotationRef = React.useRef(0);

  const spin = useCallback(async () => {
    if (displayNumbers.length === 0) {
      setIsSpinning(false);
      return;
    }
    
    try {
      const extraSpins = 8 + Math.floor(Math.random() * 5);
      const targetSegmentIndex = Math.floor(Math.random() * 12);
      const segmentAngle = 360 / 12;
      const targetRotation = (360 - (targetSegmentIndex * segmentAngle)) - (segmentAngle / 2);
      
      const finalRotation = rotationRef.current + (extraSpins * 360) + targetRotation;
      rotationRef.current = finalRotation;

      await controls.start({
        rotate: finalRotation,
        transition: { duration: 4, ease: [0.15, 0, 0.1, 1] }
      });

      const poolForRandom = [...lastAvailable.current].filter(n => !lastSelected.current.includes(n));
      
      if (!lastHasSpun.current) {
        const initial = [...lastAvailable.current].sort(() => 0.5 - Math.random()).slice(0, quantityToSelect);
        onNumbersSelected(initial);
      } else {
        const updated = [...lastSelected.current];
        const randomsNeeded = quantityToSelect - lastFixed.current.length;
        const newRandoms = [...poolForRandom].sort(() => 0.5 - Math.random()).slice(0, randomsNeeded);
        
        let randomIdx = 0;
        for (let i = 0; i < quantityToSelect; i++) {
          if (!lastFixed.current.includes(i)) {
            updated[i] = newRandoms[randomIdx++];
          }
        }
        onNumbersSelected(updated);
      }
    } catch (err) {
      console.error('Spin error:', err);
    } finally {
      setIsSpinning(false);
    }
  }, [displayNumbers, controls, quantityToSelect, onNumbersSelected, setIsSpinning]);

  useEffect(() => {
    if (isSpinning) {
      spin();
    }
  }, [isSpinning, spin]);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-12 w-full max-w-2xl mx-auto px-4">
      <div className="relative w-full max-w-[250px] sm:max-w-[450px] aspect-square flex items-center justify-center mt-6 sm:mt-8">
        {/* Shadow & Glow Background */}
        <div className={`absolute inset-4 rounded-full transition-all duration-1000 ${isSpinning ? 'bg-brand-orange/20 blur-[60px] sm:blur-[80px]' : 'bg-black/20 blur-[30px] sm:blur-[40px]'}`} />
        
        {/* Outer Ring with Lights (The Casino Rim) */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD700] via-[#B8860B] to-[#8B4513] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-0">
          <div className="w-full h-full rounded-full bg-brand-dark flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
            {/* Inner Gold Border */}
            <div className="absolute inset-2 rounded-full border-[4px] sm:border-[6px] border-[#DAA520] opacity-30" />
            
            {/* The Light Bulbs */}
            {Array.from({ length: 24 }).map((_, i) => (
              <div 
                key={i}
                className={`absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full z-20 transition-all duration-300 ${isSpinning ? (i % 2 === (Math.floor(Date.now()/200)%2) ? 'bg-white shadow-[0_0_15px_#fff,0_0_30px_#FFD700]' : 'bg-[#FFD700]/30') : 'bg-white shadow-[0_0_10px_#fff]'}`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 15}deg) translateY(var(--light-radius, -130px)) translateX(-50%)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* The Wheel Pointer (Golden Teardrop) */}
        <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
          <div className="w-8 h-12 sm:w-10 sm:h-14 bg-gradient-to-b from-[#FFD700] to-[#B8860B] rounded-t-full rounded-b-lg shadow-2xl relative flex items-center justify-center border-t border-white/40">
             <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-[0_0_15px_#fff] animate-pulse" />
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] sm:border-l-[12px] border-l-transparent border-r-[10px] sm:border-r-[12px] border-r-transparent border-t-[12px] sm:border-t-[16px] border-t-[#B8860B]" />
          </div>
        </div>

        {/* The Spinning Core */}
        <div className="relative w-[85%] h-[85%] z-10 p-1 sm:p-2">
          <motion.div 
            animate={controls}
            initial={{ rotate: 0 }}
            className="w-full h-full rounded-full overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.5)] border-2 sm:border-4 border-[#FFD700]"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <defs>
                <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
                </linearGradient>
                <filter id="premium-shadow">
                  <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.5"/>
                </filter>
              </defs>
              
              {displayNumbers.map((num, i) => {
                const startAngle = i * (360 / 12);
                const endAngle = (i + 1) * (360 / 12);
                const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);

                const isRed = i % 2 === 0;

                return (
                  <g key={i}>
                    {/* Segment Background */}
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={isRed ? '#CC0000' : '#F5F5DC'}
                      stroke="rgba(0,0,0,0.1)"
                      strokeWidth="0.5"
                    />
                    
                    {/* Golden Dividers */}
                    <line x1="50" y1="50" x2={x1} y2={y1} stroke="url(#gold-grad)" strokeWidth="0.5" opacity="0.4" />

                    {/* Numbers */}
                    <g transform={`rotate(${startAngle + 15}, 50, 50)`}>
                      <text
                        x="78"
                        y="50"
                        fill={isRed ? '#FFFFFF' : '#CC0000'}
                        fontSize="6"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-serif italic"
                        filter="url(#premium-shadow)"
                        transform={`rotate(90, 78, 50)`}
                      >
                        {num > 0 ? num : '?'}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 z-30">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFD700] via-[#DAA520] to-[#8B4513] p-1 sm:p-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
              <div className="w-full h-full rounded-full bg-brand-dark border-2 border-[#FFD700]/30 flex items-center justify-center overflow-hidden relative">
                 {/* Hub Texture */}
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] animate-pulse" />
                 <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(255,215,0,0.1)_50%,transparent_100%)] animate-spin-slow" />
                 
                 <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-[#FFD700] flex items-center justify-center transition-all duration-700 ${isSpinning ? 'scale-110 shadow-[0_0_30px_#FFD700]' : 'scale-100'}`}>
                    <Ticket className="w-5 h-5 sm:w-7 sm:h-7 text-[#FFD700]" strokeWidth={2.5} />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Numbers Feed */}
      <AnimatePresence>
        {selectedNumbers.length > 0 && !isSpinning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full space-y-8"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl">
                <AlertCircle className="w-5 h-5 text-brand-orange animate-pulse" />
                <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] italic">
                  Toque para <span className="text-brand-orange underline">FIXAR</span> e refinar seu sorteio
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-4 sm:gap-6">
              {selectedNumbers.map((num, idx) => {
                const isFixed = fixedIndices.includes(idx);
                return (
                  <button
                    key={`${idx}-${num}`}
                    onClick={() => onToggleFix(idx)}
                    className={`group relative aspect-square rounded-[1.5rem] flex flex-col items-center justify-center transition-all duration-500 border-2 ${
                      isFixed 
                        ? 'bg-gradient-to-br from-[#CC0000] to-[#800000] border-[#FFD700] shadow-[0_15px_30px_-5px_rgba(204,0,0,0.6)] scale-110 z-10' 
                        : 'bg-white border-black/5 hover:border-brand-orange/30 hover:shadow-2xl hover:scale-105'
                    }`}
                  >
                    <span className={`text-2xl font-serif italic font-bold ${isFixed ? 'text-white' : 'text-brand-dark'}`}>{num}</span>
                    <div className={`absolute -top-2 -right-2 p-2 rounded-full shadow-lg transition-all duration-500 ${
                      isFixed ? 'bg-[#FFD700] text-brand-dark opacity-100 scale-100' : 'bg-brand-dark/10 text-brand-dark/20 opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'
                    }`}>
                      {isFixed ? <Lock size={12} strokeWidth={3} /> : <Unlock size={12} strokeWidth={3} />}
                    </div>
                    {isFixed && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#FFD700] rounded-full" 
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        :root {
          --light-radius: -130px;
        }
        @media (min-width: 640px) {
          :root {
            --light-radius: -210px;
          }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

