import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  Globe,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Trophy,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useGallery } from '../../hooks/useGallery';
import { useSponsorship, SponsorshipTier } from '../../hooks/useSponsorship';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'gallery' | 'sponsorship'>('content');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin');
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-brand-orange animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-brand-dark border-r border-white/5 p-6 flex flex-col z-20">
        <div className="mb-12">
          <img src="/logo_branca.png" alt="Logo" className="h-12" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 mt-4 font-display font-bold">Painel de Controle</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-serif transition-all ${activeTab === 'content' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <Settings className="w-4 h-4" />
            Conteúdo Geral
          </button>
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-serif transition-all ${activeTab === 'gallery' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Galeria de Fotos
          </button>
          <button 
            onClick={() => setActiveTab('sponsorship')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-serif transition-all ${activeTab === 'sponsorship' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <Trophy className="w-4 h-4" />
            Cotas de Patrocínio
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="px-4 py-2">
            <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-1">Logado como</p>
            <p className="text-xs truncate opacity-60 font-serif">{user?.email}</p>
          </div>
          <a 
            href="/" 
            target="_blank"
            className="flex items-center gap-4 px-4 py-3 text-sm text-white/40 hover:text-white transition-all font-serif"
          >
            <Globe className="w-4 h-4" />
            Ver Site Público
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-sm text-brand-orange hover:bg-brand-orange/10 transition-all font-serif"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-serif italic mb-2">
              {activeTab === 'content' ? 'Configurações do Site' : 'Gerenciador da Galeria'}
            </h1>
            <p className="text-white/40 text-xs uppercase tracking-widest font-display">
              {activeTab === 'content' ? 'Edite textos, chaves pix e metas' : activeTab === 'gallery' ? 'Suba ou remova fotos da jornada' : 'Gerencie as cotas de investimento'}
            </p>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'content' && (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl"
            >
              <ContentEditor />
            </motion.div>
          )}
          {activeTab === 'gallery' && (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl"
            >
              <GalleryManager />
            </motion.div>
          )}
          {activeTab === 'sponsorship' && (
            <motion.div 
              key="sponsorship"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl"
            >
              <SponsorshipManager />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ContentEditor() {
  const { settings, loading, updateSetting } = useSiteSettings();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      const vals = Object.keys(settings).reduce((acc, key) => ({
        ...acc,
        [key]: settings[key].value
      }), {});
      setLocalValues(vals);
    }
  }, [settings]);

  const handleSave = async (key: string) => {
    setSaving(key);
    const result = await updateSetting(key, localValues[key]);
    if (result.success) {
      setSuccess(key);
      setTimeout(() => setSuccess(null), 3000);
    }
    setSaving(null);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  const sections = [
    {
      title: 'Seção de Doações',
      keys: ['pix_key', 'vakinha_url', 'target_amount', 'current_amount']
    },
    {
      title: 'Textos do Hero',
      keys: ['hero_title', 'hero_subtitle']
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {sections.map(section => (
        <div key={section.title} className="bg-white/5 border border-white/10 p-8 space-y-6 flex flex-col">
          <h3 className="text-xl font-serif italic mb-4">{section.title}</h3>
          
          <div className="space-y-6 flex-1">
            {section.keys.map(key => (
              <div key={key}>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
                  {settings[key]?.label || key}
                </label>
                {key === 'hero_subtitle' ? (
                  <textarea 
                    rows={3} 
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-serif focus:border-brand-orange focus:outline-none transition-all"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                ) : (
                  <input 
                    type={key.includes('amount') ? 'number' : 'text'}
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-serif focus:border-brand-orange focus:outline-none transition-all"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pt-6 mt-6 border-t border-white/5">
            <button 
              onClick={() => section.keys.forEach(handleSave)}
              disabled={!!saving}
              className={`w-full py-4 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
                success ? 'bg-green-500' : 'bg-brand-orange hover:bg-white hover:text-brand-dark'
              } disabled:opacity-50`}
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : success ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {saving ? 'Salvando...' : success ? 'Salvo com Sucesso' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function GalleryManager() {
  const { images, loading, uploadImage, deleteImage } = useGallery();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      await uploadImage(file);
      setUploading(false);
    }
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  return (
    <div className="space-y-8">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full bg-brand-orange/10 border border-brand-orange/20 p-8 text-center border-dashed hover:bg-brand-orange/20 transition-all group disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 text-brand-orange mx-auto animate-spin" />
        ) : (
          <Upload className="w-8 h-8 text-brand-orange mx-auto mb-4 group-hover:scale-110 transition-transform" />
        )}
        <p className="text-sm font-serif italic mb-2">
          {uploading ? 'Enviando foto...' : 'Clique para subir nova foto'}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-white/20">Imagens aparecem instantaneamente na galeria</p>
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map(img => (
          <motion.div 
            layout
            key={img.id} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square bg-white/5 border border-white/10 relative group overflow-hidden"
          >
            <img src={img.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => deleteImage(img.id, img.url)}
                className="bg-red-500 p-3 hover:bg-red-600 transition-colors rounded-full shadow-xl"
                title="Excluir Foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-white/20 font-serif italic">Nenhuma foto na galeria...</p>
        </div>
      )}
    </div>
  );
}

function SponsorshipManager() {
  const { tiers, loading, updateTier, addTier, deleteTier } = useSponsorship();
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (tier: Partial<SponsorshipTier>) => {
    setSaving(true);
    if (editingTier) {
      await updateTier(editingTier.id, tier);
    } else {
      await addTier({
        name: tier.name || '',
        price: tier.price || '',
        benefits: tier.benefits || [],
        highlight: tier.highlight || false,
        display_order: tiers.length + 1
      } as any);
    }
    setSaving(false);
    setEditingTier(null);
    setIsAdding(false);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif italic text-white/60">Cotas Ativas</h3>
        <button 
          onClick={() => {
            setEditingTier(null);
            setIsAdding(true);
          }}
          className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Cota
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map(tier => (
          <div key={tier.id} className={`p-8 border ${tier.highlight ? 'border-brand-orange bg-brand-orange/5' : 'border-white/10 bg-white/5'} flex flex-col justify-between group`}>
            <div>
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-2xl font-serif">{tier.name}</h4>
                {tier.highlight && <Trophy className="w-4 h-4 text-brand-orange" />}
              </div>
              <p className="text-brand-orange text-3xl font-display font-light mb-6">R$ {tier.price}</p>
              <ul className="space-y-3 mb-8">
                {tier.benefits.map((b, i) => (
                  <li key={i} className="text-xs text-white/40 flex items-center gap-3 font-serif">
                    <span className="w-1 h-1 rounded-full bg-brand-orange"></span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-4 pt-6 border-t border-white/5">
              <button 
                onClick={() => setEditingTier(tier)}
                className="flex-1 text-[10px] uppercase tracking-widest font-bold py-3 bg-white/5 hover:bg-white hover:text-brand-dark transition-all"
              >
                Editar
              </button>
              <button 
                onClick={() => {
                  if (confirm('Deseja excluir esta cota?')) deleteTier(tier.id);
                }}
                className="p-3 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {(editingTier || isAdding) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => {
                setEditingTier(null);
                setIsAdding(false);
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-brand-dark border border-white/10 w-full max-w-2xl p-8 md:p-12 overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => {
                  setEditingTier(null);
                  setIsAdding(false);
                }}
                className="absolute top-8 right-8 text-white/20 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-serif italic mb-8">
                {isAdding ? 'Nova Cota' : 'Editar Cota'}
              </h3>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Nome da Cota</label>
                    <input 
                      type="text" 
                      defaultValue={editingTier?.name || ''}
                      id="tier-name"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Valor (R$)</label>
                    <input 
                      type="text" 
                      defaultValue={editingTier?.price || ''}
                      id="tier-price"
                      placeholder="0.000,00"
                      className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Benefícios (um por linha)</label>
                  <textarea 
                    rows={5}
                    defaultValue={editingTier?.benefits.join('\n') || ''}
                    id="tier-benefits"
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    id="tier-highlight"
                    defaultChecked={editingTier?.highlight || false}
                    className="w-5 h-5 accent-brand-orange"
                  />
                  <label htmlFor="tier-highlight" className="text-sm font-serif">Destacar esta cota (ex: Diamante)</label>
                </div>

                <div className="pt-8 border-t border-white/5 flex gap-4">
                   <button 
                    onClick={() => {
                      setEditingTier(null);
                      setIsAdding(false);
                    }}
                    className="flex-1 py-4 text-[10px] uppercase tracking-widest font-bold border border-white/10 hover:bg-white/5 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                    disabled={saving}
                    onClick={() => {
                      const name = (document.getElementById('tier-name') as HTMLInputElement).value;
                      const price = (document.getElementById('tier-price') as HTMLInputElement).value;
                      const benefits = (document.getElementById('tier-benefits') as HTMLTextAreaElement).value.split('\n').filter(b => b.trim());
                      const highlight = (document.getElementById('tier-highlight') as HTMLInputElement).checked;
                      handleSave({ name, price, benefits, highlight });
                    }}
                    className="flex-1 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-2"
                   >
                     {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                     Salvar Cota
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
