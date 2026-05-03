import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  isScrolled: boolean;
  isMenuOpen: boolean;
  activeSection: string;
  setIsMenuOpen: (open: boolean) => void;
  onContactClick: () => void;
  donationSlot: React.ReactNode;
  mobileDonationSlot: React.ReactNode;
}

const NAV_LINKS = [
  { href: '#essencia', label: 'Nossa Essência', id: 'essencia' },
  { href: '#jornada', label: 'A Jornada', id: 'jornada' },
  { href: '#desafio', label: 'O Desafio', id: 'desafio' },
  { href: '#galeria', label: 'Galeria', id: 'galeria' },
  { href: '#ajudar', label: 'Como Ajudar', id: 'ajudar' },
  { href: '#patrocinio', label: 'Patrocínio', id: 'patrocinio' },
];

export function Header({
  isScrolled,
  isMenuOpen,
  activeSection,
  setIsMenuOpen,
  onContactClick,
  donationSlot,
  mobileDonationSlot,
}: HeaderProps) {
  return (
    <>
      <nav
        aria-label="Navegação principal"
        className={`fixed top-0 left-0 w-full z-[70] transition-all duration-500 px-4 md:px-8 xl:px-12 py-4 flex justify-between items-center text-white ${
          isScrolled ? 'bg-black/80 backdrop-blur-md py-3 shadow-xl' : 'bg-transparent py-6'
        }`}
      >
        <div
          className={`absolute bottom-0 left-0 w-full h-[1px] bg-white/10 z-0 pointer-events-none transition-opacity duration-500 ${
            isScrolled ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Logo */}
        <div
          className="flex items-center cursor-pointer z-10"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img
            src="/logo_branca.png"
            alt="Nucleo Tatiana Figueiredo"
            className={`transition-all duration-500 object-contain ${isScrolled ? 'h-10 md:h-14' : 'h-12 md:h-20'}`}
          />
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex gap-6 xl:gap-12 text-[10px] xl:text-xs uppercase tracking-[0.2em] xl:tracking-[0.25em] font-display font-medium z-10">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={`${
                activeSection === link.id ? 'text-brand-orange' : 'text-white'
              } hover:text-brand-orange transition-colors drop-shadow-md`}
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={onContactClick}
            className="text-white hover:text-brand-orange transition-colors drop-shadow-md uppercase"
          >
            Contatos
          </button>
        </div>

        {/* CTA + Mobile Menu Toggle */}
        <div className="relative z-20 flex items-center gap-2 sm:gap-4">
          {donationSlot}
          <button
            className="lg:hidden text-white p-1 sm:p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isMenuOpen ? <X className="w-7 h-7 sm:w-8 h-8" /> : <Menu className="w-7 h-7 sm:w-8 h-8" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-brand-dark z-[60] flex flex-col p-8 pt-32"
          >
            <div className="flex flex-col gap-8 text-2xl uppercase tracking-widest font-display text-white">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`${
                    activeSection === link.id
                      ? 'text-brand-orange pl-4 border-l-2 border-brand-orange'
                      : 'text-white'
                  } hover:text-brand-orange transition-all duration-300`}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onContactClick();
                }}
                className="text-white hover:text-brand-orange text-left uppercase transition-all duration-300"
              >
                Contatos
              </button>
            </div>

            <div className="mt-auto pt-12 border-t border-white/10">
              {mobileDonationSlot}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
