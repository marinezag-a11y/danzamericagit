import React, { useEffect, useState, useRef, useId } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  Settings, 
  Images, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  CheckCircle2,
  Globe,
  LogOut,
  ImageIcon,
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
import { uploadImage } from '../../lib/upload';

// Global Image Optimization Utility
const optimizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
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
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

interface OptimizedImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  className?: string;
  folder?: string;
}

function OptimizedImageUploader({ onUploadSuccess, label = "Subir Imagem (Otimizada)", className = "", folder = "content" }: OptimizedImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const uploadId = useId();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const optimizedBlob = await optimizeImage(file);
      const optimizedFile = new File([optimizedBlob], file.name, { type: 'image/jpeg' });
      const result = await uploadImage(optimizedFile, folder);
      if (result.success && result.url) {
        onUploadSuccess(result.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  return (
    <div className={className}>
      <input 
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id={uploadId}
        disabled={uploading}
      />
      <label 
        htmlFor={uploadId}
        className={`flex items-center justify-center gap-2 w-full py-3 px-4 border border-white/10 bg-white/5 hover:bg-brand-orange text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        {uploading ? 'Otimizando...' : label}
      </label>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'banners' | 'content' | 'gallery' | 'help' | 'sponsorship'>('banners');
  const { images, loading: galleryLoading } = useGallery();

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    window.location.href = '/admin';
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) window.location.href = '/admin';
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto mt-20" />;

  return (
    <div className="min-h-screen bg-brand-dark text-white flex font-serif">
      {/* Sidebar */}
      <aside className="w-72 bg-black border-r border-white/5 p-8 flex flex-col sticky top-0 h-screen">
        <div className="mb-12">
          <img src="/logo_branca.png" alt="Logo" className="h-16 w-auto object-contain mb-8" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-brand-orange font-bold">Painel de Gestão</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('banners')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-serif transition-all ${activeTab === 'banners' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Banners do Hero
          </button>
          <button 
            onClick={() => setActiveTab('content')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-serif transition-all ${activeTab === 'content' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Conteúdo das Seções
          </button>
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-serif transition-all ${activeTab === 'gallery' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <Images className="w-4 h-4" />
            Galeria de Fotos
          </button>
          <button 
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-serif transition-all ${activeTab === 'help' ? 'bg-brand-orange text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <Heart className="w-4 h-4" />
            Como Ajudar
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
        <header className="mb-12">
          <h2 className="text-4xl font-serif italic mb-2 capitalize">
            {activeTab === 'content' ? 'Conteúdo das Seções' : 
             activeTab === 'gallery' ? 'Galeria de Fotos' :
             activeTab === 'sponsorship' ? 'Cotas de Patrocínio' :
             activeTab === 'banners' ? 'Banners do Hero' :
             'Como Ajudar'}
          </h2>
          <div className="w-12 h-1 bg-brand-orange"></div>
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
    if (settings && Object.keys(settings).length > 0 && Object.keys(localValues).length === 0) {
      const vals = Object.keys(settings).reduce((acc, key) => ({
        ...acc,
        [key]: settings[key].value
      }), {});
      setLocalValues(vals);
    }
  }, [settings]);

  const handleSaveSection = async (sectionTitle: string, keys: string[]) => {
    setSaving(sectionTitle);
    try {
      const results = await Promise.all(keys.map(key => updateSetting(key, localValues[key])));
      if (results.every(r => r.success)) {
        setSuccess(sectionTitle);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Error saving section:', err);
    }
    setSaving(null);
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  const sections = [
    {
      title: '01. Seção: A Jornada',
      keys: ['jornada_title', 'jornada_description', 'jornada_image']
    },
    {
      title: '02. Seção: O Desafio',
      keys: [
        'ticker_text',
        'desafio_title', 
        'desafio_description', 
        'target_amount', 
        'current_amount', 
        'supporters_count', 
        'dancers_count', 
        'event_date',
        'desafio_image'
      ]
    },
    {
      title: '03. Configurações de Doação Globais',
      keys: ['pix_key', 'vakinha_url']
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
                {key.includes('image') ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <OptimizedImageUploader 
                        onUploadSuccess={async (url) => {
                          setLocalValues(prev => ({ ...prev, [key]: url }));
                          await updateSetting(key, url);
                          setSuccess(section.title);
                          setTimeout(() => setSuccess(null), 3000);
                        }}
                        className="flex-1"
                      />
                      {localValues[key] && (
                        <div className="w-12 h-12 border border-white/10 overflow-hidden">
                          <img src={localValues[key]} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : key.includes('subtitle') || key.includes('description') ? (
                  <textarea 
                    rows={3} 
                    className="w-full bg-white/5 border border-white/10 p-3 text-sm font-serif focus:border-brand-orange focus:outline-none transition-all"
                    value={localValues[key] || ''}
                    onChange={(e) => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                ) : (
                  <input 
                    type={key.includes('amount') || key.includes('count') ? 'number' : 'text'}
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
              onClick={() => handleSaveSection(section.title, section.keys)}
              disabled={saving === section.title}
              className={`w-full py-4 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
                success === section.title ? 'bg-green-500' : 'bg-brand-orange hover:bg-white hover:text-brand-dark'
              } disabled:opacity-50`}
            >
              {saving === section.title ? <Loader2 className="w-3 h-3 animate-spin" /> : success === section.title ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
              {saving === section.title ? 'Salvando...' : success === section.title ? 'Salvo com Sucesso' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function GalleryManager() {
  const { images, loading, addImage, deleteImage } = useGallery();
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [adding, setAdding] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const handleAdd = async () => {
    if (!newUrl) return;
    setAdding(true);
    setStatus({ type: 'info', message: 'Salvando na galeria...' });
    const result = await addImage(newUrl, newCaption);
    if (result.success) {
      setNewUrl('');
      setNewCaption('');
      setStatus({ type: 'success', message: 'Foto adicionada com sucesso!' });
      setTimeout(() => setStatus(null), 3000);
    } else {
      setStatus({ type: 'error', message: 'Erro ao salvar: ' + result.error });
    }
    setAdding(false);
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
                <OptimizedImageUploader 
                  onUploadSuccess={(url) => setNewUrl(url)}
                  label="Selecionar do Computador"
                  folder="gallery"
                />
              </div>

              <div className="p-6 border border-white/5 bg-white/5 space-y-4">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Ou Link Externo</label>
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
                <div className="aspect-video border border-white/10 overflow-hidden bg-black/50">
                   <img src={newUrl} className="w-full h-full object-contain" alt="Preview" />
                </div>
              )}

              <div className="mt-auto pt-6">
                <button 
                  onClick={handleAdd}
                  disabled={adding || !newUrl}
                  className="w-full py-5 bg-brand-orange text-white text-[12px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Finalizar e Adicionar à Galeria
                </button>
              </div>
            </div>
          </div>
          {status && (
            <div className={`p-4 text-xs font-bold uppercase tracking-widest rounded-sm ${
              status.type === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/20' :
              status.type === 'error' ? 'bg-red-500/20 text-red-500 border border-red-500/20' :
              'bg-blue-500/20 text-blue-500 border border-blue-500/20'
            }`}>
              {status.message}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images?.map((image) => (
          <div key={image.id} className="group relative aspect-square bg-white/5 border border-white/10 overflow-hidden">
            <img src={image.url} alt={image.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
              <button 
                onClick={() => setImageToDelete(image.id)}
                className="p-3 bg-red-500 text-white rounded-full hover:bg-white hover:text-red-500 transition-all transform translate-y-4 group-hover:translate-y-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {imageToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-brand-dark border border-white/10 p-12 max-w-lg w-full text-center"
            >
              <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-8" />
              <h3 className="text-3xl font-serif italic mb-4">Excluir Foto?</h3>
              <p className="text-white/40 mb-12 font-serif">Esta ação não pode ser desfeita. A imagem será removida permanentemente da galeria.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setImageToDelete(null)}
                  className="flex-1 py-4 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    await deleteImage(imageToDelete);
                    setImageToDelete(null);
                  }}
                  className="flex-1 py-4 bg-red-500 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-red-500 transition-all"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SponsorshipManager() {
  const { tiers, loading, addTier, updateTier, deleteTier } = useSponsorship();
  const [editingTier, setEditingTier] = useState<SponsorshipTier | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: any) => {
    setSaving(true);
    if (isAdding) {
      await addTier(data);
    } else if (editingTier) {
      await updateTier(editingTier.id, data);
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
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-brand-orange text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Cota
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div key={tier.id} className={`p-8 border ${tier.highlight ? 'border-brand-orange bg-brand-orange/5' : 'border-white/10 bg-white/5'} flex flex-col`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-orange font-bold mb-1">{tier.highlight ? 'Cota Destaque' : 'Cota Standard'}</p>
                <h4 className="text-2xl font-serif italic">{tier.name}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingTier(tier)} className="p-2 hover:text-brand-orange transition-all"><Settings className="w-4 h-4" /></button>
                <button onClick={() => deleteTier(tier.id)} className="p-2 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-3xl font-serif mb-8">{tier.price}</p>
            <ul className="space-y-3 mb-8 flex-1">
              {tier.benefits.map((b, i) => (
                <li key={i} className="text-xs text-white/40 flex items-start gap-2">
                  <span className="w-1 h-1 bg-brand-orange mt-1.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {(editingTier || isAdding) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-brand-dark border border-white/10 p-12 max-w-2xl w-full relative"
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
                title: 'Novo Título', 
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
        {banners.map((banner) => (
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
                  className="bg-red-500 p-3 rounded-full hover:bg-white hover:text-red-500 transition-all"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-lg font-serif italic mb-1">{banner.title}</h4>
              <p className="text-xs text-white/40">{banner.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-brand-dark border border-white/10 p-12 max-w-2xl w-full relative"
            >
              <button 
                onClick={() => setEditingBanner(null)}
                className="absolute top-8 right-8 text-white/20 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-serif italic mb-8">Editar Slide</h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Título do Slide</label>
                  <input 
                    type="text"
                    defaultValue={editingBanner.title}
                    id="banner-title"
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Subtítulo / Legenda</label>
                  <input 
                    type="text"
                    defaultValue={editingBanner.subtitle}
                    id="banner-subtitle"
                    className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Imagem do Banner</label>
                  <div className="space-y-4">
                    <input 
                      type="text"
                      defaultValue={editingBanner.image_url}
                      id="banner-url"
                      className="w-full bg-white/5 border border-white/10 p-4 text-[10px] font-mono focus:border-brand-orange outline-none transition-all opacity-50"
                    />
                    <OptimizedImageUploader 
                      onUploadSuccess={(url) => {
                        const input = document.getElementById('banner-url') as HTMLInputElement;
                        if (input) input.value = url;
                      }}
                      folder="banners"
                      label="Substituir por Foto do Computador"
                    />
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      const title = (document.getElementById('banner-title') as HTMLInputElement).value;
                      const subtitle = (document.getElementById('banner-subtitle') as HTMLInputElement).value;
                      const image_url = (document.getElementById('banner-url') as HTMLInputElement).value;
                      const result = await updateBanner(editingBanner.id, { title, subtitle, image_url });
                      if (result.success) {
                        setEditingBanner(null);
                        triggerSuccess('Slide atualizado!');
                      }
                      setSaving(false);
                    }}
                    className="flex-1 py-4 bg-brand-orange text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {bannerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-brand-dark border border-white/10 p-12 max-w-lg w-full text-center"
            >
              <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-8" />
              <h3 className="text-3xl font-serif italic mb-4">Excluir Slide?</h3>
              <p className="text-white/40 mb-12 font-serif">Este slide será removido permanentemente do carrossel do topo.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setBannerToDelete(null)}
                  className="flex-1 py-4 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-red-500 transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sim, Excluir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HelpSectionManager() {
  const { settings, loading, updateSetting } = useSiteSettings();
  const [saving, setSaving] = useState<string | null>(null);

  if (loading) return <Loader2 className="w-8 h-8 text-brand-orange animate-spin mx-auto" />;

  const helpSections = [
    {
      id: 1,
      title: 'Opção 01',
      keys: {
        title: 'help_option1_title',
        description: 'help_option1_description',
        image: 'help_option1_image'
      }
    },
    {
      id: 2,
      title: 'Opção 02',
      keys: {
        title: 'help_option2_title',
        description: 'help_option2_description',
        image: 'help_option2_image'
      }
    },
    {
      id: 3,
      title: 'Opção 03',
      keys: {
        title: 'help_option3_title',
        description: 'help_option3_description',
        image: 'help_option3_image'
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {helpSections.map((sec) => (
        <div key={sec.id} className="bg-white/5 border border-white/10 p-8 space-y-6 flex flex-col">
          <h3 className="text-xl font-serif italic text-brand-orange">{sec.title}</h3>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-white/40">Título</label>
              <input 
                type="text"
                className="w-full bg-white/5 border border-white/10 p-3 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                defaultValue={settings[sec.keys.title]?.value || ''}
                onBlur={async (e) => {
                  setSaving(sec.keys.title);
                  await updateSetting(sec.keys.title, e.target.value);
                  setSaving(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-white/40">Descrição</label>
              <textarea 
                rows={4}
                className="w-full bg-white/5 border border-white/10 p-3 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                defaultValue={settings[sec.keys.description]?.value || ''}
                onBlur={async (e) => {
                  setSaving(sec.keys.description);
                  await updateSetting(sec.keys.description, e.target.value);
                  setSaving(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-white/40">Imagem da Seção</label>
              <div className="space-y-4">
                <div className="aspect-square bg-black/50 border border-white/10 overflow-hidden mb-4">
                  <img src={settings[sec.keys.image]?.value} alt="" className="w-full h-full object-cover" />
                </div>
                <OptimizedImageUploader 
                  onUploadSuccess={async (url) => {
                    setSaving(sec.keys.image);
                    await updateSetting(sec.keys.image, url);
                    setSaving(null);
                  }}
                  folder="help"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-40">
            {saving?.startsWith('help_option' + sec.id) ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</>
            ) : (
              <><CheckCircle2 className="w-3 h-3 text-green-500" /> Sincronizado</>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
