import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../pages/Home';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock de todos os hooks para isolar o teste de fumaça
vi.mock('../hooks/useSiteSettings', () => ({ useSiteSettings: () => ({ settings: {}, loading: false }) }));
vi.mock('../hooks/useGallery', () => ({ useGallery: () => ({ images: [], loading: false }) }));
vi.mock('../hooks/useSponsorship', () => ({ useSponsorship: () => ({ tiers: [], loading: false }) }));
vi.mock('../hooks/useHeroBanners', () => ({ useHeroBanners: () => ({ banners: [], loading: false }) }));
vi.mock('../hooks/useTicker', () => ({ useTicker: () => ({ phrases: [], loading: false }) }));
vi.mock('../hooks/useJourney', () => ({ useJourney: () => ({ items: [], loading: false }) }));
vi.mock('../hooks/useFundraising', () => ({ useFundraising: () => ({ expenses: [], loading: false }) }));
vi.mock('../hooks/usePageTracking', () => ({ usePageTracking: () => {} }));
vi.mock('../hooks/useEventTracking', () => ({ useEventTracking: () => ({ trackEvent: vi.fn() }) }));

// Mock abrangente do framer-motion com Proxy para cobrir qualquer motion.* element
vi.mock('framer-motion', () => {
  // Cria um componente genérico que remove props exclusivas do framer-motion
  const createComponent = (tag: string) => {
    const Component = ({ children, whileHover, whileTap, whileInView, initial, animate, exit, transition, variants, ...props }: any) =>
      React.createElement(tag, props, children);
    Component.displayName = `motion.${tag}`;
    return Component;
  };

  const motion = new Proxy({}, {
    get: (_: any, tag: string) => createComponent(tag),
  });

  return {
    motion,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn(), set: vi.fn() }),
    useInView: () => true,
  };
});

describe('Home Page Smoke Test', () => {
  it('deve renderizar os botões de doação principais', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Verifica se pelo menos um botão de doação está presente
    const donationButtons = screen.getAllByText(/Apoie Agora|Doar Agora/i);
    expect(donationButtons.length).toBeGreaterThan(0);
  });

  it('deve abrir o modal de contato ao clicar em Contatos', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Encontra e clica no botão "Contatos" do desktop
    const contactButtons = screen.getAllByText(/Contatos/i);
    expect(contactButtons.length).toBeGreaterThan(0);
    
    // Clica no primeiro botão Contatos
    contactButtons[0].click();

    // Verifica se o conteúdo do modal de contato aparece
    const modalTitle = await screen.findByText(/Fale Conosco/i);
    expect(modalTitle).toBeTruthy();
  });
});

