import React, { useState, useEffect } from 'react';
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
  Printer
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

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
}

export function EnergyInjectionManager({ onAlert, userRole }: EnergyInjectionManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Campaign Accordion state
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignStart, setCampaignStart] = useState('');
  const [campaignEnd, setCampaignEnd] = useState('');
  const [campaignMeta, setCampaignMeta] = useState('');
  const [campaignPercentage, setCampaignPercentage] = useState('20');
  const [campaignImageUrl, setCampaignImageUrl] = useState('/solar_energy_illustration.png');
  const [savingCampaign, setSavingCampaign] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'launched' | 'approved'>('all');
  
  // Transition state
  const [transitioningLead, setTransitioningLead] = useState<Lead | null>(null);
  const [targetStatus, setTargetStatus] = useState<'pending' | 'launched' | 'approved' | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

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
      setCampaignPercentage('20');
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
      // 1. Update in Supabase
      const { error: updateErr } = await supabase
        .from('energy_leads')
        .update({ status: targetStatus })
        .eq('id', transitioningLead.id);

      if (updateErr) throw updateErr;

      onAlert('Sucesso', `Status atualizado para ${getStatusLabel(targetStatus)} com sucesso.`, 'info');
      
      // Update local state
      setLeads(prev => prev.map(l => l.id === transitioningLead.id ? { ...l, status: targetStatus } : l));

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

  // KPI Calculations
  const totalAdherents = leads.length;
  const pendingCount = leads.filter(l => l.status === 'pending').length;
  const launchedCount = leads.filter(l => l.status === 'launched').length;
  const approvedCount = leads.filter(l => l.status === 'approved').length;

  // Filter & Search application
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      {/* Seção C: Lista de Controle e Gestão de Status */}
      <div className="space-y-6">
        {/* Header Tabela e Busca */}
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between px-4">
          <div className="flex flex-col gap-1">
            <p className="text-white/20 text-[9px] uppercase tracking-[0.4em] font-black italic">LISTA GERAL</p>
            <h4 className="text-2xl font-serif italic text-white/40">Gestão de Adesões</h4>
            <div className="h-1 w-12 bg-emerald-500/40 rounded-full mt-1" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch md:items-center">
            
            {/* Export Buttons */}
            <div className="flex items-center gap-2 mr-2">
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
                className="pl-11 pr-6 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-xs text-white placeholder:text-white/20 outline-none w-full sm:w-64 focus:bg-white/10 transition-all font-medium"
              />
            </div>

            {/* Quick Status Select */}
            <div className="relative flex items-center bg-white/5 border border-white/5 rounded-2xl px-4 py-3">
              <Filter className="w-3.5 h-3.5 text-white/30 mr-2" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent border-none text-xs text-white outline-none font-semibold pr-2 cursor-pointer"
              >
                <option value="all" className="bg-brand-dark text-white">Todos os Status</option>
                <option value="pending" className="bg-brand-dark text-white">Pendente</option>
                <option value="launched" className="bg-brand-dark text-white">Lançado</option>
                <option value="approved" className="bg-brand-dark text-white">Aprovado</option>
              </select>
            </div>
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
                    <td colSpan={6} className="py-20 text-center text-white/30 italic">
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
    </div>
  );
}
