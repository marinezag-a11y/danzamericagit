import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

interface ProposalRequest {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  tier_name: string;
  status: 'pending' | 'contacted' | 'closed' | 'cancelled';
  created_at: string;
}

export function SponsorshipRequestsList() {
  const [requests, setRequests] = useState<ProposalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('proposal_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteRequest = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase
        .from('proposal_requests')
        .delete()
        .eq('id', itemToDelete);

      if (error) throw error;
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
    } finally {
      setItemToDelete(null);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.tier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-brand-orange/20 text-brand-orange border-brand-orange/40';
      case 'contacted': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'closed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'contacted': return 'Contatado';
      case 'closed': return 'Fechado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-xl font-serif text-white italic">Solicitações de Parceria</h3>
          <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Empresas e pessoas interessadas em patrocinar</p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-orange transition-colors" />
          <input
            type="text"
            placeholder="Buscar solicitações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-sm text-white focus:bg-white/10 focus:border-brand-orange/40 outline-none transition-all placeholder:text-white/10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <motion.div
            key={request.id}
            layout
            className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-[2rem] group hover:border-white/20 transition-all"
          >
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-1.5 rounded-full text-[8px] uppercase font-black tracking-[0.2em] border ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </div>
                  <span className="text-white/20 text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(request.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div>
                  <h4 className="text-2xl font-serif text-white italic mb-1">{request.name}</h4>
                  <div className="flex flex-wrap items-center gap-6 text-sm text-white/40 font-serif">
                    {request.company && (
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-orange" /> {request.company}
                      </span>
                    )}
                    <span className="flex items-center gap-2 text-white/60">
                      Cota: <span className="text-brand-orange font-bold uppercase tracking-widest text-[10px]">{request.tier_name}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 pt-4">
                  <a href={`mailto:${request.email}`} className="flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-sans">{request.email}</span>
                  </a>
                  <a 
                    href={`https://wa.me/${request.phone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-white/60 hover:text-emerald-400 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-sans">{request.phone}</span>
                  </a>
                </div>
              </div>

              <div className="flex flex-row lg:flex-col justify-end items-center lg:items-end gap-4 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-8 min-w-[180px]">
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateStatus(request.id, 'contacted')}
                    className="p-3 bg-blue-500/10 text-blue-400 lg:hover:bg-blue-500 lg:hover:text-white rounded-xl transition-all"
                    title="Marcar como Contatado"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => updateStatus(request.id, 'closed')}
                    className="p-3 bg-emerald-500/10 text-emerald-400 lg:hover:bg-emerald-500 lg:hover:text-white rounded-xl transition-all"
                    title="Marcar como Fechado"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setItemToDelete(request.id)}
                    className="p-3 bg-red-500/10 text-red-500 lg:hover:bg-red-500 lg:hover:text-white rounded-xl transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <a 
                  href={`https://wa.me/${request.phone.replace(/\D/g, '')}?text=Olá ${request.name}, sou da equipe Danzamerica. Recebemos seu interesse na cota ${request.tier_name}.`} 
                  target="_blank"
                  className="px-6 py-3 bg-brand-orange text-white text-[9px] uppercase font-black tracking-widest rounded-xl hover:bg-white hover:text-brand-orange transition-all flex items-center gap-2 shadow-lg shadow-brand-orange/20"
                >
                  ABRIR WHATSAPP <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredRequests.length === 0 && !loading && (
          <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
            <Mail className="w-12 h-12 text-white/5 mx-auto mb-4" />
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-black">Nenhuma solicitação encontrada</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!itemToDelete}
        onConfirm={deleteRequest}
        onCancel={() => setItemToDelete(null)}
        title="Excluir Solicitação?"
        message="Deseja remover permanentemente este registro de interesse?"
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  );
}
