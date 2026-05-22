import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { RaffleRanking } from '../RaffleRanking';

interface RaffleRankingModalProps {
  campaignId: string;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RaffleRankingModal({ campaignId, campaignName, isOpen, onClose }: RaffleRankingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-brand-dark/90 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-[480px] bg-white rounded-[3.5rem] p-4 shadow-[0_64px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Absolute Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-[100] p-3 bg-black/5 hover:bg-brand-orange hover:text-white rounded-full text-brand-dark/30 transition-all transform hover:rotate-90"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content - Embeds the custom RaffleRanking directly! */}
        <div className="p-4 pt-12">
          <RaffleRanking 
            campaignId={campaignId} 
            title={campaignName} 
            subtitle="Destaques do Apoio"
          />
        </div>
      </motion.div>
    </div>
  );
}
