/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform } from 'motion/react';
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
  Menu,
  X,
  CreditCard,
  Target
} from 'lucide-react';
import { useState, useEffect } from 'react';

// Product Types
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
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

// Pricing Constants
const GOAL_TOTAL = 136712;
const CURRENT_RAISED = 88862; // Example value, will be dynamic with Firebase
const PERCENTAGE = (CURRENT_RAISED / GOAL_TOTAL) * 100;

export default function App() {
  const [activeModal, setActiveModal] = useState<'store' | 'raffle' | 'event' | 'donation' | null>(null);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [raffleQty, setRaffleQty] = useState(1);
  const [bingoQty, setBingoQty] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const totalCart = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  const totalRaffle = raffleQty * 25;
  const totalBingo = bingoQty * 15;

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 mix-blend-difference bg-transparent px-6 py-8 flex justify-between items-center text-white border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="font-serif text-2xl font-bold tracking-tighter uppercase italic">Nucleo</span>
          <span className="h-4 w-[1px] bg-white/30 hidden md:block"></span>
          <span className="text-xs tracking-widest uppercase font-display hidden md:block">Tatiana Figueiredo</span>
        </div>
        
        <div className="hidden lg:flex gap-12 text-[10px] uppercase tracking-[0.2em] font-display">
          <a href="#jornada" className="hover:text-brand-orange transition-colors">A Jornada</a>
          <a href="#desafio" className="hover:text-brand-orange transition-colors">O Desafio</a>
          <a href="#galeria" className="hover:text-brand-orange transition-colors">Galeria</a>
          <a href="#ajudar" className="hover:text-brand-orange transition-colors">Como Ajudar</a>
          <a href="#patrocinio" className="hover:text-brand-orange transition-colors">Patrocínio</a>
          <a href="#eventos" className="hover:text-brand-orange transition-colors">Eventos</a>
        </div>

        <button 
          className="bg-brand-orange text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-black transition-all"
          onClick={() => setActiveModal('donation')}
        >
          Doar Agora
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[110vh] overflow-hidden flex items-end pb-32 px-6 lg:px-12 bg-brand-dark">
        <div className="absolute inset-0 z-0">
          <motion.img 
            style={{ y: useTransform(scrollYProgress, [0, 1], [0, 200]) }}
            src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2669&auto=format&fit=crop" 
            alt="Dança Contemporânea"
            className="w-full h-full object-cover opacity-60 grayscale filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "circOut" }}
          className="relative z-10 max-w-6xl w-full"
        >
          <div className="flex items-center gap-4 mb-8">
            <span className="h-[1px] w-12 bg-brand-orange"></span>
            <p className="text-brand-orange text-xs uppercase tracking-[0.4em] font-display font-medium">Melhor Grupo no Festival Arte Minas 2026</p>
          </div>
          <h1 className="text-6xl md:text-[120px] lg:text-[160px] text-white leading-[0.8] mb-12">
            A Jornada: <br />
            <span className="italic font-light">26 Anos</span> de Dança
          </h1>
          <div className="flex flex-col md:flex-row gap-12 items-start md:items-center">
            <p className="text-white/60 text-lg max-w-lg font-serif leading-relaxed italic">
              "Transformando talento mineiro em excelência mundial. Nossa próxima parada: Danzamerica, Argentina."
            </p>
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="hidden md:block"
            >
              <div className="w-12 h-20 border border-white/20 rounded-full flex justify-center p-2">
                <div className="w-1 h-2 bg-brand-orange rounded-full"></div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Marquee Social Proof */}
      <div className="bg-brand-orange py-4 overflow-hidden whitespace-nowrap border-y border-black/10">
        <div className="flex animate-marquee gap-12 items-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-12 items-center">
              <span className="text-white text-[10px] uppercase tracking-[0.3em] font-bold">14.8K Seguidores @nucleodedanca</span>
              <span className="text-white/50 text-2xl">×</span>
              <span className="text-white text-[10px] uppercase tracking-[0.3em] font-bold text-black"> Douglas de Oliveira: Primeiro Bailarino na Polônia</span>
              <span className="text-white/50 text-2xl">×</span>
              <span className="text-white text-[10px] uppercase tracking-[0.3em] font-bold">Vencedores "Crustáceos" 2026</span>
              <span className="text-white/50 text-2xl">×</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Tracker Section */}
      <section id="desafio" className="bg-brand-dark py-32 px-6 lg:px-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
            <div>
              <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">01. O Desafio</p>
              <h2 className="text-5xl md:text-7xl text-white mb-8 leading-tight">Rumo ao <br /><span className="italic text-brand-orange">Danzamerica 2026</span></h2>
              <p className="text-white/40 text-lg leading-relaxed max-w-xl mb-12 font-serif text-justify-editorial">
                Após sermos coroados como o melhor grupo no Festival Arte Minas, recebemos o convite oficial para representar o Brasil em Córdoba, Argentina. O desafio é transformar o talento em presença internacional. 
                <br /><br />
                Nossa meta de arrecadação de <span className="text-white">R$ 136.712,00</span> cobrirá os custos de transporte, hospedagem e inscrições para 22 bailarinos que dedicam suas vidas à excelência do movimento.
              </p>
              
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-brand-orange text-4xl font-display font-light">{PERCENTAGE.toFixed(1)}%</span>
                  <span className="text-white/40 text-xs uppercase tracking-widest">Alcançado</span>
                </div>
                <div className="h-[2px] w-full bg-white/10 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${PERCENTAGE}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="absolute top-0 left-0 h-full bg-brand-orange shadow-[0_0_15px_rgba(255,90,31,0.5)]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2 font-display">Arrecadado</p>
                  <p className="text-white text-2xl font-serif">R$ {CURRENT_RAISED.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2 font-display">Meta Final</p>
                  <p className="text-white text-2xl font-serif">R$ {GOAL_TOTAL.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2 font-display">Apoiadores</p>
                  <p className="text-white text-2xl font-serif">412</p>
                </div>
                <div>
                  <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2 font-display">Dias Restantes</p>
                  <p className="text-white text-2xl font-serif">152</p>
                </div>
              </div>
            </div>

            <div className="relative aspect-[3/4] group overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1535525153412-5a42439a210d?q=80&w=2670&auto=format&fit=crop" 
                alt="Ensaio Bailarinos" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 contrast-110"
              />
              <div className="absolute inset-0 ring-1 ring-white/20 ring-inset pointer-events-none"></div>
              <div className="absolute bottom-12 -left-12 bg-brand-orange p-12 max-w-xs text-white">
                <p className="text-5xl font-serif mb-4">22</p>
                <p className="text-xs uppercase tracking-widest font-display leading-loose">Bailarinos Prontos para Brilhar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galeria" className="py-32 bg-brand-white px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-xl">
              <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">03. Portfólio de Talentos</p>
              <h2 className="text-5xl md:text-7xl text-brand-dark mb-8 uppercase leading-tight font-serif">Arte em <br /><span className="italic">Movimento</span></h2>
            </div>
            <p className="text-brand-dark/40 text-sm font-serif max-w-xs mb-4 italic">
              Registros da dedicação diária de nossos 22 bailarinos que buscam a perfeição para representar Minas na Argentina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[1200px] md:h-[800px]">
            {/* Featured Video Placeholder */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="md:col-span-8 relative group overflow-hidden bg-brand-dark"
            >
              <img 
                src="https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=2574&auto=format&fit=crop" 
                className="w-full h-full object-cover opacity-60 grayscale group-hover:scale-105 transition-transform duration-1000" 
                alt="Main Video" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-24 h-24 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:bg-brand-orange group-hover:border-brand-orange transition-all duration-500">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-white border-b-[10px] border-b-transparent ml-2"></div>
                </button>
              </div>
              <div className="absolute bottom-8 left-8">
                <span className="text-[10px] uppercase tracking-widest text-white/60 mb-2 block">Destaque Vídeo</span>
                <h4 className="text-white text-2xl font-serif italic font-light">Performance "Crustáceos" - 2026</h4>
              </div>
            </motion.div>

            {/* Side Images */}
            <div className="md:col-span-4 grid grid-rows-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="relative overflow-hidden bg-brand-grey group"
              >
                <img 
                   src="https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=2671&auto=format&fit=crop" 
                   className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-110 transition-transform duration-1000" 
                   alt="Gallery 1" 
                />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden bg-brand-grey group"
              >
                <img 
                   src="https://images.unsplash.com/photo-1509670854474-5ce6fdecffd3?q=80&w=2670&auto=format&fit=crop" 
                   className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-110 transition-transform duration-1000" 
                   alt="Gallery 2" 
                />
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
             {[
               "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=2574&auto=format&fit=crop",
               "https://images.unsplash.com/photo-1516035054744-d474c5209db5?q=80&w=2574&auto=format&fit=crop",
               "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2670&auto=format&fit=crop",
               "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?q=80&w=2670&auto=format&fit=crop"
             ].map((url, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="aspect-square bg-brand-grey overflow-hidden group border border-black/5"
                >
                  <img 
                    src={url} 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-110" 
                    alt={`Thumb ${i}`} 
                  />
                </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Main Support Actions */}
      <section id="ajudar" className="py-32 px-6 lg:px-12 bg-brand-white">
        <div className="max-w-7xl mx-auto text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mb-8">
              <Heart className="text-brand-orange w-8 h-8" strokeWidth={1} />
            </div>
            <h2 className="text-5xl md:text-7xl text-brand-dark mb-8">Sua contribuição transforma o talento de Minas em conquista mundial.</h2>
            <p className="text-brand-dark/40 text-xl font-serif max-w-2xl mx-auto mb-12">
              Apoie agora e faça parte desta história de excelência artística e superação.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setActiveModal('donation')}
                className="bg-brand-orange text-white px-12 py-5 font-bold uppercase tracking-widest text-xs hover:bg-brand-dark transition-all flex items-center gap-4 group"
              >
                Apoie Agora <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </button>
              <button 
                onClick={() => window.location.href = '#patrocinio'}
                className="border border-brand-dark/10 px-12 py-5 font-bold uppercase tracking-widest text-xs hover:bg-brand-grey transition-all"
              >
                Seja um Patrocinador
              </button>
            </div>
          </motion.div>
        </div>

        {/* Support Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 grid-bg">
          {/* E-commerce */}
          <div 
            onClick={() => setActiveModal('store')}
            className="bg-brand-grey p-12 flex flex-col justify-between h-full group hover:bg-brand-orange transition-colors duration-500 cursor-pointer"
          >
            <div>
              <ShoppingBag className="w-10 h-10 mb-8 text-brand-orange group-hover:text-white" strokeWidth={1} />
              <h3 className="text-3xl mb-4 group-hover:text-white">Loja Solidária</h3>
              <p className="text-brand-dark/40 text-sm font-serif leading-relaxed group-hover:text-white/60 mb-8">
                Adquira nossas "Canecas do Bem" e Camisetas exclusivas do projeto. Todo o lucro é revertido para a viagem.
              </p>
            </div>
            <button className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] group-hover:text-white">
              Ver Produtos <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rifa */}
          <div 
            onClick={() => setActiveModal('raffle')}
            className="bg-brand-grey p-12 flex flex-col justify-between h-full group hover:bg-brand-orange transition-colors duration-500 cursor-pointer"
          >
            <div>
              <Ticket className="w-10 h-10 mb-8 text-brand-orange group-hover:text-white" strokeWidth={1} />
              <h3 className="text-3xl mb-4 group-hover:text-white">Rifa Digital</h3>
              <p className="text-brand-dark/40 text-sm font-serif leading-relaxed group-hover:text-white/60 mb-8">
                Concorra a uma TV 50" por apenas R$ 25,00. Quanto mais bilhetes, maior sua chance e maior a nossa ajuda.
              </p>
            </div>
            <button className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] group-hover:text-white">
              Comprar Bilhetes <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Eventos */}
          <div 
            onClick={() => setActiveModal('event')}
            className="bg-brand-grey p-12 flex flex-col justify-between h-full group hover:bg-brand-orange transition-colors duration-500 cursor-pointer"
          >
            <div>
              <Calendar className="w-10 h-10 mb-8 text-brand-orange group-hover:text-white" strokeWidth={1} />
              <h3 className="text-3xl mb-4 group-hover:text-white">Ação Junina</h3>
              <p className="text-brand-dark/40 text-sm font-serif leading-relaxed group-hover:text-white/60 mb-8">
                Venha para o nosso Arraiá! Compre ingressos para o bingo e veja a nossa Grande Quadrilha.
              </p>
            </div>
            <button className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] group-hover:text-white">
              Saber Mais <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-brand-dark/95 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
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
                  <h2 className="text-4xl mb-8">Itens Solidários</h2>
                  <div className="space-y-4">
                    {PRODUCTS.map(product => (
                      <div key={product.id} className="p-6 bg-brand-grey group flex gap-6 items-center">
                        <img src={product.image} className="w-24 h-24 object-cover" alt={product.name} />
                        <div className="flex-1">
                          <h4 className="font-serif text-xl">{product.name}</h4>
                          <p className="text-brand-orange font-display">R$ {product.price.toFixed(2)}</p>
                          <button 
                            onClick={() => addToCart(product)}
                            className="text-[10px] uppercase font-bold tracking-widest mt-2 hover:text-brand-orange flex items-center gap-2"
                          >
                            Adicionar <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-brand-grey p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl mb-8 font-serif">Seu Carrinho</h3>
                    {cart.length === 0 ? (
                      <p className="text-brand-dark/40 font-serif italic text-sm">Carrinho vazio...</p>
                    ) : (
                      <ul className="space-y-4">
                        {cart.map(item => (
                          <li key={item.product.id} className="flex justify-between items-center text-sm border-b border-black/5 pb-2">
                             <span>{item.qty}x {item.product.name}</span>
                             <div className="flex items-center gap-4">
                               <span className="font-display">R$ {(item.product.price * item.qty).toFixed(2)}</span>
                               <button onClick={() => removeFromCart(item.product.id)} className="text-brand-orange"><X className="w-4 h-4" /></button>
                             </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-12 pt-8 border-t border-black/10">
                    <div className="flex justify-between items-baseline mb-8">
                       <span className="text-xs uppercase font-bold tracking-widest">Total</span>
                       <span className="text-3xl font-display">R$ {totalCart.toFixed(2)}</span>
                    </div>
                    <button className="w-full bg-brand-orange text-white py-5 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-dark transition-all">
                      Finalizar Pedido
                    </button>
                    <p className="text-[10px] text-center mt-4 text-brand-dark/40 uppercase tracking-widest">Pagamento via PIX ou Cartão</p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'raffle' && (
              <div className="max-w-xl mx-auto text-center">
                <Ticket className="w-16 h-16 text-brand-orange mx-auto mb-8" strokeWidth={1} />
                <h2 className="text-5xl mb-4">Ação entre Amigos</h2>
                <p className="text-brand-dark/40 font-serif mb-12">Estamos sorteando uma Smart TV 50" Samsung Crystal 4K. Ajude o Núcleo a chegar na Argentina!</p>
                
                <div className="bg-brand-grey p-12 mb-8">
                  <p className="text-xs uppercase tracking-widest font-bold mb-6">Quantidade de Bilhetes</p>
                  <div className="flex items-center justify-center gap-8 mb-12">
                     <button onClick={() => setRaffleQty(Math.max(1, raffleQty - 1))} className="w-12 h-12 border border-black/10 flex items-center justify-center text-2xl hover:bg-brand-orange hover:text-white transition-all">-</button>
                     <span className="text-5xl font-display">{raffleQty}</span>
                     <button onClick={() => setRaffleQty(raffleQty + 1)} className="w-12 h-12 border border-black/10 flex items-center justify-center text-2xl hover:bg-brand-orange hover:text-white transition-all">+</button>
                  </div>
                  <div className="flex justify-between items-center pt-8 border-t border-black/10">
                     <span className="text-sm font-serif italic text-brand-dark/60">Valor Total:</span>
                     <span className="text-3xl font-display text-brand-orange">R$ {totalRaffle.toFixed(2)}</span>
                  </div>
                </div>
                
                <button className="w-full bg-brand-orange text-white py-5 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-dark transition-all">
                  Reservar Bilhete(s)
                </button>
                <p className="text-[10px] mt-6 text-brand-dark/30 uppercase tracking-widest">Sorteio através da Loteria Federal ao bater a meta.</p>
              </div>
            )}

            {activeModal === 'event' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                 <div>
                    <Calendar className="w-12 h-12 text-brand-orange mb-8" strokeWidth={1} />
                    <h2 className="text-5xl mb-6 italic">Arraiá do Núcleo</h2>
                    <p className="text-brand-dark/60 font-serif mb-8 text-justify-editorial">
                      Nosso tradicional evento junino deste ano é especial: a renda será 100% destinada ao Danzamerica. Teremos comida típica, a nossa Grande Quadrilha (Melhor Grupo 2026) e o Grande Bingo Comercial.
                    </p>
                    <ul className="space-y-4 text-sm font-serif">
                      <li className="flex gap-4"><strong>Data:</strong> 15 de Junho de 2026</li>
                      <li className="flex gap-4"><strong>Local:</strong> Sede do Núcleo - BH</li>
                      <li className="flex gap-4"><strong>Horário:</strong> das 16h às 22h</li>
                    </ul>
                 </div>
                 <div className="bg-brand-dark text-white p-12">
                    <h3 className="text-2xl mb-8 font-serif">Comprar Cartelas Bingo</h3>
                    <div className="flex items-center justify-between mb-8">
                       <span className="text-sm border-b border-white/20 pb-2">Investimento: R$ 15,00 / un</span>
                       <div className="flex items-center gap-4">
                          <button onClick={() => setBingoQty(Math.max(1, bingoQty - 1))} className="w-8 h-8 border border-white/20 flex items-center justify-center">-</button>
                          <span className="text-xl w-6 text-center">{bingoQty}</span>
                          <button onClick={() => setBingoQty(bingoQty + 1)} className="w-8 h-8 border border-white/20 flex items-center justify-center">+</button>
                       </div>
                    </div>
                    <div className="pt-8 border-t border-white/10 mb-12">
                       <div className="flex justify-between items-baseline">
                          <span className="text-[10px] uppercase tracking-widest">Total Cartelas</span>
                          <span className="text-3xl text-brand-orange font-display tracking-tight">R$ {totalBingo.toFixed(2)}</span>
                       </div>
                    </div>
                    <button className="w-full bg-brand-orange py-5 font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-brand-dark transition-all">
                      Garantir Participação
                    </button>
                 </div>
              </div>
            )}

            {activeModal === 'donation' && (
              <div className="max-w-xl mx-auto text-center">
                 <Heart className="w-16 h-16 text-brand-orange mx-auto mb-8 animate-pulse" strokeWidth={1} />
                 <h2 className="text-5xl mb-4 italic">Doe Qualquer Valor</h2>
                 <p className="text-brand-dark/40 font-serif mb-12 italic">Cada real nos aproxima do palco internacional na Argentina.</p>
                 
                 <div className="grid grid-cols-3 gap-4 mb-8">
                    {[50, 100, 500].map(val => (
                      <button key={val} className="p-6 border border-black/10 hover:border-brand-orange hover:text-brand-orange transition-all font-display text-2xl">
                        R$ {val}
                      </button>
                    ))}
                 </div>
                 
                 <div className="relative mb-12">
                    <input 
                      type="text" 
                      placeholder="Outro valor (R$)" 
                      className="w-full bg-brand-grey p-6 text-center text-4xl font-display outline-none focus:ring-2 ring-brand-orange/20"
                    />
                 </div>

                 <button className="w-full bg-brand-orange text-white py-5 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-dark transition-all">
                   Contribuir Agora
                 </button>
                 <div className="flex justify-center gap-8 mt-12 grayscale opacity-30">
                    <CreditCard className="w-8 h-8" strokeWidth={1} />
                    <Target className="w-8 h-8" strokeWidth={1} />
                 </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* B2B Sponsorship Section */}
      <section id="patrocinio" className="py-32 px-6 lg:px-12 bg-brand-dark">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
            <div className="max-w-2xl">
              <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">B2B Opportunities</p>
              <h2 className="text-5xl md:text-7xl text-white mb-8">Invista no <span className="italic">Futuro</span> da Dança Brasileira.</h2>
              <p className="text-white/40 text-xl font-serif">
                Sua marca associada a um dos núcleos de dança mais prestigiados de Minas Gerais.
              </p>
            </div>
            <button className="bg-white text-brand-dark px-12 py-5 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-orange hover:text-white transition-all">
              Baixar Mídia Kit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TierCard 
              name="Cota Ouro" 
              price="53.656,00" 
              benefits={["Logo em destaque no uniforme", "Menção oficial em todos os eventos", "Post exclusivo mensal no Instagram", "Banner VIP no Danzamerica"]}
              highlight
            />
            <TierCard 
              name="Cota Prata" 
              price="26.828,00" 
              benefits={["Logo no uniforme oficial", "Agradecimento pós-viagem", "Destaque nos canais digitais"]}
            />
            <TierCard 
              name="Cota Bronze" 
              price="13.414,00" 
              benefits={["Logo no site oficial", "Certificado de Patrocinador", "Stories de agradecimento"]}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
             <div className="bg-white/5 p-12 border border-white/10 hover:border-brand-orange transition-all">
                <h4 className="text-white text-2xl mb-2 font-serif">Apoiador</h4>
                <p className="text-brand-orange text-3xl font-display font-light mb-6">R$ 3.000,00</p>
                <p className="text-white/40 text-sm mb-8 font-serif">Ideal para pequenas empresas que desejam incentivar o projeto localmente.</p>
                <button className="text-white text-[10px] uppercase tracking-widest font-bold border-b border-white/20 pb-2 hover:text-brand-orange hover:border-brand-orange transition-all">Seja um Apoiador</button>
             </div>
             <div className="bg-white/5 p-12 border border-white/10 hover:border-brand-orange transition-all">
                <h4 className="text-white text-2xl mb-2 font-serif">Amigo</h4>
                <p className="text-brand-orange text-3xl font-display font-light mb-6">R$ 1.000,00</p>
                <p className="text-white/40 text-sm mb-8 font-serif">Sua contribuição pessoal para ajudar a custear o sonho de um bailarino.</p>
                <button className="text-white text-[10px] uppercase tracking-widest font-bold border-b border-white/20 pb-2 hover:text-brand-orange hover:border-brand-orange transition-all">Tornar-se Amigo</button>
             </div>
          </div>
        </div>
      </section>

      {/* History & Social Proof Details */}
      <section id="jornada" className="py-32 bg-brand-grey px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
           <div className="relative">
              <div className="aspect-video bg-brand-dark overflow-hidden ring-1 ring-black/10">
                <img 
                  src="https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=2670&auto=format&fit=crop" 
                  alt="Nucleo Performance" 
                  className="w-full h-full object-cover grayscale contrast-125"
                />
              </div>
              <div className="absolute -top-12 -right-12 w-48 h-48 border border-brand-orange/20 rounded-full hidden md:flex items-center justify-center p-4">
                 <p className="text-[10px] text-brand-orange uppercase tracking-[0.5em] font-display text-center leading-loose">26 Anos Extraordinários</p>
              </div>
           </div>
           <div>
              <p className="text-brand-orange text-xs uppercase tracking-[0.3em] font-display mb-6">A Nossa História</p>
              <h2 className="text-5xl md:text-7xl text-brand-dark mb-12">Excelência que <span className="italic">Atravessa</span> Fronteiras.</h2>
              <div className="space-y-12">
                 <div className="flex gap-8">
                    <span className="text-brand-orange text-4xl font-serif">2026.</span>
                    <div>
                       <h4 className="text-2xl font-serif mb-2">Melhor Grupo: Arte Minas</h4>
                       <p className="text-brand-dark/50 text-sm leading-relaxed font-serif">Premiados pela coreografia "Crustáceos", consolidando nossa posição como referência técnica no estado.</p>
                    </div>
                 </div>
                 <div className="flex gap-8">
                    <span className="text-brand-orange text-4xl font-serif">S.P.</span>
                    <div>
                       <h4 className="text-2xl font-serif mb-2">Social Proof: Douglas de Oliveira</h4>
                       <p className="text-brand-dark/50 text-sm leading-relaxed font-serif">Ex-aluno do Núcleo que hoje brilha como Primeiro Bailarino na Polônia, provando que nosso método forma cidadãos globais.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-white pt-32 pb-12 px-6 lg:px-12 border-t border-brand-dark/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-32 text-brand-dark/80">
            <div className="col-span-1 md:col-span-2">
              <h4 className="font-serif text-3xl mb-8 uppercase italic font-bold">Núcleo de Dança</h4>
              <p className="max-w-sm text-sm font-serif leading-relaxed mb-8">
                Há 26 anos construindo carreiras e sonhos através da disciplina e da arte. Sediados em Belo Horizonte, somos o berço dos novos talentos de Minas.
              </p>
              <div className="flex gap-6">
                <a href="#" className="p-3 bg-brand-dark text-white rounded-full hover:bg-brand-orange transition-all">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h5 className="text-[10px] uppercase font-bold tracking-widest mb-8 text-brand-orange">Navegação</h5>
              <ul className="space-y-4 text-xs font-display">
                <li><a href="#jornada" className="hover:text-brand-orange">História</a></li>
                <li><a href="#desafio" className="hover:text-brand-orange">Danzamerica</a></li>
                <li><a href="#galeria" className="hover:text-brand-orange">Galeria</a></li>
                <li><a href="#ajudar" className="hover:text-brand-orange">Doe Agora</a></li>
                <li><a href="#patrocinio" className="hover:text-brand-orange">Empresas</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[10px] uppercase font-bold tracking-widest mb-8 text-brand-orange">Contato</h5>
              <address className="not-italic text-xs font-display leading-relaxed">
                Rua da Dança, 123<br />
                Belo Horizonte - MG<br /><br />
                contato@nucleotatiana.com.br<br />
                (31) 99999-9999
              </address>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center py-12 border-t border-brand-dark/5 text-[10px] uppercase tracking-widest font-bold">
            <p className="text-brand-dark/40">© 2026 Núcleo Tatiana Figueiredo. Todos os direitos reservados.</p>
            <div className="flex gap-12 mt-8 md:mt-0 opacity-40">
              <span>Termos de Uso</span>
              <span>Privacidade</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TierCard({ name, price, benefits, highlight = false }: { name: string, price: string, benefits: string[], highlight?: boolean }) {
  return (
    <div className={`p-12 border border-white/10 flex flex-col justify-between transition-all group ${highlight ? 'bg-brand-orange' : 'bg-white/5 hover:bg-white/10'}`}>
       <div>
          <h4 className={`text-2xl mb-2 font-serif ${highlight ? 'text-white' : 'text-white'}`}>{name}</h4>
          <div className="flex items-baseline gap-2 mb-12">
            <span className={`text-[10px] uppercase opacity-50 ${highlight ? 'text-white' : 'text-white'}`}>R$</span>
            <p className={`text-4xl font-display font-light ${highlight ? 'text-white' : 'text-brand-orange'}`}>{price}</p>
          </div>
          <ul className="space-y-4 mb-12">
            {benefits.map((benefit, i) => (
              <li key={i} className={`text-xs flex items-center gap-3 font-serif ${highlight ? 'text-white/80' : 'text-white/40'}`}>
                 <span className={`w-1 h-1 rounded-full ${highlight ? 'bg-white' : 'bg-brand-orange'}`}></span>
                 {benefit}
              </li>
            ))}
          </ul>
       </div>
       <button className={`w-full py-4 text-[10px] uppercase tracking-widest font-bold border transition-all ${highlight ? 'bg-white text-brand-orange border-white hover:bg-brand-dark hover:text-white hover:border-brand-dark' : 'text-white border-white/20 hover:border-brand-orange hover:text-brand-orange'}`}>
         Solicitar Proposta
       </button>
    </div>
  );
}

