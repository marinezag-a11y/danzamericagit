import { 
  LayoutDashboard, 
  Settings, 
  Images, 
  ShoppingBag, 
  ImageIcon, 
  Ticket,
  Users, 
  User,
  Heart,
  Star,
  DollarSign,
  Zap
} from 'lucide-react';

export const ADMIN_MENU_ITEMS = [
  { id: 'profile', label: 'Meu Perfil', icon: User },
  { id: 'analytics', label: 'Estatísticas', icon: LayoutDashboard },
  { id: 'orders', label: 'Pedidos Recebidos', icon: ShoppingBag },
  { id: 'content', label: 'Conteúdo Geral', icon: Settings },
  { id: 'help', label: 'Compre um sonho', icon: Heart },
  { id: 'raffles', label: 'Ações entre Amigos', icon: Ticket },
  { id: 'gallery', label: 'Galeria de Fotos', icon: Images },
  { id: 'sponsorship', label: 'Apoiadores', icon: Star },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'dancers', label: 'Bailarinos', icon: Users },
  { id: 'banners', label: 'Banners Iniciais', icon: ImageIcon },
  { id: 'energy', label: 'Injeção de Energia', icon: Zap },
  { id: 'users', label: 'Administradores', icon: Settings },
];
