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
    <div className="bg-white/5 border border-white/10 group hover:border-brand-orange/30 transition-all rounded-sm overflow-hidden flex flex-col">
      <div className="aspect-video relative overflow-hidden bg-black">
        <img 
          src={campaign.image_url || 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=2574&auto=format&fit=crop'} 
          alt={campaign.name} 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={() => onEdit(campaign)}
            className="p-2 bg-black/60 text-white/60 hover:text-brand-orange hover:bg-black transition-all rounded-full"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(campaign.id)}
            className="p-2 bg-black/60 text-white/60 hover:text-red-500 hover:bg-black transition-all rounded-full"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="bg-brand-orange text-white px-3 py-1 text-[8px] uppercase tracking-widest font-bold rounded-full">
            {campaign.is_active ? 'Ativa' : 'Encerrada'}
          </div>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col space-y-6">
        <div>
          <h4 className="text-xl font-sans italic text-white mb-2">{campaign.name}</h4>
          <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{campaign.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[8px] uppercase tracking-widest text-brand-orange font-bold">Valor do Número</p>
            <p className="text-lg font-sans text-white">{maskBRL(campaign.price_per_number)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] uppercase tracking-widest text-brand-orange font-bold">Total de Números</p>
            <p className="text-lg font-sans text-white">{campaign.total_numbers}</p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex gap-4">
          <button 
            onClick={() => onViewOrders(campaign.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-white/60 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all"
          >
            <Users className="w-4 h-4" />
            Ver Pedidos
          </button>
        </div>
      </div>
    </div>
  );
}
