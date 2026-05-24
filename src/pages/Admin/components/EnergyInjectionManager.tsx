import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Plus, 
  ChevronDown, 
  Save, 
  Search, 
  Zap, 
  TrendingUp, 
  UserCheck, 
  Clock, 
  Coins, 
  CheckCircle, 
  Send,
  Calendar,
  Filter,
  Trash2,
  FileSpreadsheet,
  Printer,
  Award,
  User
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';
import { useDancers } from '../../../hooks/useDancers';

interface EnergyInjectionManagerProps {
  onAlert: (title: string, message: string, variant: 'danger' | 'warning' | 'info') => void;
  userRole: string | null;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  target_meta: number;
  percentage?: number;
  image_url?: string;
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  average_bill: number;
  status: 'pending' | 'launched' | 'approved';
  campaign_id: string | null;
  notification_sent: boolean;
  created_at: string;
  dancer_name?: string | null;
  status_updated_by?: string | null;
  status_updated_at?: string | null;
}

export function EnergyInjectionManager({ onAlert, userRole }: EnergyInjectionManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { dancers } = useDancers();
  
  // Create Campaign Accordion state
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignStart, setCampaignStart] = useState('');
  const [campaignEnd, setCampaignEnd] = useState('');
  const [campaignMeta, setCampaignMeta] = useState('');
  const [campaignPercentage, setCampaignPercentage] = useState('15');
  const [campaignImageUrl, setCampaignImageUrl] = useState('/solar_energy_illustration.png');
  const [savingCampaign, setSavingCampaign] = useState(false);

  // Smart Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'launched' | 'approved'>('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [billRangeFilter, setBillRangeFilter] = useState('all');
  const [dancerFilter, setDancerFilter] = useState('all');
  
  // Transition state
  const [transitioningLead, setTransitioningLead] = useState<Lead | null>(null);
  const [targetStatus, setTargetStatus] = useState<'pending' | 'launched' | 'approved' | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

  const handleUpdateDancer = async (leadId: string, dancerName: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('energy_leads')
        .update({ dancer_name: dancerName })
        .eq('id', leadId);

      if (error) throw error;
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, dancer_name: dancerName } : l));
      onAlert('Sucesso', 'Bailarino apoiado atualizado com sucesso.', 'info');
    } catch (err: any) {
      console.error('Error updating lead dancer:', err);
      onAlert('Erro', 'Não foi possível atualizar o bailarino do lead.', 'danger');
    }
  };

  // Load Data
  const loadData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Fetch campaigns
      const { data: campaignData, error: campaignErr } = await supabase
        .from('energy_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignErr) throw campaignErr;
      setCampaigns(campaignData || []);

      // 2. Fetch leads
      const { data: leadData, error: leadErr } = await supabase
        .from('energy_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadErr) throw leadErr;
      setLeads(leadData || []);

    } catch (err: any) {
      console.error('Error loading energy data:', err);
      onAlert('Erro', 'Não foi possível carregar as informações do módulo de energia.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (!supabase) return;
    const subscription = supabase
      .channel('energy_leads_admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'energy_leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads(prev => {
            if (prev.some(l => l.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(l => l.id === payload.new.id ? { ...l, ...payload.new } : l));
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check role permission for campaigns accordion
  const canManageCampaigns = userRole === 'master' || userRole === 'admin';

  // Handle Campaign Creation
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!campaignName.trim()) return;

    setSavingCampaign(true);
    try {
      const { data, error } = await supabase
        .from('energy_campaigns')
        .insert({
          name: campaignName,
          description: campaignDescription || null,
          start_date: campaignStart ? new Date(campaignStart).toISOString() : null,
          end_date: campaignEnd ? new Date(campaignEnd).toISOString() : null,
          target_meta: campaignMeta ? parseFloat(campaignMeta) : null,
          percentage: campaignPercentage ? parseInt(campaignPercentage, 10) : 20,
          image_url: campaignImageUrl || '/solar_energy_illustration.png'
        })
        .select()
        .single();

      if (error) throw error;

      onAlert('Sucesso', 'Nova ação de injeção de energia criada com sucesso.', 'info');
      setCampaigns(prev => [data, ...prev]);
      
      // Reset Form
      setCampaignName('');
      setCampaignDescription('');
      setCampaignStart('');
      setCampaignEnd('');
      setCampaignMeta('');
      setCampaignPercentage('15');
      setCampaignImageUrl('/solar_energy_illustration.png');
      setIsAddingCampaign(false);
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      onAlert('Erro', 'Ocorreu um erro ao cadastrar a nova ação.', 'danger');
    } finally {
      setSavingCampaign(false);
    }
  };

  // Handle Status Update & Email Dispatch
  const handleStatusChangeConfirm = async () => {
    if (!supabase || !transitioningLead || !targetStatus) return;

    setUpdatingStatus(true);
    try {
      // Obter e-mail do usuário autenticado para rastreamento
      const { data: { user } } = await supabase.auth.getUser();
      const updatedBy = user?.email || 'Sistema';
      const updatedAt = new Date().toISOString();

      // 1. Update in Supabase
      const { error: updateErr } = await supabase
        .from('energy_leads')
        .update({ 
          status: targetStatus,
          status_updated_by: updatedBy,
          status_updated_at: updatedAt
        })
        .eq('id', transitioningLead.id);

      if (updateErr) throw updateErr;

      onAlert('Sucesso', `Status atualizado para ${getStatusLabel(targetStatus)} com sucesso.`, 'info');
      
      // Update local state
      setLeads(prev => prev.map(l => l.id === transitioningLead.id ? { 
        ...l, 
        status: targetStatus,
        status_updated_by: updatedBy,
        status_updated_at: updatedAt
      } : l));

      // 2. Invoke Edge Function for email dispatch
      // Pass a non-blocking invoke to avoid waiting in UI if the email provider takes a second
      supabase.functions.invoke('send-energy-status', {
        body: { leadId: transitioningLead.id, status: targetStatus }
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error sending energy status email:', error);
        } else {
          console.log('Energy status email dispatched:', data);
          // Mark notification_sent as true locally and in DB
          if (data && data.success) {
            supabase.from('energy_leads')
              .update({ notification_sent: true })
              .eq('id', transitioningLead.id)
              .then(() => {
                setLeads(prev => prev.map(l => l.id === transitioningLead.id ? { ...l, notification_sent: true } : l));
              });
          }
        }
      });

    } catch (err: any) {
      console.error('Error updating status:', err);
      onAlert('Erro', 'Ocorreu um erro ao atualizar o status.', 'danger');
    } finally {
      setUpdatingStatus(false);
      setTransitioningLead(null);
      setTargetStatus(null);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!supabase || !deletingLead) return;
    try {
      const { error } = await supabase.from('energy_leads').delete().eq('id', deletingLead.id);
      if (error) throw error;
      setLeads(prev => prev.filter(l => l.id !== deletingLead.id));
      onAlert('Sucesso', 'Registro excluído com sucesso.', 'info');
    } catch (err: any) {
      console.error('Error deleting lead:', err);
      onAlert('Erro', 'Ocorreu um erro ao excluir o registro.', 'danger');
    } finally {
      setDeletingLead(null);
    }
  };

  // Handle Campaign Update
  const handleUpdateCampaignLocal = async (id: string, updates: any) => {
    if (!supabase) return { success: false, error: 'Database connection offline' };
    try {
      const { data, error } = await supabase
        .from('energy_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating energy campaign:', err);
      return { success: false, error: err.message };
    }
  };

  // Handle Campaign Delete Confirmation
  const handleDeleteCampaignConfirm = async () => {
    if (!supabase || !deletingCampaign) return;
    try {
      const { error } = await supabase
        .from('energy_campaigns')
        .delete()
        .eq('id', deletingCampaign.id);
      
      if (error) throw error;
      
      // Update local state
      setCampaigns(prev => prev.filter(c => c.id !== deletingCampaign.id));
      onAlert('Sucesso', 'Ação de energia excluída com sucesso.', 'info');
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      onAlert('Erro', 'Ocorreu um erro ao excluir a ação de energia.', 'danger');
    } finally {
      setDeletingCampaign(null);
    }
  };

  // KPI Calculations
  const totalAdherents = leads.length;
  const pendingCount = leads.filter(l => l.status === 'pending').length;
  const launchedCount = leads.filter(l => l.status === 'launched').length;
  const approvedCount = leads.filter(l => l.status === 'approved').length;

  // Unique cities for filter
  const uniqueCities = Array.from(new Set(leads.map(l => l.city).filter(Boolean))).sort();

  // Filter & Search application
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    const matchesCity = cityFilter === 'all' || lead.city === cityFilter;
    
    const matchesDancer = dancerFilter === 'all' || (lead.dancer_name || 'Geral') === dancerFilter;
    
    let matchesBill = true;
    if (billRangeFilter === '0-200') matchesBill = lead.average_bill <= 200;
    else if (billRangeFilter === '201-500') matchesBill = lead.average_bill > 200 && lead.average_bill <= 500;
    else if (billRangeFilter === '501-1000') matchesBill = lead.average_bill > 500 && lead.average_bill <= 1000;
    else if (billRangeFilter === '1000+') matchesBill = lead.average_bill > 1000;
    
    let matchesPeriod = true;
    if (periodFilter !== 'all') {
      const leadDate = new Date(lead.created_at);
      const now = new Date();
      if (periodFilter === 'today') {
        matchesPeriod = leadDate.toDateString() === now.toDateString();
      } else if (periodFilter === '7d') {
        const diff = (now.getTime() - leadDate.getTime()) / (1000 * 3600 * 24);
        matchesPeriod = diff <= 7;
      } else if (periodFilter === '30d') {
        const diff = (now.getTime() - leadDate.getTime()) / (1000 * 3600 * 24);
        matchesPeriod = diff <= 30;
      } else if (periodFilter === 'this_month') {
        matchesPeriod = leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesCity && matchesBill && matchesPeriod && matchesDancer;
  });

  // Ranking calculation
  const ranking = useMemo(() => {
    const stats: Record<string, { count: number; totalBill: number }> = {};
    
    // Initialize stats for all active dancers
    dancers.filter(d => d.is_active).forEach(d => {
      stats[d.name] = { count: 0, totalBill: 0 };
    });

    // Accumulate from leads (only approved ones!)
    leads.forEach(lead => {
      if (lead.status !== 'approved') return;

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

  const getStatusLabel = (status: 'pending' | 'launched' | 'approved') => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'launched': return 'Lançado';
      case 'approved': return 'Aprovado';
    }
  };

  const getStatusBadgeClass = (status: 'pending' | 'launched' | 'approved') => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'launched': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  const handleExportExcel = () => {
    const headers = ['Data', 'Nome', 'Cidade', 'Telefone', 'E-mail', 'Conta (R$)', 'Status'];
    const csvContent = [
      headers.join(';'),
      ...filteredLeads.map(lead => [
        new Date(lead.created_at).toLocaleDateString('pt-BR'),
        lead.name,
        lead.city,
        lead.whatsapp,
        lead.email,
        lead.average_bill.toString().replace('.', ','),
        getStatusLabel(lead.status)
      ].map(v => `"${v}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_Energia_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrintHTML = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório de Adesões - Energia</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #059669; font-size: 24px; margin-bottom: 5px; }
            p { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f9fafb; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Relatório de Adesões - Tati Energy</h1>
          <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Nome</th>
                <th>Cidade</th>
                <th>Telefone</th>
                <th>Conta (R$)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLeads.map(lead => `
                <tr>
                  <td>${new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>${lead.name}</td>
                  <td>${lead.city}</td>
                  <td>${formatPhone(lead.whatsapp)}</td>
                  <td>R$ ${lead.average_bill.toFixed(2).replace('.', ',')}</td>
                  <td>${getStatusLabel(lead.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const formatPhone = (phone: string) => {
    const raw = phone.replace(/\D/g, '');
    if (raw.length === 11) {
      return `(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7)}`;
    }
    if (raw.length === 10) {
      return `(${raw.substring(0, 2)}) ${raw.substring(2, 6)}-${raw.substring(6)}`;
    }
    return phone;
  };

  if (loading && leads.length === 0) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />
        <p className="text-white/40 text-xs uppercase tracking-widest mt-4">Carregando Módulo de Energia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-24 text-left">

      {/* Accordion: Create Energy Actions (Master / Admin ONLY) */}
      {canManageCampaigns && (
        <div className="bg-brand-dark/40 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden">
          <button 
            onClick={() => setIsAddingCampaign(!isAddingCampaign)}
            className="w-full p-10 flex items-center justify-between group bg-white/5 transition-all hover:bg-white/10"
          >
            <div className="flex items-center gap-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-700 ${
                isAddingCampaign 
                  ? 'bg-emerald-600 border-emerald-600 text-white rotate-45 scale-110 shadow-lg shadow-emerald-600/35' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="text-emerald-400 text-[9px] uppercase tracking-[0.5em] font-black mb-1.5 italic opacity-60">
                  Novas Ações de Energia
                </p>
                <h3 className="text-2xl font-serif italic text-white leading-tight">Cadastrar Nova Ação / Meta</h3>
              </div>
            </div>
            <ChevronDown className={`w-6 h-6 text-white/15 group-hover:text-white/45 transition-all duration-700 ${isAddingCampaign ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isAddingCampaign && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="p-10 border-t border-white/5 bg-black/10">
                  <form onSubmit={handleCreateCampaign} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black ml-2 block">Nome da Ação de Injeção *</label>
                        <input 
                          type="text" required value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-white focus:bg-white/10 focus:border-emerald-500/40 outline-none transition-all placeholder:text-white/10 font-semibold"
                          placeholder="Ex: Campanha Solar de Minas - Junho 2026"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black ml-2 block">Meta Estimada (Opcional)</label>
                        <input 
                          type="number" value={campaignMeta}
                          onChange={(e) => setCampaignMeta(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-white focus:bg-white/10 focus:border-emerald-500/40 outline-none transition-all placeholder:text-white/10 font-semibold"
                          placeholder="Ex: 50 (leads ou faturas)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black ml-2 block">Percentual de Desconto/Economia (%) *</label>
                        <input 
                          type="number" min="0" max="100" required value={campaignPercentage}
                          onChange={(e) => setCampaignPercentage(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-white focus:bg-white/10 focus:border-emerald-500/40 outline-none transition-all placeholder:text-white/10 font-semibold"
                          placeholder="Ex: 20"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black ml-2 block">URL da Imagem Ilustrativa *</label>
                        <input 
                          type="text" required value={campaignImageUrl}
                          onChange={(e) => setCampaignImageUrl(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-white focus:bg-white/10 focus:border-emerald-500/40 outline-none transition-all placeholder:text-white/10 font-semibold"
                          placeholder="Ex: /solar_energy_illustration.png"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black ml-2 block">Descrição dos Benefícios</label>
                      <textarea 
                        value={campaignDescription}
                        onChange={(e) => setCampaignDescription(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-white focus:bg-white/10 focus:border-emerald-500/40 outline-none transition-all placeholder:text-white/10 font-semibold min-h-[100px]"
                        placeholder="Descreva as vantagens oferecidas nesta ação..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black ml-2 block">Data de Início</label>
                        <input 
                          type="date" value={campaignStart}
                          onChange={(e) => setCampaignStart(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-white focus:bg-white/10 focus:border-emerald-500/40 outline-none transition-all font-semibold"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black ml-2 block">Data de Término</label>
                        <input 
                          type="date" value={campaignEnd}
                          onChange={(e) => setCampaignEnd(e.target.value)}
                          className="w-full bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-white focus:bg-white/10 focus:border-emerald-500/40 outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex justify-end">
                      <button 
                        type="submit" disabled={savingCampaign}
                        className="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-xl rounded-2xl flex items-center gap-3 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {savingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        CADASTRAR AÇÃO DE ENERGIA
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Ações de Energia Cadastradas (Gerenciamento e Edição) */}
      {canManageCampaigns && (
        <div className="space-y-6 pt-4">
          <div className="flex flex-col gap-2 ml-1 mb-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">
              Ações de Energia Ativas ({campaigns.length})
            </h4>
            <div className="h-px w-12 bg-white/5" />
          </div>
          
          {campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((camp, idx) => (
                <EnergyCampaignAccordion 
                  key={camp.id}
                  campaign={camp}
                  index={idx + 1}
                  onUpdate={handleUpdateCampaignLocal}
                  onDelete={(campaign) => setDeletingCampaign(campaign)}
                  onAlert={onAlert}
                />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-white/30 italic border border-white/5 bg-brand-white/[0.02] rounded-[2rem]">
              Nenhuma ação de energia cadastrada.
            </div>
          )}
        </div>
      )}

      {/* Seção B: Indicadores (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Adesões', val: totalAdherents, icon: UserCheck, color: 'text-white bg-white/5' },
          { label: 'Cadastros Pendentes', val: pendingCount, icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Propostas Lançadas', val: launchedCount, icon: TrendingUp, color: 'text-sky-400 bg-sky-500/10' },
          { label: 'Planos Aprovados', val: approvedCount, icon: Zap, color: 'text-emerald-400 bg-emerald-500/10' }
        ].map((kpi, idx) => (
          <div key={idx} className="p-8 bg-brand-white/[0.02] border border-white/5 rounded-[2rem] shadow-xl space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase tracking-widest font-black text-white/30">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl sm:text-5xl font-serif text-white italic tracking-tight">{kpi.val}</p>
          </div>
        ))}
      </div>

      {/* Seção D: Ranking de Captação */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1 ml-1">
          <p className="text-white/20 text-[9px] uppercase tracking-[0.4em] font-black italic">COMPETIÇÃO SAUDÁVEL</p>
          <h4 className="text-2xl font-serif italic text-white/40">Ranking de Captação de Energia</h4>
          <div className="h-1 w-12 bg-emerald-500/40 rounded-full mt-1" />
        </div>

        {/* Podium and Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Top 3 Podium (Left 5 cols) */}
          <div className="lg:col-span-5 bg-brand-white/[0.02] border border-white/5 rounded-[3rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            
            <div className="relative space-y-4">
              <h5 className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-black">Pódio de Destaque</h5>
              <p className="text-xs text-white/40 font-serif italic">Os 3 bailarinos que lideram a injeção de energia limpa rumo ao Danzamerica 2026!</p>
            </div>

            {/* Podium layout */}
            <div className="flex items-end justify-center gap-4 mt-8 pb-4">
              {/* 2nd Place */}
              {ranking[1] && (
                <div className="flex flex-col items-center flex-1 group">
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-slate-300 shadow-xl group-hover:scale-105 transition-transform bg-white/10 shrink-0">
                      {ranking[1].photo_url ? (
                        <img src={ranking[1].photo_url} className="w-full h-full object-cover scale-[1.7]" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <User className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-300 text-slate-800 rounded-full flex items-center justify-center text-xs font-black shadow-md border border-brand-dark">
                      2
                    </div>
                  </div>
                  <p className="text-xs text-white/70 font-serif italic mt-3 font-semibold text-center truncate w-full">{ranking[1].name.split(' ')[0]}</p>
                  <p className="text-[9px] text-emerald-400 font-bold font-mono mt-0.5">R$ {ranking[1].totalBill.toFixed(0)}</p>
                  <div className="w-full h-16 bg-slate-400/20 border border-slate-400/10 rounded-t-xl mt-3 flex items-center justify-center">
                    <span className="text-[10px] font-black text-slate-300">PRATA</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {ranking[0] && (
                <div className="flex flex-col items-center flex-1 group -translate-y-4">
                  <div className="relative">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-yellow-400 shadow-2xl group-hover:scale-105 transition-transform bg-white/10 shrink-0">
                      {ranking[0].photo_url ? (
                        <img src={ranking[0].photo_url} className="w-full h-full object-cover scale-[1.7]" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <User className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-400 text-yellow-950 rounded-full flex items-center justify-center text-sm font-black shadow-lg border-2 border-brand-dark animate-bounce">
                      1
                    </div>
                  </div>
                  <p className="text-sm text-white font-serif italic mt-3 font-bold text-center truncate w-full">{ranking[0].name.split(' ')[0]}</p>
                  <p className="text-xs text-yellow-400 font-black font-mono mt-0.5">R$ {ranking[0].totalBill.toFixed(0)}</p>
                  <div className="w-full h-24 bg-yellow-500/20 border border-yellow-500/10 rounded-t-2xl mt-3 flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-400 animate-pulse" />
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {ranking[2] && (
                <div className="flex flex-col items-center flex-1 group">
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-amber-600 shadow-xl group-hover:scale-105 transition-transform bg-white/10 shrink-0">
                      {ranking[2].photo_url ? (
                        <img src={ranking[2].photo_url} className="w-full h-full object-cover scale-[1.7]" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <User className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md border border-brand-dark">
                      3
                    </div>
                  </div>
                  <p className="text-xs text-white/70 font-serif italic mt-3 font-semibold text-center truncate w-full">{ranking[2].name.split(' ')[0]}</p>
                  <p className="text-[9px] text-emerald-400 font-bold font-mono mt-0.5">R$ {ranking[2].totalBill.toFixed(0)}</p>
                  <div className="w-full h-12 bg-amber-600/20 border border-amber-600/10 rounded-t-xl mt-3 flex items-center justify-center">
                    <span className="text-[10px] font-black text-amber-500">BRONZE</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Table (Right 7 cols) */}
          <div className="lg:col-span-7 bg-brand-white/[0.02] border border-white/5 rounded-[3rem] p-8 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <h5 className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black">Classificação Geral</h5>
              
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {ranking.length > 0 ? (
                  ranking.map((row, idx) => (
                    <div key={row.id} className="flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.03] transition-colors border border-white/5 rounded-2xl group">
                      <div className="flex items-center gap-4">
                        <span className="w-6 text-center font-mono text-xs font-bold text-white/20 group-hover:text-emerald-400 transition-colors">
                          {idx + 1}º
                        </span>
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center">
                          {row.photo_url ? (
                            <img src={row.photo_url} className="w-full h-full object-cover scale-[1.7]" alt="" />
                          ) : (
                            <User className="w-4 h-4 text-white/20" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-serif italic text-white/80 font-bold leading-tight">{row.name}</p>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1 font-bold">
                            {row.count} {row.count === 1 ? 'Adesão' : 'Adesões'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-serif italic text-emerald-400 font-bold tabular-nums">
                          R$ {row.totalBill.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-[8px] text-white/20 uppercase tracking-wider font-extrabold mt-0.5">Captados</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-white/30 italic">
                    Nenhum bailarino ativo cadastrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção C: Lista de Controle e Gestão de Status */}
      <div className="space-y-6">
        {/* Header Tabela e Busca */}
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-white/20 text-[9px] uppercase tracking-[0.4em] font-black italic">LISTA GERAL</p>
              <h4 className="text-2xl font-serif italic text-white/40">Gestão de Adesões</h4>
              <div className="h-1 w-12 bg-emerald-500/40 rounded-full mt-1" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch md:items-center">
              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrintHTML}
                  title="Imprimir Relatório"
                  className="h-10 px-4 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/50 hover:text-white transition-all text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button 
                  onClick={handleExportExcel}
                  title="Exportar Excel (CSV)"
                  className="h-10 px-4 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all text-sm font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>

              {/* Search Input */}
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-white/30" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Busca por nome, cidade ou e-mail..."
                  className="pl-11 pr-6 py-2.5 h-10 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder:text-white/20 outline-none w-full sm:w-64 focus:bg-white/10 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Smart Filters Row */}
          <div className="flex flex-wrap items-center gap-3 py-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold mr-2">
              <Filter className="w-3 h-3" />
              Filtros Inteligentes:
            </div>

            {/* Status Filter */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer transition-colors"
            >
              <option value="all" className="bg-brand-dark text-white">Todos os Status</option>
              <option value="pending" className="bg-brand-dark text-white">Pendente</option>
              <option value="launched" className="bg-brand-dark text-white">Lançado</option>
              <option value="approved" className="bg-brand-dark text-white">Aprovado</option>
            </select>

            {/* Period Filter */}
            <select 
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer transition-colors"
            >
              <option value="all" className="bg-brand-dark text-white">Todo o Período</option>
              <option value="today" className="bg-brand-dark text-white">Hoje</option>
              <option value="7d" className="bg-brand-dark text-white">Últimos 7 dias</option>
              <option value="30d" className="bg-brand-dark text-white">Últimos 30 dias</option>
              <option value="this_month" className="bg-brand-dark text-white">Este Mês</option>
            </select>

            {/* City Filter */}
            <select 
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer transition-colors max-w-[150px] truncate"
            >
              <option value="all" className="bg-brand-dark text-white">Todas as Cidades</option>
              {uniqueCities.map(city => (
                <option key={city} value={city} className="bg-brand-dark text-white">{city}</option>
              ))}
            </select>

            {/* Dancer Filter */}
            <select 
              value={dancerFilter}
              onChange={(e) => setDancerFilter(e.target.value)}
              className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer transition-colors max-w-[150px] truncate"
            >
              <option value="all" className="bg-brand-dark text-white">Todos os Bailarinos</option>
              <option value="Geral" className="bg-brand-dark text-white">Geral</option>
              {dancers.filter(d => d.is_active).map(dancer => (
                <option key={dancer.id} value={dancer.name} className="bg-brand-dark text-white">{dancer.name}</option>
              ))}
            </select>

            {/* Bill Range Filter */}
            <select 
              value={billRangeFilter}
              onChange={(e) => setBillRangeFilter(e.target.value)}
              className="bg-white/5 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer transition-colors"
            >
              <option value="all" className="bg-brand-dark text-white">Qualquer Valor</option>
              <option value="0-200" className="bg-brand-dark text-white">Até R$ 200</option>
              <option value="201-500" className="bg-brand-dark text-white">R$ 201 a R$ 500</option>
              <option value="501-1000" className="bg-brand-dark text-white">R$ 501 a R$ 1.000</option>
              <option value="1000+" className="bg-brand-dark text-white">Acima de R$ 1.000</option>
            </select>
            
            {/* Clear Filters Button (only show if any filter is active) */}
            {(statusFilter !== 'all' || periodFilter !== 'all' || cityFilter !== 'all' || billRangeFilter !== 'all' || dancerFilter !== 'all' || searchTerm !== '') && (
              <button 
                onClick={() => {
                  setStatusFilter('all');
                  setPeriodFilter('all');
                  setCityFilter('all');
                  setBillRangeFilter('all');
                  setDancerFilter('all');
                  setSearchTerm('');
                }}
                className="text-[10px] text-white/30 hover:text-white uppercase tracking-widest font-bold ml-2 transition-colors"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabela Responsiva */}
        <div className="bg-brand-white/[0.02] border border-white/5 rounded-[2.5rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-white/30 font-black">
                  <th className="p-6 md:p-8 pl-8 md:pl-10">Data</th>
                  <th className="p-6 md:p-8">Nome / Cidade</th>
                  <th className="p-6 md:p-8">Bailarino Apoiado</th>
                  <th className="p-6 md:p-8">Contato</th>
                  <th className="p-6 md:p-8 text-right">Média Conta</th>
                  <th className="p-6 md:p-8 text-center">Status</th>
                  <th className="p-6 md:p-8 pr-8 md:pr-10 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/[0.01] transition-colors group">
                      {/* Data */}
                      <td className="p-6 md:p-8 pl-8 md:pl-10 font-mono text-white/40 tabular-nums">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      {/* Nome e Cidade */}
                      <td className="p-6 md:p-8">
                        <p className="font-serif text-base text-white/80 font-bold leading-none">{lead.name}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1.5 font-bold">{lead.city}</p>
                      </td>
                      {/* Bailarino Apoiado */}
                      <td className="p-6 md:p-8">
                        <select
                          value={lead.dancer_name || 'Geral'}
                          onChange={(e) => handleUpdateDancer(lead.id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer focus:bg-brand-dark focus:border-emerald-500/50 transition-colors font-medium max-w-[150px] truncate"
                        >
                          <option value="Geral" className="bg-brand-dark text-white">Geral (Apoio Geral)</option>
                          {dancers.filter(d => d.is_active).map(d => (
                            <option key={d.id} value={d.name} className="bg-brand-dark text-white">{d.name}</option>
                          ))}
                        </select>
                      </td>
                      {/* Contato */}
                      <td className="p-6 md:p-8 space-y-1">
                        <p className="font-semibold text-white/60">{formatPhone(lead.whatsapp)}</p>
                        <p className="text-white/30 text-[10px] font-medium break-all">{lead.email}</p>
                      </td>
                      {/* Conta de Luz */}
                      <td className="p-6 md:p-8 text-right font-serif text-base font-bold italic text-emerald-400 tabular-nums">
                        R$ {Number(lead.average_bill).toFixed(2)}
                      </td>
                      {/* Status */}
                      <td className="p-6 md:p-8 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-black border font-display ${getStatusBadgeClass(lead.status)}`}>
                            {getStatusLabel(lead.status)}
                          </span>
                          {lead.notification_sent ? (
                            <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" /> E-mail enviado
                            </span>
                          ) : (
                            <span className="text-[8px] text-white/20 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> Não enviado
                            </span>
                          )}
                          {lead.status_updated_by && (
                            <div className="mt-1 pt-1 border-t border-white/5 w-full text-center space-y-0.5">
                              <p className="text-[8px] text-white/40 font-mono tracking-tight truncate max-w-[100px] mx-auto" title={lead.status_updated_by}>
                                Alt: {lead.status_updated_by.split('@')[0]}
                              </p>
                              {lead.status_updated_at && (
                                <p className="text-[7.5px] text-white/30 font-mono leading-none">
                                  {new Date(lead.status_updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(lead.status_updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Ações */}
                      <td className="p-6 md:p-8 pr-8 md:pr-10 text-center">
                        <div className="inline-flex bg-black/25 border border-white/5 rounded-xl p-1 gap-1">
                          <button
                            onClick={() => { setTransitioningLead(lead); setTargetStatus('pending'); }}
                            disabled={lead.status === 'pending'}
                            className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-widest font-black transition-all ${
                              lead.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/10'
                                : 'text-white/30 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            Pendente
                          </button>
                          <button
                            onClick={() => { setTransitioningLead(lead); setTargetStatus('launched'); }}
                            disabled={lead.status === 'launched'}
                            className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-widest font-black transition-all ${
                              lead.status === 'launched'
                                ? 'bg-sky-500/20 text-sky-500 border border-sky-500/10'
                                : 'text-white/30 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            Lançado
                          </button>
                          <button
                            onClick={() => { setTransitioningLead(lead); setTargetStatus('approved'); }}
                            disabled={lead.status === 'approved'}
                            className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-widest font-black transition-all ${
                              lead.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/10'
                                : 'text-white/30 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            Aprovado
                          </button>
                          <button
                            onClick={() => setDeletingLead(lead)}
                            className="px-3 py-1.5 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-white/30 italic">
                      Nenhuma adesão encontrada com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmação de Transição de Status */}
      <ConfirmModal 
        isOpen={!!transitioningLead && !!targetStatus}
        onConfirm={handleStatusChangeConfirm}
        onCancel={() => { setTransitioningLead(null); setTargetStatus(null); }}
        title={`Alterar Status do Lead?`}
        message={`Você está prestes a alterar o status de ${transitioningLead?.name} para "${targetStatus ? getStatusLabel(targetStatus) : ''}". Isso irá salvar a alteração e poderá disparar um e-mail automático notificando a pessoa sobre a evolução do plano.`}
        confirmLabel={`SIM, ATUALIZAR STATUS`}
        variant={targetStatus === 'approved' ? 'info' : 'warning'}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmModal 
        isOpen={!!deletingLead}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingLead(null)}
        title={`Excluir Registro?`}
        message={`Você está prestes a excluir o registro de ${deletingLead?.name}. Esta ação não pode ser desfeita e removerá os dados permanentemente.`}
        confirmLabel={`SIM, EXCLUIR`}
        variant="danger"
      />

      {/* Confirmação de Exclusão de Ação de Energia */}
      <ConfirmModal 
        isOpen={!!deletingCampaign}
        onConfirm={handleDeleteCampaignConfirm}
        onCancel={() => setDeletingCampaign(null)}
        title={`Excluir Ação de Energia?`}
        message={`Você está prestes a excluir a ação de energia "${deletingCampaign?.name}". Isso pode desvincular leads associados a ela e removerá os dados permanentemente.`}
        confirmLabel={`SIM, EXCLUIR AÇÃO`}
        variant="danger"
      />
    </div>
  );
}

// ==========================================
// COMPONENTE: ENERGY CAMPAIGN ACCORDION (Edição Inline)
// ==========================================
interface EnergyCampaignAccordionProps {
  campaign: Campaign;
  index: number;
  onUpdate: (id: string, updates: any) => Promise<{ success: boolean; error?: string }>;
  onDelete: (campaign: Campaign) => void;
  onAlert: (title: string, message: string, variant: 'danger' | 'warning' | 'info') => void;
}

const EnergyCampaignAccordion: React.FC<EnergyCampaignAccordionProps> = ({ 
  campaign, 
  index, 
  onUpdate, 
  onDelete, 
  onAlert 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [localName, setLocalName] = useState(campaign.name);
  const [localDescription, setLocalDescription] = useState(campaign.description || '');
  const [localPercentage, setLocalPercentage] = useState(campaign.percentage || 15);
  const [localImageUrl, setLocalImageUrl] = useState(campaign.image_url || '/solar_energy_illustration.png');
  const [localMeta, setLocalMeta] = useState(campaign.target_meta || '');
  
  const formatDateToInput = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [localStart, setLocalStart] = useState(formatDateToInput(campaign.start_date));
  const [localEnd, setLocalEnd] = useState(formatDateToInput(campaign.end_date));

  useEffect(() => {
    if (!isOpen) {
      setLocalName(campaign.name);
      setLocalDescription(campaign.description || '');
      setLocalPercentage(campaign.percentage || 15);
      setLocalImageUrl(campaign.image_url || '/solar_energy_illustration.png');
      setLocalMeta(campaign.target_meta || '');
      setLocalStart(formatDateToInput(campaign.start_date));
      setLocalEnd(formatDateToInput(campaign.end_date));
    }
  }, [campaign, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    const updates: any = {
      name: localName,
      description: localDescription || null,
      percentage: localPercentage,
      image_url: localImageUrl || '/solar_energy_illustration.png',
      target_meta: localMeta ? parseFloat(String(localMeta)) : null,
      start_date: localStart ? new Date(localStart).toISOString() : null,
      end_date: localEnd ? new Date(localEnd).toISOString() : null
    };

    const result = await onUpdate(campaign.id, updates);
    setSaving(false);
    if (result.success) {
      setIsOpen(false);
      onAlert('Sucesso', 'Ação de energia atualizada com sucesso.', 'info');
    } else {
      onAlert('Erro', result.error || 'Não foi possível atualizar a ação de energia.', 'danger');
    }
  };

  return (
    <div className={`border transition-all duration-500 overflow-hidden rounded-[2.5rem] ${
      isOpen 
        ? 'bg-black/30 border-white/10 shadow-2xl' 
        : 'bg-black/10 border-white/5 hover:border-white/20'
    }`}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-10 flex items-center justify-between group cursor-pointer"
      >
        <div className="flex items-center gap-6 text-left">
          <div className="text-[10px] font-bold text-white/10 group-hover:text-emerald-400 transition-colors font-sans w-6 text-center">
            {index.toString().padStart(2, '0')}
          </div>
          <div className="w-16 h-12 bg-black rounded-lg overflow-hidden border border-white/5 relative flex-shrink-0">
             <img src={campaign.image_url || '/solar_energy_illustration.png'} className="w-full h-full object-cover opacity-60" alt="" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className={`text-xl font-serif italic transition-all duration-500 ${
                isOpen ? 'text-white' : 'text-white/40 group-hover:text-white/60'
              }`}>
                {campaign.name}
              </h3>
              <span className="px-2.5 py-0.5 text-[8px] uppercase tracking-wider font-extrabold rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {campaign.percentage || 15}% Economia
              </span>
            </div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold mt-1 group-hover:text-white/30 transition-colors">
              Meta: {campaign.target_meta || 'Sem meta'} faturas • Início: {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('pt-BR') : 'Imediato'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(campaign);
            }}
            className="p-3 rounded-xl transition-all border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center cursor-pointer"
            title="Excluir Ação"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronDown className={`w-5 h-5 text-white/10 group-hover:text-white/40 transition-all duration-500 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-12 pb-12 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-white/5">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold ml-1">Nome da Ação</label>
                    <input 
                      type="text" value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-emerald-500/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner font-semibold"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold ml-1">Economia (%)</label>
                      <input 
                        type="number" min="0" max="100" value={localPercentage}
                        onChange={(e) => setLocalPercentage(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-emerald-500/40 outline-none transition-all text-emerald-400 font-bold rounded-2xl shadow-inner text-xl"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold ml-1">Meta Estimada</label>
                      <input 
                        type="number" value={localMeta}
                        onChange={(e) => setLocalMeta(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-emerald-500/40 outline-none transition-all text-white font-bold rounded-2xl shadow-inner text-xl"
                        placeholder="Sem meta"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold ml-1">URL da Imagem Ilustrativa</label>
                    <input 
                      type="text" value={localImageUrl}
                      onChange={(e) => setLocalImageUrl(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-emerald-500/40 outline-none transition-all text-white/60 rounded-2xl shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold ml-1">Descrição dos Benefícios</label>
                    <textarea 
                      value={localDescription}
                      onChange={(e) => setLocalDescription(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-emerald-500/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner min-h-[140px] font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold ml-1">Data de Início</label>
                      <input 
                        type="date" value={localStart}
                        onChange={(e) => setLocalStart(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-emerald-500/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner font-semibold"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-bold ml-1">Data de Término</label>
                      <input 
                        type="date" value={localEnd}
                        onChange={(e) => setLocalEnd(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 p-6 text-sm font-sans focus:border-emerald-500/40 outline-none transition-all text-white/80 rounded-2xl shadow-inner font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-white/5 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving || !localName}
                  className="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-xl rounded-2xl flex items-center gap-3 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
