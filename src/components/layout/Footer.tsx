import React from 'react';
import { MapPin, Globe, Phone, Instagram, Mail } from 'lucide-react';

interface FooterProps {
  onAdminClick?: () => void;
}

export function Footer({ onAdminClick }: FooterProps) {
  return (
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
              <li className="pt-4 border-t border-brand-dark/5">
                <a href="/admin" className="hover:text-brand-orange">Painel Administrativo</a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] uppercase font-bold tracking-widest mb-8 text-brand-orange">Contato</h5>
            <ul className="space-y-4 text-[11px] font-serif">
              <li>
                <a href="https://www.google.com/maps/search/?api=1&query=Av.+Abílio+Machado,+3997+–+Belo+Horizonte,+MG" target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-brand-orange transition-colors group">
                  <MapPin className="w-4 h-4 text-brand-orange shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Av. Abílio Machado, 3997 – BH/MG</span>
                </a>
              </li>
              <li>
                <a href="https://nucleotatianafigueiredo.com.br" target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-brand-orange transition-colors group">
                  <Globe className="w-4 h-4 text-brand-orange shrink-0 group-hover:scale-110 transition-transform" />
                  <span>nucleotatianafigueiredo.com.br</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/5531993615488" target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-brand-orange transition-colors group">
                  <Phone className="w-4 h-4 text-brand-orange shrink-0 group-hover:scale-110 transition-transform" />
                  <span>(31) 99361-5488</span>
                </a>
              </li>
              <li>
                <a href="https://instagram.com/nucleodedanca" target="_blank" rel="noopener noreferrer" className="flex gap-3 hover:text-brand-orange transition-colors group">
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
          <a 
            href="https://wa.me/5531984211900?text=Quero%20fazer%20meu%20site"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 md:mt-0 text-brand-dark/40 hover:text-brand-orange transition-colors flex items-center gap-2 group"
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.035c0 2.123.554 4.197 1.608 6.022L0 24l6.117-1.605a11.847 11.847 0 005.932 1.577h.005c6.631 0 12.032-5.396 12.035-12.035.002-3.217-1.253-6.241-3.535-8.522z"/>
            </svg>
            <span>Desenvolvido por Farizo — (31) 98421-1900</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
