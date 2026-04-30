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
  X,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useGallery } from '../../hooks/useGallery';
import { useSponsorship, SponsorshipTier } from '../../hooks/useSponsorship';
import { useHeroBanners, HeroBanner } from '../../hooks/useHeroBanners';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'gallery' | 'sponsorship' | 'banners' | 'help'>('content');
  const navigate = useNavigate();
  const { images, loading: galleryLoading, error: galleryError } = useGallery();

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
          <button 
            onClick={() => setActiveTab('banners')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-serif transition-all ${activeTab === 'banners' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Banners do Hero
          </button>
          <button 
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-serif transition-all ${activeTab === 'help' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <Heart className="w-4 h-4" />
            Como Ajudar
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
        {/* Diagnostic Bar */}
      <div className="mb-12 p-4 bg-brand-orange/10 border border-brand-orange/20 flex flex-wrap gap-6 text-[10px] uppercase tracking-widest font-bold">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${supabase ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-white/40">Supabase:</span> {supabase ? 'Conectado' : 'Desconectado'}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${galleryLoading ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'}`}></span>
          <span className="text-white/40">Galeria:</span> {galleryLoading ? 'Carregando...' : `${images?.length || 0} fotos`}
        </div>
        {galleryError && (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-3 h-3" />
            <span>Erro: {galleryError}</span>
          </div>
        )}
      </div>

      <header className="flex justify-between items-center mb-12">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-serif italic mb-2">
              {activeTab === 'content' ? 'Configurações do Site' : 
               activeTab === 'gallery' ? 'Gerenciador da Galeria' : 
               activeTab === 'sponsorship' ? 'Cotas de Patrocínio' : 
               activeTab === 'banners' ? 'Banners do Hero' : 'Como Ajudar'}
            </h1>
            <p className="text-white/40 text-xs uppercase tracking-widest font-display">
              {activeTab === 'content' ? 'Edite textos, chaves pix e metas' : 
               activeTab === 'gallery' ? 'Suba ou remova fotos da jornada' : 
               activeTab === 'sponsorship' ? 'Gerencie as cotas de investimento' : 
               activeTab === 'banners' ? 'Gerencie as fotos e textos do topo do site' : 'Gerencie as formas de apoiar o projeto'}
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
          {activeTab === 'banners' && (
            <motion.div 
              key="banners"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl"
            >
              <BannerManager />
            </motion.div>
          )}
          {activeTab === 'help' && (
            <motion.div 
              key="help"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl"
            >
              <HelpSectionManager />
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
    },
    {
      title: 'Seção: A Jornada',
      keys: ['jornada_title', 'jornada_description', 'jornada_image']
    },
    {
      title: 'Seção: O Desafio',
      keys: ['desafio_title', 'desafio_description', 'desafio_image']
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
                {key.includes('subtitle') || key.includes('description') ? (
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
  const { images, loading, addImage, uploadImage, deleteImage } = useGallery();
  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max width 1600px for gallery images
          const MAX_WIDTH = 1600;
          if (width > MAX_WIDTH) {
            height = (MAX_WIDTH / width) * height;
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.8); // 80% quality JPEG
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const optimizedBlob = await optimizeImage(file);
      const optimizedFile = new File([optimizedBlob], file.name, { type: 'image/jpeg' });
      
      const result = await uploadImage(optimizedFile);
      if (result.success && result.url) {
        setNewUrl(result.url);
      } else {
        alert('Erro ao subir imagem: ' + result.error);
      }
    } catch (err) {
      alert('Erro ao otimizar imagem.');
    }
    setUploading(false);
  };

  const handleAdd = async () => {
    if (!newUrl) return;
    setAdding(true);
    const result = await addImage(newUrl, newCaption);
    if (result.success) {
      setNewUrl('');
      setNewCaption('');
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await deleteImage(id);
    setImageToDelete(null);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  return (
    <div className="space-y-12">
      <div className="bg-white/5 border border-white/10 p-8">
        <h3 className="text-xl font-serif italic mb-8">Adicionar Nova Foto</h3>
        
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 border border-white/5 bg-white/5 space-y-4">
                <label className="block text-[10px] uppercase tracking-widest text-brand-orange font-bold">Opção 1: Enviar do Computador (Otimizado)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="gallery-upload"
                  disabled={uploading}
                />
                <label 
                  htmlFor="gallery-upload"
                  className={`flex flex-col items-center justify-center gap-3 w-full py-10 border-2 border-dashed border-white/10 hover:border-brand-orange hover:bg-brand-orange/5 transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
                  ) : (
                    <Upload className="w-8 h-8 text-white/20" />
                  )}
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-widest font-bold">
                      {uploading ? 'Otimizando e Enviando...' : 'Clique para selecionar'}
                    </p>
                    <p className="text-[8px] text-white/40 mt-1 italic">Imagens serão comprimidas automaticamente</p>
                  </div>
                </label>
              </div>

              <div className="p-6 border border-white/5 bg-white/5 space-y-4">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Opção 2: Link Externo (Cloudinary/URL)</label>
                <input 
                  type="text"
                  className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-8 flex flex-col">
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Legenda da Foto</label>
                <input 
                  type="text"
                  className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                  placeholder="Ex: Danzamerica 2026 - Noite de Gala"
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                />
              </div>

              {newUrl && (
                <div className="p-4 border border-brand-orange/20 bg-brand-orange/5 rounded-sm">
                  <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mb-2">Prévia do Link:</p>
                  <p className="text-[10px] text-white/40 truncate font-mono">{newUrl}</p>
                </div>
              )}

              <div className="mt-auto pt-6">
                <button 
                  onClick={handleAdd}
                  disabled={adding || !newUrl || uploading}
                  className="w-full py-5 bg-brand-orange text-white text-[12px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Finalizar e Adicionar à Galeria
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images && images.length > 0 ? (
          images.map((image) => (
            <div key={image.id} className="group relative aspect-square bg-white/5 border border-white/10 overflow-hidden">
              <img src={image.url} alt={image.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => setImageToDelete(image.id)}
                  className="bg-red-500 p-3 rounded-full hover:bg-red-600 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 backdrop-blur-sm">
                  <p className="text-[8px] uppercase tracking-widest text-white/60 truncate">{image.caption}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-white/5 border border-dashed border-white/10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">Nenhuma foto para exibir</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {imageToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
              onClick={() => setImageToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-brand-dark border border-red-500/20 w-full max-w-md p-10 text-center"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-serif italic mb-4 text-white">Remover foto?</h3>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setImageToDelete(null)} className="flex-1 py-4 border border-white/10 text-[10px] uppercase font-bold text-white">Cancelar</button>
                <button onClick={() => handleDelete(imageToDelete)} className="flex-1 py-4 bg-red-500 text-white text-[10px] uppercase font-bold">Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

function BannerManager() {
  const { banners, loading, updateBanner, addBanner, deleteBanner } = useHeroBanners();
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<HeroBanner | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;
    setDeleting(true);
    const result = await deleteBanner(bannerToDelete.id);
    if (result.success) {
      setBannerToDelete(null);
      triggerSuccess('Banner excluído com sucesso!');
    } else {
      alert('Erro ao excluir banner. Verifique sua conexão.');
    }
    setDeleting(false);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif italic text-white/60">Slides do Topo (Máx 6)</h3>
        {banners.length < 6 && (
          <button 
            onClick={async () => {
              const result = await addBanner({ 
                image_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2669&auto=format&fit=crop', 
                title: 'Novo Título:', 
                subtitle: 'Legenda do Banner', 
                order_index: banners.length 
              });
              if (result.success) triggerSuccess('Novo slide adicionado!');
            }}
            className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Slide
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {banners.map((banner, idx) => (
          <div key={banner.id} className="bg-white/5 border border-white/10 overflow-hidden flex flex-col">
            <div className="aspect-video relative group">
              <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                 <button 
                  onClick={() => setEditingBanner(banner)}
                  className="bg-brand-orange p-3 rounded-full hover:bg-white hover:text-brand-dark transition-all"
                 >
                   <Settings className="w-4 h-4" />
                 </button>
                 <button 
                  onClick={() => setBannerToDelete(banner)}
                  className="bg-red-500 p-3 rounded-full hover:bg-red-600 transition-all"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
              <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 text-[10px] uppercase font-bold tracking-tighter">
                Slide {idx + 1}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Título (Use : para itálico)</p>
                <p className="font-serif italic text-lg">{banner.title}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">Legenda Superior</p>
                <p className="text-sm opacity-60">{banner.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setEditingBanner(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-brand-dark border border-white/10 w-full max-w-xl p-8 md:p-12"
            >
              <button onClick={() => setEditingBanner(null)} className="absolute top-8 right-8 text-white/20 hover:text-white"><X className="w-6 h-6" /></button>
              <h3 className="text-3xl font-serif italic mb-8">Editar Slide {banners.findIndex(b => b.id === editingBanner.id) + 1}</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">URL da Imagem</label>
                  <input 
                    type="text" 
                    id="edit-banner-url"
                    defaultValue={editingBanner.image_url}
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Título (Ex: A Jornada: 26 Anos)</label>
                  <input 
                    type="text" 
                    id="edit-banner-title"
                    defaultValue={editingBanner.title}
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Legenda Superior</label>
                  <input 
                    type="text" 
                    id="edit-banner-subtitle"
                    defaultValue={editingBanner.subtitle}
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                  />
                </div>

                <button 
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    const image_url = (document.getElementById('edit-banner-url') as HTMLInputElement).value;
                    const title = (document.getElementById('edit-banner-title') as HTMLInputElement).value;
                    const subtitle = (document.getElementById('edit-banner-subtitle') as HTMLInputElement).value;
                    const result = await updateBanner(editingBanner.id, { image_url, title, subtitle });
                    if (result.success) triggerSuccess('Slide atualizado!');
                    setSaving(false);
                    setEditingBanner(null);
                  }}
                  className="w-full py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Salvar Slide
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {bannerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
              onClick={() => setBannerToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-brand-dark border border-red-500/20 w-full max-w-md p-10 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-serif italic mb-4">Excluir Slide?</h3>
              <p className="text-white/40 text-sm mb-8 font-serif">Esta ação não pode ser desfeita. O slide será removido permanentemente do site.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setBannerToDelete(null)}
                  className="flex-1 py-4 text-[10px] uppercase tracking-widest font-bold border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-8 left-1/2 z-[100] bg-green-500 text-white px-6 py-3 flex items-center gap-3 shadow-2xl rounded-full"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HelpSectionManager() {
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

  const handleSave = async (group: string) => {
    setSaving(group);
    const keys = group === 'store' ? ['help_store_title', 'help_store_description', 'help_store_image'] :
                 group === 'raffle' ? ['help_raffle_title', 'help_raffle_description', 'help_raffle_image'] :
                 ['help_event_title', 'help_event_description', 'help_event_image'];
    
    for (const key of keys) {
      await updateSetting(key, localValues[key]);
    }
    
    setSuccess(group);
    setTimeout(() => setSuccess(null), 3000);
    setSaving(null);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  const groups = [
    { id: 'store', title: 'Card 01: Loja', keys: ['help_store_title', 'help_store_description', 'help_store_image'] },
    { id: 'raffle', title: 'Card 02: Rifa', keys: ['help_raffle_title', 'help_raffle_description', 'help_raffle_image'] },
    { id: 'event', title: 'Card 03: Eventos', keys: ['help_event_title', 'help_event_description', 'help_event_image'] }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {groups.map(group => (
        <div key={group.id} className="bg-white/5 border border-white/10 p-8 flex flex-col">
          <h3 className="text-xl font-serif italic mb-6">{group.title}</h3>
          
          <div className="space-y-6 flex-1">
            {group.keys.map(key => (
              <div key={key}>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
                  {settings[key]?.label || key}
                </label>
                {key.includes('description') ? (
                  <textarea 
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                ) : (
                  <input 
                    type="text"
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => handleSave(group.id)}
            disabled={saving === group.id}
            className={`mt-8 py-4 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
              success === group.id ? 'bg-green-500' : 'bg-brand-orange hover:bg-white hover:text-brand-dark'
            } disabled:opacity-50`}
          >
            {saving === group.id ? <Loader2 className="w-3 h-3 animate-spin" /> : success === group.id ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {saving === group.id ? 'Salvando...' : success === group.id ? 'Salvo!' : 'Salvar Card'}
          </button>
        </div>
      ))}
    </div>
  );
}

