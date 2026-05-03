import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Users, 
  ShoppingBag, 
  Ticket, 
  Calendar, 
  Award, 
  Instagram, 
  ArrowRight,
  Heart,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  CreditCard,
  Target,
  Copy,
  ExternalLink,
  RefreshCw,
  MapPin,
  Mail,
  Phone,
  Globe,
  ArrowUp,
  Loader2,
  CheckCircle2,
  Building2,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useGallery } from '../hooks/useGallery';
import { useSponsorship } from '../hooks/useSponsorship';
import { useHeroBanners } from '../hooks/useHeroBanners';
import { useTicker } from '../hooks/useTicker';
import { useJourney } from '../hooks/useJourney';
import { useFundraising } from '../hooks/useFundraising';
import { usePageTracking } from '../hooks/usePageTracking';
import { useEventTracking } from '../hooks/useEventTracking';

// Product Types
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

function VerticalTicker({ phrases }: { phrases: any[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [phrases.length]);

  if (phrases.length === 0) return null;

  return (
    <div className="bg-brand-orange py-3 overflow-hidden border-y border-black/10 flex justify-center items-center h-10 relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ 
            y: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="text-white text-[10px] uppercase tracking-[0.3em] font-bold text-center absolute w-full px-4 flex items-center justify-center gap-4"
        >
          <span className="opacity-50">×</span>
          {phrases[index].text}
          <span className="opacity-50">×</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const PRODUCTS: Product[] = [
  {
    id: 'mug-01',
    name: 'Caneca do Bem',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2670&auto=format&fit=crop',
    description: 'Caneca oficial do projeto Talentos de Minas. Edição limitada.'
  },
  {
    id: 'shirt-01',
    name: 'Camiseta do Projeto',
    price: 85.00,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2670&auto=format&fit=crop',
    description: 'Camiseta técnica em tecido respirável, com logo oficial.'
  }
];

function TierCard({ name, price, benefits, highlight = false, onSelect }: { name: string, price: string, benefits: string[], highlight?: boolean, onSelect: (name: string) => void }) {
  const { trackEvent } = useEventTracking();
  return (
    <div className={`p-12 border border-white/10 flex flex-col justify-between transition-all group ${highlight ? 'bg-brand-orange' : 'bg-white/5 hover:bg-white/10'}`}>
       <div>
          <h4 className="text-white text-2xl mb-2 font-serif">{name}</h4>
          <div className="flex items-baseline gap-2 mb-12">
            <span className="text-[10px] uppercase opacity-50 text-white">R$</span>
            <p className={`text-4xl font-display font-light ${highlight ? 'text-white' : 'text-brand-orange'}`}>{price}</p>
          </div>
          <ul className="space-y-4 mb-12">
            {(benefits || []).map((benefit, i) => (
              <li key={i} className={`text-xs flex items-center gap-3 font-serif ${highlight ? 'text-white/80' : 'text-white/40'}`}>
                 <span className={`w-1 h-1 rounded-full ${highlight ? 'bg-white' : 'bg-brand-orange'}`}></span>
                 {benefit}
              </li>
            ))}
          </ul>
       </div>
       <motion.button 
         whileHover={{ scale: 1.02 }}
         whileTap={{ scale: 0.98 }}
         onClick={() => {
           trackEvent('Solicitar Proposta', 'click', { tier: name });
           onSelect(name);
         }}
         className={`w-full py-4 text-[10px] uppercase tracking-widest font-bold border transition-all ${highlight ? 'bg-white text-brand-orange border-white hover:bg-brand-dark hover:text-white hover:border-brand-dark' : 'text-white border-white/20 hover:border-brand-orange hover:text-brand-orange'}`}>
         Solicitar Proposta
       </motion.button>
    </div>
  );
}

function ProposalModal({ tierName, tierPrice, tierBenefits, onClose }: { tierName: string, tierPrice: string, tierBenefits: string[], onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      tier_name: tierName,
      tier_price: tierPrice,
      tier_benefits: tierBenefits
    };

    try {
      const { error: insertError } = await supabase
        .from('proposal_requests')
        .insert([{
          name: data.name,
          company: data.company,
          phone: data.phone,
          email: data.email,
          tier_name: data.tier_name
        }]);

      if (insertError) throw insertError;

      // Call Edge Function
      await supabase.functions.invoke('send-proposal', { body: data });

      setSuccess(true);
      setTimeout(onClose, 4000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-brand-dark border border-white/10 p-8 md:p-12 max-w-xl w-full relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-12">
          <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Solicitação de Proposta</p>
          <h3 className="text-3xl md:text-4xl text-white font-serif italic">{tierName}</h3>
          <div className="h-[1px] w-12 bg-brand-orange mt-6"></div>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h4 className="text-2xl font-serif text-white mb-4">Solicitação Enviada!</h4>
              <p className="text-white/40 font-serif leading-relaxed">
                Obrigado pelo seu interesse. Enviamos uma confirmação para seu e-mail e nossa equipe entrará em contato em breve.
              </p>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Seu Nome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      required
                      name="name"
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Empresa/Pessoa física</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      name="company"
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                      placeholder="Razão Social ou Nome"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      required
                      name="phone"
                      type="tel" 
                      className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold">E-mail para Contato</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      required
                      name="email"
                      type="email" 
                      className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm font-serif focus:border-brand-orange outline-none transition-all"
                      placeholder="exemplo@email.com"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500 text-xs font-serif italic">{error}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-brand-orange text-white text-[12px] uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-8"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Solicitar Proposta Agora
              </button>
              
              <p className="text-[9px] uppercase tracking-widest text-white/20 text-center leading-relaxed">
                Ao solicitar, nossa equipe preparará um documento personalizado com todas as <br /> contrapartidas e benefícios da cota {tierName}.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function DonationDropdown({ variant = 'default', pixKey, vakinhaUrl }: { variant?: 'default' | 'large', pixKey?: string, vakinhaUrl?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);
  const { trackEvent } = useEventTracking();

  const finalPixKey = pixKey || "6093259@vakinha.com.br";
  const finalVakinhaUrl = vakinhaUrl || "https://www.vakinha.com.br/vaquinha/talentos-de-minas-nossa-turma-no-palco-internacional";

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(finalPixKey);
      setCopied(true);
      trackEvent('Copiar PIX', 'click');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
       <motion.button 
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
         onClick={toggleOpen}
         className={
           variant === 'large' 
           ? "bg-brand-orange text-white px-12 py-5 font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all flex items-center gap-4 group"
           : "bg-brand-orange text-white px-4 sm:px-10 py-3 sm:py-4 text-[10px] sm:text-xs uppercase tracking-widest font-bold hover:bg-black transition-all"
         }
       >
         {variant === 'large' ? 'Apoie Agora' : 'Doar Agora'}
         {variant === 'large' && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
       </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white text-brand-dark shadow-2xl p-6 md:p-10 border border-black/5 overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-brand-dark/40 hover:text-brand-orange transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 border-b border-black/5 pb-4">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Opção 01</p>
                  <h4 className="text-lg font-serif">Doação via PIX</h4>
                </div>
              </div>
              
              <div className="bg-brand-grey p-4 flex flex-col gap-3">
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Chave PIX</p>
                <div className="flex justify-between items-center bg-white p-3 border border-black/5">
                  <code className="text-xs font-mono">{finalPixKey}</code>
                  <button 
                    onClick={handleCopyPix}
                    className="p-2 hover:bg-brand-grey transition-colors text-brand-orange"
                    title="Copiar Chave"
                  >
                    {copied ? <span className="text-[9px] font-bold uppercase tracking-tighter">Copiado!</span> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 border-b border-black/5 pb-4 pt-2">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Opção 02</p>
                  <h4 className="text-lg font-serif">Campanha Vakinha</h4>
                </div>
              </div>

              <a 
                href={finalVakinhaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('Acessar Vakinha', 'click')}
                className="w-full bg-brand-dark text-white py-4 text-center font-bold uppercase tracking-widest text-[10px] hover:bg-brand-orange transition-all flex items-center justify-center gap-3"
              >
                Acessar Vakinha <ExternalLink className="w-3 h-3" />
              </a>

              <p className="text-[9px] uppercase tracking-widest opacity-40 leading-relaxed text-center italic">
                Sua ajuda cobre custos de 22 bailarinos mineiros em Córdoba, Argentina.
              </p>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [activeModal, setActiveModal] = useState<'store' | 'raffle' | 'event' | 'donation' | 'contact' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');

  // Dynamic Data
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { images, loading: galleryLoading } = useGallery();
  const { tiers, loading: tiersLoading } = useSponsorship();
  const { banners, loading: bannersLoading } = useHeroBanners();
  const { phrases, loading: phrasesLoading } = useTicker();
  const { items: journeyItems, loading: journeyLoading } = useJourney();
  const { expenses, loading: fundraisingLoading } = useFundraising();

  // Analytics: track page view
  usePageTracking();
  const { trackEvent } = useEventTracking();
  const [isJourneyPaused, setIsJourneyPaused] = useState(false);

  
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [selectedTierData, setSelectedTierData] = useState<{name: string, price: string, benefits: string[]} | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIdx === null) return;
      
      if (e.key === 'ArrowRight') {
        setSelectedImageIdx((prev) => (prev !== null && prev < images.length - 1) ? prev + 1 : 0);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIdx((prev) => (prev !== null && prev > 0) ? prev - 1 : images.length - 1);
      } else if (e.key === 'Escape') {
        setSelectedImageIdx(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIdx, images.length]);

  const currentBanner = banners[currentBannerIdx] || { 
    id: 'static-hero', 
    title: 'A Jornada: 26 Anos de Dança', 
    subtitle: 'Melhor Grupo no Festival Arte Minas 2026',
    image_url: '/hero-bg.jpg' 
  };

  // Custom totals calculation for UI
  const expensesGoal = expenses.reduce((acc, exp) => acc + exp.goal_amount, 0);
  const expensesRaised = expenses.reduce((acc, exp) => acc + exp.raised_amount, 0);

  const goalTotalValue = parseFloat(settings?.target_amount?.value || '0');
  const currentRaisedValue = parseFloat(settings?.current_amount?.value || '0');
  
  const goalTotal = expenses.length > 0 ? expensesGoal : (!isNaN(goalTotalValue) && settings?.target_amount?.value ? goalTotalValue : 136712);
  const currentRaised = expenses.length > 0 ? expensesRaised : (!isNaN(currentRaisedValue) && settings?.current_amount?.value ? currentRaisedValue : 88862);
  
  const safeGoal = goalTotal > 0 ? goalTotal : 136712;
  const percentage = Math.min((currentRaised / safeGoal) * 100, 100) || 0;

  // Calculate remaining days
  const eventDateStr = settings?.event_date?.value || '2026-09-30';
  const eventDate = new Date(eventDateStr);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const remainingDays = diffDays > 0 ? diffDays : 0;

  const supportersCount = settings?.supporters_count?.value ?? '412';
  const dancersCount = settings?.dancers_count?.value ?? '22';

  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sections = ['essencia', 'jornada', 'desafio', 'galeria', 'ajudar', 'patrocinio'];
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
  
  // Custom totals calculation for UI


  if (settingsLoading || bannersLoading || galleryLoading || tiersLoading || phrasesLoading || journeyLoading || fundraisingLoading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-white p-8">
      <div className="w-8 h-8 border-2 border-[#BE3144] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] uppercase tracking-widest opacity-40">Carregando conteúdo...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      {/* Navigation */}
      <nav aria-label="Navegação principal" className={`fixed top-0 left-0 w-full z-[70] transition-all duration-500 px-4 md:px-8 xl:px-12 py-4 flex justify-between items-center text-white ${isScrolled ? 'bg-black/80 backdrop-blur-md py-3 shadow-xl' : 'bg-transparent py-6'}`}>
        <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-white/10 z-0 pointer-events-none transition-opacity duration-500 ${isScrolled ? 'opacity-0' : 'opacity-100'}`}></div>

        <div className="flex items-center cursor-pointer z-10" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo_branca.png" alt="Nucleo Tatiana Figueiredo" className={`transition-all duration-500 object-contain ${isScrolled ? 'h-10 md:h-14' : 'h-12 md:h-20'}`} />
        </div>
        
        <div className="hidden lg:flex gap-6 xl:gap-12 text-[10px] xl:text-xs uppercase tracking-[0.2em] xl:tracking-[0.25em] font-display font-medium z-10">
          <a href="#essencia" className={`${activeSection === 'essencia' ? 'text-brand-orange' : 'text-white'} hover:text-brand-orange transition-colors drop-shadow-md`}>Nossa Essência</a>
          <a href="#jornada" className={`${activeSection === 'jornada' ? 'text-brand-orange' : 'text-white'} hover:text-brand-orange transition-colors drop-shadow-md`}>A Jornada</a>
          <a href="#desafio" className={`${activeSection === 'desafio' ? 'text-brand-orange' : 'text-white'} hover:text-brand-orange transition-colors drop-shadow-md`}>O Desafio</a>
          <a href="#galeria" className={`${activeSection === 'galeria' ? 'text-brand-orange' : 'text-white'} hover:text-brand-orange transition-colors drop-shadow-md`}>Galeria</a>
          <a href="#ajudar" className={`${activeSection === 'ajudar' ? 'text-brand-orange' : 'text-white'} hover:text-brand-orange transition-colors drop-shadow-md`}>Como Ajudar</a>
          <a href="#patrocinio" className={`${activeSection === 'patrocinio' ? 'text-brand-orange' : 'text-white'} hover:text-brand-orange transition-colors drop-shadow-md`}>Patrocínio</a>
          <button onClick={() => setActiveModal('contact')} className="text-white hover:text-brand-orange transition-colors drop-shadow-md uppercase">Contatos</button>
        </div>

        <div className="relative z-20 flex items-center gap-2 sm:gap-4">
          <DonationDropdown pixKey={settings?.pix_key?.value} vakinhaUrl={settings?.vakinha_url?.value} />
          
          <button 
            className="lg:hidden text-white p-1 sm:p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-7 h-7 sm:w-8 h-8" /> : <Menu className="w-7 h-7 sm:w-8 h-8" />}
          </button>
        </div>
      </nav>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="fixed inset-0 bg-brand-dark z-[60] flex flex-col p-8 pt-32"
            >
              <div className="flex flex-col gap-8 text-2xl uppercase tracking-widest font-display text-white">
                <a href="#essencia" onClick={() => setIsMenuOpen(false)} className={`${activeSection === 'essencia' ? 'text-brand-orange pl-4 border-l-2 border-brand-orange' : 'text-white'} hover:text-brand-orange transition-all duration-300`}>Nossa Essência</a>
                <a href="#jornada" onClick={() => setIsMenuOpen(false)} className={`${activeSection === 'jornada' ? 'text-brand-orange pl-4 border-l-2 border-brand-orange' : 'text-white'} hover:text-brand-orange transition-all duration-300`}>A Jornada</a>
                <a href="#desafio" onClick={() => setIsMenuOpen(false)} className={`${activeSection === 'desafio' ? 'text-brand-orange pl-4 border-l-2 border-brand-orange' : 'text-white'} hover:text-brand-orange transition-all duration-300`}>O Desafio</a>
                <a href="#galeria" onClick={() => setIsMenuOpen(false)} className={`${activeSection === 'galeria' ? 'text-brand-orange pl-4 border-l-2 border-brand-orange' : 'text-white'} hover:text-brand-orange transition-all duration-300`}>Galeria</a>
                <a href="#ajudar" onClick={() => setIsMenuOpen(false)} className={`${activeSection === 'ajudar' ? 'text-brand-orange pl-4 border-l-2 border-brand-orange' : 'text-white'} hover:text-brand-orange transition-all duration-300`}>Como Ajudar</a>
                <a href="#patrocinio" onClick={() => setIsMenuOpen(false)} className={`${activeSection === 'patrocinio' ? 'text-brand-orange pl-4 border-l-2 border-brand-orange' : 'text-white'} hover:text-brand-orange transition-all duration-300`}>Patrocínio</a>
                <button onClick={() => { setIsMenuOpen(false); setActiveModal('contact'); }} className="text-white hover:text-brand-orange text-left uppercase transition-all duration-300">Contatos</button>
              </div>
              
              <div className="mt-auto pt-12 border-t border-white/10">
                <DonationDropdown variant="large" pixKey={settings?.pix_key?.value} vakinhaUrl={settings?.vakinha_url?.value} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Hero Section Carousel */}
      <header role="banner" className="relative h-[110vh] overflow-hidden flex items-end pb-32 px-6 lg:px-12 bg-[#1A1A1A]">
        {/* Top Gradient Overlay for Nav Readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-transparent to-transparent h-40 pointer-events-none"></div>

        <div className="absolute inset-0 z-0 bg-[#1A1A1A]">
          <AnimatePresence mode="popLayout">
            <motion.img 
              key={currentBanner.image_url}
              src={currentBanner.image_url || '/hero-bg.jpg'} 
              alt={currentBanner.title || "Dança"}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.8, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/80 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-6xl w-full">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 mb-8"
          >
            <span className="h-[1px] w-12 bg-brand-orange"></span>
            <p className="text-white text-xs uppercase tracking-[0.4em] font-display font-medium">
              {currentBanner.subtitle || 'Melhor Grupo no Festival Arte Minas 2026'}
            </p>
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.h1 
              key={currentBanner.id + '-title'}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[110px] text-white leading-[1.1] mb-12 font-serif"
            >
              {currentBanner.title ? (
                currentBanner.title.includes(':') ? (
                  <>
                    {(currentBanner.title.split(':')[0] || '').trim()}:<br />
                    <span className="italic">{(currentBanner.title.split(':')[1] || '').trim()}</span>
                  </>
                ) : currentBanner.title
              ) : (
                <>
                  A Jornada:<br />
                  <span className="italic">26 Anos de</span><br />
                  Dança
                </>
              )}
            </motion.h1>
          </AnimatePresence>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col md:flex-row gap-12 items-start md:items-center"
          >
            <p className="text-white/60 text-lg max-w-lg font-serif leading-relaxed italic">
              {currentBanner.subtitle || 'Transformando talento mineiro em excelência mundial. Nossa próxima parada: Danzamerica, Argentina.'}
            </p>
          </motion.div>

          {/* Carousel Indicators */}
          {banners.length > 1 && (
            <div className="flex gap-4 mt-12">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentBannerIdx(idx)}
                  className={`h-1 transition-all duration-500 ${idx === currentBannerIdx ? 'w-12 bg-brand-orange' : 'w-4 bg-white/20'}`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      <main>
      {/* History & Social Proof Details */}
      {/* Essence Section */}
      <motion.section 
        id="essencia" 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="py-32 bg-brand-grey px-6 lg:px-12 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
           <div className="order-2 lg:order-1">
              <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">Nossa Essência</p>
              <h2 className="text-5xl md:text-7xl text-brand-dark mb-12 font-serif">
                {settings.essencia_title?.value || 'Nossa Essência: A alma por trás de cada movimento'}
              </h2>
              <div className="prose prose-lg prose-serif text-brand-dark/70 leading-relaxed max-w-xl">
                <p className="whitespace-pre-line">
                  {settings.essencia_text?.value || 'No Núcleo de Dança, acreditamos que a técnica é apenas o meio, enquanto a alma é o fim. Nossa essência reside na disciplina que liberta, na paixão que contagia e no compromisso inabalável com a arte.'}
                </p>
              </div>
           </div>
           <div className="relative order-1 lg:order-2">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className="aspect-[4/5] bg-brand-dark overflow-hidden ring-1 ring-black/10 shadow-2xl relative"
              >
                <img 
                  src={settings.essencia_image?.value || "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2669&auto=format&fit=crop"} 
                  alt="Nossa Essência" 
                  className="w-full h-full object-cover brightness-90 contrast-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </motion.div>
              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 border-2 border-brand-orange/10 rounded-full hidden md:block"></div>
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-brand-orange/5 rounded-full blur-2xl"></div>
           </div>
        </div>
      </motion.section>

      {/* History & Social Proof Details */}
      <motion.section 
        id="jornada" 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="py-32 bg-white px-6 lg:px-12"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
           <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className="aspect-video bg-brand-dark overflow-hidden ring-1 ring-black/10"
              >
                <img 
                  src={settings.jornada_image?.value || "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=2670&auto=format&fit=crop"} 
                  alt="Nucleo Performance" 
                  className="w-full h-full object-cover grayscale contrast-125"
                />
              </motion.div>
              <div className="absolute -top-20 -right-20 w-64 h-64 hidden md:flex items-center justify-center z-20 pointer-events-none">
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0"
                 >
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <path
                        id="circlePath"
                        d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
                        fill="transparent"
                      />
                      <text className="fill-brand-orange/40 text-[12px] uppercase tracking-[0.4em] font-bold">
                        <textPath href="#circlePath">
                          • {new Date().getFullYear() - 2000} Anos Extraordinários • Desde 2000 • Núcleo de Dança
                        </textPath>
                      </text>
                    </svg>
                 </motion.div>
                 <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 bg-brand-orange/80 rounded-full shadow-2xl border border-white/20 backdrop-blur-[2px]"></div>
                    <div className="relative text-center">
                       <span className="text-5xl font-serif italic text-white block leading-none mb-1">
                         {new Date().getFullYear() - 2000}
                       </span>
                       <p className="text-[10px] uppercase tracking-[0.3em] text-white font-bold">Anos</p>
                    </div>
                 </div>
              </div>
           </div>
           <div>
              <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">A Jornada</p>
              <h2 className="text-5xl md:text-7xl text-brand-dark mb-12 font-serif">
                {settings.jornada_title?.value || 'Excelência que Atravessa Fronteiras.'}
              </h2>
                               <div 
                  className="relative h-[600px] md:h-[550px] overflow-hidden group/container"
                  onMouseEnter={() => setIsJourneyPaused(true)}
                  onMouseLeave={() => setIsJourneyPaused(false)}
                  onTouchStart={() => setIsJourneyPaused(true)}
                  onTouchEnd={() => setIsJourneyPaused(false)}
                >
                   <motion.div 
                     className="space-y-16 md:space-y-24 py-32"
                     animate={isJourneyPaused ? {} : { y: ["0%", "-50%"] }}
                     transition={{
                       duration: Math.max(35, (journeyItems?.length || 0) * 12),
                       repeat: Infinity,
                       ease: "linear"
                     }}
                   >
                       {[...(journeyItems || []), ...(journeyItems || [])].map((item, idx) => (
                         <motion.div 
                           key={`${item.id}-${idx}`}
                           className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-center group/item transition-all duration-1000 px-4 md:px-0"
                           initial={{ opacity: 0.1, scale: 0.8, filter: 'blur(8px)', y: 50 }}
                           whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
                           viewport={{ amount: 0.5, margin: "-20% 0px -20% 0px" }}
                         >
                            <div className="flex-shrink-0 w-full md:w-40 text-center md:text-right">
                               <span className="text-brand-orange text-5xl md:text-7xl font-serif block leading-none transition-all group-hover/item:text-brand-dark group-hover/item:scale-105">{item.label}</span>
                            </div>
                            <div className="flex-1 md:border-l-2 md:border-brand-orange/10 md:pl-12 text-center md:text-left transition-all group-hover/item:border-brand-orange md:group-hover/item:translate-x-4">
                               <h4 className="text-2xl md:text-3xl font-serif mb-2 md:mb-4 text-brand-dark group-hover/item:text-brand-orange transition-colors">{item.title}</h4>
                               <p className="text-brand-dark/70 text-base md:text-lg leading-relaxed font-serif max-w-xl group-hover/item:text-brand-dark transition-colors">
                                 {item.description}
                               </p>
                            </div>
                         </motion.div>
                       ))}
                    </motion.div>
                    
                    {/* Modern Glassy Mask */}
                    <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white via-white/90 to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none" />
                 </div>
            </div>
        </div>
      </motion.section>

      {/* Premium Vertical Ticker */}
      <VerticalTicker phrases={phrases} />

      {/* Goal Tracker Section */}
      <motion.section 
        id="desafio" 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="bg-brand-dark py-32 px-6 lg:px-12 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">O Desafio</p>
              <h2 className="text-5xl md:text-7xl text-white mb-8 leading-tight font-serif">
                {settings.desafio_title?.value || 'Rumo ao Danzamerica 2026'}
              </h2>
              <p className="text-white/40 text-lg leading-relaxed max-w-xl mb-12 font-serif text-justify-editorial">
                {settings.desafio_description?.value || 'Após sermos coroados como o melhor grupo no Festival Arte Minas, recebemos o convite oficial para representar o Brasil em Córdoba, Argentina.'}
                <br /><br />
                Nossa meta de arrecadação de <span className="text-white">R$ {goalTotal.toLocaleString()}</span> cobrirá os custos de transporte, hospedagem e inscrições para {dancersCount} bailarinos que dedicam suas vidas à excelência do movimento.
              </p>
              
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-brand-orange text-4xl font-display font-light">{percentage.toFixed(1)}%</span>
                  <span className="text-white/40 text-xs uppercase tracking-widest">Alcançado</span>
                </div>
                <div className="h-[2px] w-full bg-white/10 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-brand-orange shadow-[0_0_15px_rgba(255,90,31,0.5)]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                <div>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2 font-display">Arrecadado</p>
                  <p className="text-white text-2xl font-display font-medium">R$ {currentRaised.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2 font-display">Meta Final</p>
                  <p className="text-white text-2xl font-display font-medium">R$ {goalTotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2 font-display">Apoiadores</p>
                  <p className="text-white text-2xl font-display font-medium">{Number(supportersCount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2 font-display">Dias Restantes</p>
                  <p className="text-white text-2xl font-display font-medium">{remainingDays}</p>
                </div>
              </div>


            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative aspect-[3/4] group overflow-hidden"
            >
              <img 
                src={settings.desafio_image?.value || "https://images.unsplash.com/photo-1535525153412-5a42439a210d?q=80&w=2670&auto=format&fit=crop"} 
                alt="Ensaio Bailarinos" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 contrast-110"
              />
              <div className="absolute inset-0 ring-1 ring-white/20 ring-inset pointer-events-none"></div>
              <div className="absolute bottom-8 left-8 bg-brand-orange p-8 md:p-10 max-w-[200px] text-white shadow-2xl">
                <p className="text-6xl font-display font-bold mb-2">{dancersCount}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-display font-bold leading-relaxed">Bailarinos Prontos para Brilhar</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Gallery Section */}
      <section id="galeria" className="py-32 bg-brand-white px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-xl">
              <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">Galeria</p>
              <h2 className="text-5xl md:text-7xl text-brand-dark mb-8 leading-tight font-serif">
                Arte em <br /><span className="italic">Movimento</span>
              </h2>
            </div>
            <p className="text-brand-dark/40 text-sm font-serif max-w-xs mb-4 italic">
              Registros da dedicação diária de nossos bailarinos que buscam a perfeição para representar Minas na Argentina.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images && images.length > 0 ? (
              images.map((img, i) => (
                <motion.div 
                  key={img?.id || i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  onClick={() => setSelectedImageIdx(i)}
                  className="aspect-square bg-brand-grey overflow-hidden group border border-black/5 relative cursor-pointer"
                >
                  <img 
                    src={img?.url || ''} 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-110" 
                    alt={img?.caption || `Galeria ${i}`} 
                  />
                  {img?.caption && (
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[10px] uppercase tracking-widest font-bold">{img.caption}</p>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border border-dashed border-black/10">
                <p className="text-brand-dark/20 text-xs uppercase tracking-widest font-bold">Nenhuma foto na galeria ainda</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How to Help - Interative Cards */}
       <section id="ajudar" className="py-32 bg-brand-white px-6 lg:px-12">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-24">
             <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">Como Ajudar</p>
             <h2 className="text-5xl md:text-7xl text-brand-dark mb-8 font-serif">Maneiras de <span className="italic">Apoiar</span></h2>
             <p className="text-brand-dark/40 text-lg max-w-2xl mx-auto font-serif">
               Escolha a forma que melhor se adapta a você e ajude nossos bailarinos a alcançarem seus sonhos.
             </p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Loja */}
            <motion.div 
              whileHover={{ y: -10 }}
              onClick={() => {
                trackEvent('Abrir Loja', 'click');
                setActiveModal('store');
              }}
              className="bg-brand-grey p-12 flex flex-col justify-between h-full group hover:bg-brand-orange transition-colors duration-500 cursor-pointer"
            >
              <div>
                <div className="w-full h-40 mb-8 overflow-hidden bg-brand-dark/10 group-hover:bg-white/10 transition-colors">
                  <img 
                    src={settings.help_store_image?.value || "https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=2670&auto=format&fit=crop"} 
                    alt="Loja"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <h3 className="text-3xl mb-4 group-hover:text-white font-serif">{settings.help_store_title?.value || 'Nossa Loja'}</h3>
                <p className="text-brand-dark/40 text-sm font-serif leading-relaxed group-hover:text-white/60 mb-8">
                  {settings.help_store_description?.value || 'Adquira produtos exclusivos do Núcleo. Todo o lucro é revertido para a viagem dos bailarinos.'}
                </p>
              </div>
              <button className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] group-hover:text-white">
                Ver Produtos <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Rifa */}
            <motion.div 
              whileHover={{ y: -10 }}
              onClick={() => {
                trackEvent('Abrir Rifa', 'click');
                setActiveModal('raffle');
              }}
              className="bg-brand-grey p-12 flex flex-col justify-between h-full group hover:bg-brand-orange transition-colors duration-500 cursor-pointer"
            >
              <div>
                <div className="w-full h-40 mb-8 overflow-hidden bg-brand-dark/10 group-hover:bg-white/10 transition-colors">
                  <img 
                    src={settings.help_raffle_image?.value || "https://images.unsplash.com/photo-1535525153412-5a42439a210d?q=80&w=2670&auto=format&fit=crop"} 
                    alt="Rifa"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <h3 className="text-3xl mb-4 group-hover:text-white font-serif">{settings.help_raffle_title?.value || 'Rifa Digital'}</h3>
                <p className="text-brand-dark/40 text-sm font-serif leading-relaxed group-hover:text-white/60 mb-8">
                  {settings.help_raffle_description?.value || 'Concorra a uma TV 50" por apenas R$ 25,00. Quanto mais bilhetes, maior sua chance e maior a nossa ajuda.'}
                </p>
              </div>
              <button className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] group-hover:text-white">
                Comprar Bilhetes <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Eventos */}
            <motion.div 
              whileHover={{ y: -10 }}
              onClick={() => {
                trackEvent('Abrir Evento', 'click');
                setActiveModal('event');
              }}
              className="bg-brand-grey p-12 flex flex-col justify-between h-full group hover:bg-brand-orange transition-colors duration-500 cursor-pointer"
            >
              <div>
                <div className="w-full h-40 mb-8 overflow-hidden bg-brand-dark/10 group-hover:bg-white/10 transition-colors">
                  <img 
                    src={settings.help_event_image?.value || "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=2670&auto=format&fit=crop"} 
                    alt="Evento"
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <h3 className="text-3xl mb-4 group-hover:text-white font-serif">{settings.help_event_title?.value || 'Ação Junina'}</h3>
                <p className="text-brand-dark/40 text-sm font-serif leading-relaxed group-hover:text-white/60 mb-8">
                  {settings.help_event_description?.value || 'Venha para o nosso Arraiá! Compre ingressos para o bingo e veja a nossa Grande Quadrilha.'}
                </p>
              </div>
              <button className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] group-hover:text-white">
                Saber Mais <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sponsorship Section */}
      <section id="patrocinio" className="py-32 bg-brand-dark px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">Patrocínio</p>
            <h2 className="text-5xl md:text-7xl text-white mb-8 font-serif">Invista no <span className="italic">Talento</span></h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto font-serif">
              Sua empresa pode ser a ponte que levará 22 bailarinos mineiros ao palco internacional. Conheça nossas cotas de patrocínio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
             {(tiers || []).filter(t => t.highlight).map(tier => (
               <TierCard 
                 key={tier.id}
                 name={tier.name}
                 price={tier.price}
                 benefits={tier.benefits}
                 highlight={true}
                 onSelect={() => setSelectedTierData({ name: tier.name, price: tier.price, benefits: tier.benefits })}
               />
             ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {(tiers || []).filter(t => !t.highlight).map((tier, idx) => (
                <motion.div 
                  key={tier.id} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/5 p-12 border border-white/10 hover:border-brand-orange transition-all flex flex-col justify-between"
                >
                  <div>
                     <h4 className="text-white text-2xl mb-2 font-serif">{tier.name}</h4>
                     <p className="text-brand-orange text-3xl font-display font-light mb-6">R$ {tier.price}</p>
                     <ul className="space-y-4 mb-8">
                        {(tier.benefits || []).map((benefit, i) => (
                          <li key={i} className="text-white/40 text-xs flex items-center gap-3 font-serif">
                             <span className="w-1 h-1 rounded-full bg-brand-orange"></span>
                             {benefit}
                          </li>
                        ))}
                     </ul>
                  </div>
                  <motion.button 
                    whileHover={{ x: 5 }}
                    onClick={() => setSelectedTierData({ name: tier.name, price: tier.price, benefits: tier.benefits })}
                    className="text-white text-[10px] uppercase tracking-widest font-bold border-b border-white/20 pb-2 hover:text-brand-orange hover:border-brand-orange transition-all w-fit"
                  >
                    Solicitar Proposta
                  </motion.button>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      </main>

      <footer className="bg-brand-white pt-32 pb-12 px-6 lg:px-12 border-t border-brand-dark/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-32 text-brand-dark/80">
            <div className="col-span-1 md:col-span-2">
              <h4 className="font-serif text-3xl mb-8 uppercase italic font-bold">Núcleo de Dança</h4>
              <p className="max-w-sm text-sm font-serif leading-relaxed mb-8">
                Há 26 anos construindo carreiras e sonhos através da disciplina e da arte. Sediados em Belo Horizonte, somos o berço dos novos talentos de Minas.
              </p>
              </div>
            <div>
              <h5 className="text-[10px] uppercase font-bold tracking-widest mb-8 text-brand-orange">Navegação</h5>
              <ul className="space-y-4 text-xs font-display">
                <li><a href="#essencia" className="hover:text-brand-orange">Nossa Essência</a></li>
                <li><a href="#jornada" className="hover:text-brand-orange">A Jornada</a></li>
                <li><a href="#desafio" className="hover:text-brand-orange">O Desafio</a></li>
                <li><a href="#galeria" className="hover:text-brand-orange">Galeria</a></li>
                <li><a href="#ajudar" className="hover:text-brand-orange">Como Ajudar</a></li>
                <li><a href="#patrocinio" className="hover:text-brand-orange">Patrocínio</a></li>
                <li className="pt-4 border-t border-brand-dark/5"><a href="/admin" className="hover:text-brand-orange">Painel Administrativo</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[10px] uppercase font-bold tracking-widest mb-8 text-brand-orange">Contato</h5>
              <ul className="space-y-4 text-[11px] font-serif">
                <li>
                  <a href="https://www.google.com/maps/search/?api=1&query=Av.+Abílio+Machado,+3997+–+Belo+Horizonte,+MG" target="_blank" className="flex gap-3 hover:text-brand-orange transition-colors group">
                    <MapPin className="w-4 h-4 text-brand-orange shrink-0 group-hover:scale-110 transition-transform" />
                    <span>Av. Abílio Machado, 3997 – BH/MG</span>
                  </a>
                </li>
                <li>
                  <a href="https://nucleotatianafigueiredo.com.br" target="_blank" className="flex gap-3 hover:text-brand-orange transition-colors group">
                    <Globe className="w-4 h-4 text-brand-orange shrink-0 group-hover:scale-110 transition-transform" />
                    <span>nucleotatianafigueiredo.com.br</span>
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/5531993615488" target="_blank" className="flex gap-3 hover:text-brand-orange transition-colors group">
                    <Phone className="w-4 h-4 text-brand-orange shrink-0 group-hover:scale-110 transition-transform" />
                    <span>(31) 99361-5488</span>
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/nucleodedanca" target="_blank" className="flex gap-3 hover:text-brand-orange transition-colors group">
                    <Instagram className="w-4 h-4 text-brand-orange shrink-0 group-hover:scale-110 transition-transform" />
                    <span>@nucleodedanca</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:nucleodedanca@yahoo.com.br" className="flex gap-3 hover:text-brand-orange transition-colors group">
                    <Mail className="w-4 h-4 text-brand-orange shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="break-all">nucleodedanca@yahoo.com.br</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center py-12 border-t border-brand-dark/5 text-[10px] uppercase tracking-widest font-bold">
            <p className="text-brand-dark/40">© 2026 Núcleo Tatiana Figueiredo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modals Rendering */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-dark/95 backdrop-blur-md"
              onClick={() => setActiveModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-brand-white w-full max-w-4xl p-8 md:p-16 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-8 right-8 text-brand-dark/20 hover:text-brand-orange"
              >
                <X className="w-8 h-8" strokeWidth={1} />
              </button>

              {activeModal === 'store' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div>
                    <h2 className="text-4xl mb-8 font-serif text-brand-dark">Itens Solidários</h2>
                    <div className="space-y-4">
                      {PRODUCTS.map(product => (
                        <div key={product.id} className="p-6 bg-brand-grey group flex gap-6 items-center">
                          <img src={product.image} className="w-24 h-24 object-cover" alt={product.name} />
                          <div className="flex-1">
                            <h4 className="font-serif text-xl text-brand-dark">{product.name}</h4>
                            <p className="text-brand-orange font-display">R$ {product.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-brand-grey p-8 flex flex-col justify-between">
                    <button className="w-full bg-brand-orange text-white py-5 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-dark transition-all">
                      Solicitar via WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'raffle' && (
                <div className="max-w-xl mx-auto text-center">
                  <Ticket className="w-16 h-16 text-brand-orange mx-auto mb-8" strokeWidth={1} />
                  <h2 className="text-5xl mb-4 font-serif text-brand-dark">Ação entre Amigos</h2>
                  <div className="bg-brand-grey p-12 mb-8 text-5xl font-display text-brand-orange">R$ 25,00</div>
                </div>
              )}

              {activeModal === 'event' && (
                <div className="max-w-xl mx-auto text-center">
                  <Calendar className="w-16 h-16 text-brand-orange mx-auto mb-8" strokeWidth={1} />
                  <h2 className="text-5xl mb-4 font-serif text-brand-dark">Ação Junina</h2>
                </div>
              )}

              {activeModal === 'contact' && (
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Entre em Contato</p>
                    <h2 className="text-4xl md:text-6xl font-serif text-brand-dark italic">Fale Conosco</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* WhatsApp */}
                    <a 
                      href="https://wa.me/5531993615488" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500"
                    >
                      <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                        <Phone className="w-6 h-6 text-brand-orange" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">WhatsApp</p>
                        <p className="text-xl font-serif text-brand-dark group-hover:text-white">(31) 99361-5488</p>
                      </div>
                    </a>

                    {/* Instagram */}
                    <a 
                      href="https://instagram.com/nucleodedanca" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500"
                    >
                      <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                        <Instagram className="w-6 h-6 text-brand-orange" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">Instagram</p>
                        <p className="text-xl font-serif text-brand-dark group-hover:text-white">@nucleodedanca</p>
                      </div>
                    </a>

                    {/* E-mail */}
                    <a 
                      href="mailto:nucleodedanca@yahoo.com.br" 
                      className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500"
                    >
                      <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                        <Mail className="w-6 h-6 text-brand-orange" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">E-mail</p>
                        <p className="text-base md:text-xl font-serif text-brand-dark group-hover:text-white break-all">nucleodedanca@yahoo.com.br</p>
                      </div>
                    </a>

                    {/* Localização */}
                    <a 
                      href="https://www.google.com/maps/search/?api=1&query=Av.+Abílio+Machado,+3997+–+Belo+Horizonte,+MG" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-6 p-8 bg-brand-grey hover:bg-brand-orange group transition-all duration-500"
                    >
                      <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6 text-brand-orange" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 group-hover:text-white/60">Endereço</p>
                        <p className="text-sm md:text-base font-serif text-brand-dark group-hover:text-white leading-tight">Av. Abílio Machado, 3997 – BH</p>
                      </div>
                    </a>
                  </div>

                  <div className="mt-12 pt-8 border-t border-brand-dark/5 text-center">
                    <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-brand-dark/20 italic">
                      Danzamerica 2026 • Talentos de Minas • Córdoba, Argentina
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-[80] p-4 bg-brand-orange text-white rounded-full shadow-2xl hover:bg-brand-dark transition-all group border border-white/20 backdrop-blur-sm"
          >
            <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Gallery Lightbox */}
      <AnimatePresence mode="wait">
        {selectedImageIdx !== null && images[selectedImageIdx] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
          >
            <button 
              onClick={() => setSelectedImageIdx(null)}
              className="absolute top-8 right-8 text-white/40 hover:text-white z-50 p-2"
            >
              <X className="w-10 h-10" strokeWidth={1} />
            </button>

            {/* Navigation Buttons */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIdx((prev) => (prev !== null && prev > 0) ? prev - 1 : images.length - 1);
              }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-brand-orange transition-all p-4 z-50 group"
            >
              <ChevronLeft className="w-12 h-12 md:w-20 md:h-20 group-hover:scale-110 transition-transform" strokeWidth={1} />
            </button>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIdx((prev) => (prev !== null && prev < images.length - 1) ? prev + 1 : 0);
              }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/20 hover:text-brand-orange transition-all p-4 z-50 group"
            >
              <ChevronRight className="w-12 h-12 md:w-20 md:h-20 group-hover:scale-110 transition-transform" strokeWidth={1} />
            </button>

            <motion.div 
              key={selectedImageIdx}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full h-full flex flex-col items-center justify-center gap-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-5xl max-h-[70vh] shadow-2xl">
                <img 
                  src={images[selectedImageIdx].url} 
                  alt={images[selectedImageIdx].caption} 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 ring-1 ring-white/10 pointer-events-none"></div>
              </div>
              
              {images[selectedImageIdx].caption && (
                <div className="text-center max-w-2xl px-6">
                  <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-bold mb-4">Registro da Jornada</p>
                  <h3 className="text-white text-2xl md:text-4xl font-serif italic">{images[selectedImageIdx].caption}</h3>
                </div>
              )}
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-[10px] uppercase tracking-widest font-bold">
                {selectedImageIdx + 1} / {images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedTierData && (
          <ProposalModal 
            tierName={selectedTierData.name} 
            tierPrice={selectedTierData.price}
            tierBenefits={selectedTierData.benefits}
            onClose={() => setSelectedTierData(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
