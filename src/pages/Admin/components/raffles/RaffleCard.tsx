import React from 'react';
import { 
  Pencil, 
  Trash2, 
  Users 
} from 'lucide-react';
import { RaffleCampaign } from '../../../../hooks/useRaffles';
import { maskBRL } from '../../../../lib/utils';

interface RaffleCardProps {
  campaign: RaffleCampaign;
  onEdit: (c: RaffleCampaign) => void;
  onDelete: (id: string) => void;
  onViewOrders: (id: string) => void;
}

export const RaffleCard: React.FC<RaffleCardProps> = ({ campaign, onEdit, onDelete, onViewOrders }) => {
  return (
    <div className="bg-black/20 border border-white/5 group hover:border-brand-orange/20 transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
      <div className="aspect-video relative overflow-hidden bg-black">
        <img 
          src={campaign.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2574&auto=format&fit=crop'} 
          alt={campaign.name} 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
        />
        <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
          <button 
            onClick={() => onEdit(campaign)}
            className="p-3 bg-white/10 text-white/60 hover:text-white hover:bg-brand-orange transition-all rounded-2xl backdrop-blur-md"
            title="Editar Campanha"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(campaign.id)}
            className="p-3 bg-white/10 text-white/60 hover:text-white hover:bg-red-500 transition-all rounded-2xl backdrop-blur-md"
            title="Excluir Campanha"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute bottom-6 left-6">
          <div className={`px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full backdrop-blur-md border ${
            campaign.is_active 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
              : 'bg-white/5 text-white/40 border-white/10'
          }`}>
            {campaign.is_active ? '• Campanha Ativa' : 'Encerrada'}
          </div>
        </div>
      </div>

      <div className="p-10 flex-1 flex flex-col space-y-8">
        <div className="space-y-3">
          <h4 className="text-2xl font-serif italic text-white/90 group-hover:text-brand-orange transition-colors duration-500 leading-tight">{campaign.name}</h4>
          <p className="text-sm text-white/40 font-sans leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-500">{campaign.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-4">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Valor do Número</p>
            <p className="text-2xl font-serif italic text-white">{maskBRL(campaign.price_per_number)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-orange font-bold ml-1">Total Números</p>
            <p className="text-2xl font-serif italic text-white">{campaign.total_numbers}</p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex gap-4">
          <button 
            onClick={() => onViewOrders(campaign.id)}
            className="flex-1 flex items-center justify-center gap-4 bg-white/5 text-white/60 py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white hover:text-brand-dark rounded-2xl transition-all shadow-xl"
          >
            <Users className="w-5 h-5" />
            Gerenciar Pedidos
          </button>
        </div>
      </div>
    </div>
  );
}
