import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { useSocialLinks } from '../../hooks/useSocialLinks';

export function Links() {
  const { links, loading, refresh } = useSocialLinks();

  useEffect(() => {
    refresh();
  }, []);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPix = async (pixKey: string, id: string) => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar PIX:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeLinks = links.filter(link => link.is_active);

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans flex flex-col items-center py-20 px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-secondary/10 rounded-full blur-[150px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10 flex flex-col items-center"
      >
        {/* Profile / Brand Header */}
        <div className="w-24 h-24 bg-black/50 border border-brand-primary/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,107,0,0.2)]">
          {/* Pode trocar para o logo real aqui */}
          <LinkIcon className="w-10 h-10 text-brand-primary" />
        </div>
        
        <h1 className="text-3xl font-serif italic mb-2 text-center">Nossos Links</h1>
        <p className="text-gray-400 text-center mb-10 text-sm">
          Acesse nossas campanhas, chaves de doação e redes sociais oficiais.
        </p>

        {/* Links List */}
        <div className="w-full flex flex-col gap-4">
          {activeLinks.length === 0 ? (
            <div className="text-center text-gray-500 py-8 bg-white/5 rounded-2xl border border-white/5">
              Nenhum link disponível no momento.
            </div>
          ) : (
            <>
              {/* PIX Links - Top Priority */}
              {activeLinks.filter(l => l.is_pix).map((link, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={link.id}
                  className="w-full"
                >
                  <button
                    onClick={() => handleCopyPix(link.url, link.id)}
                    className={`w-full group relative overflow-hidden bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border border-brand-primary/40 hover:border-brand-primary hover:bg-brand-primary/20 transition-all p-5 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,107,0,0.1)] ${copiedId === link.id ? 'bg-green-900/40 border-green-500' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/10 to-brand-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className={`flex items-center gap-2 ${copiedId === link.id ? 'text-green-400' : 'text-brand-primary'}`}>
                      <Copy className="w-5 h-5" />
                      <span className="font-bold text-lg uppercase tracking-wider relative z-10">
                        {copiedId === link.id ? 'Copiado! ✅' : 'Copiar Chave PIX'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-300 relative z-10">{link.title}</span>
                  </button>
                </motion.div>
              ))}

              {/* Separator if there are both PIX and normal links */}
              {activeLinks.filter(l => l.is_pix).length > 0 && activeLinks.filter(l => !l.is_pix).length > 0 && (
                <div className="w-full h-px bg-white/10 my-2" />
              )}

              {/* Regular Links */}
              {activeLinks.filter(l => !l.is_pix).map((link, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (activeLinks.filter(l => l.is_pix).length + index) * 0.1 }}
                  key={link.id}
                  className="w-full"
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full group relative overflow-hidden bg-white/5 border border-white/10 hover:border-brand-secondary/50 hover:bg-brand-secondary/5 transition-all p-4 rounded-2xl flex items-center justify-between"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary/0 via-brand-secondary/5 to-brand-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <span className="font-medium text-lg relative z-10">{link.title}</span>
                    <div className="bg-white/10 text-white p-2 rounded-xl group-hover:scale-110 transition-transform relative z-10">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                  </a>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
