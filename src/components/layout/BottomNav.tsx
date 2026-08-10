import React from 'react';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart3, Users, Settings
} from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const mobileNav = [
  { id: 'dashboard',    label: 'Início',     icon: LayoutDashboard },
  { id: 'transactions', label: 'Movimentos', icon: ArrowLeftRight },
  { id: 'budget',       label: 'Orçamentos & Metas', icon: PiggyBank },
  { id: 'reports',      label: 'Relatórios', icon: BarChart3 },
  { id: 'family',       label: 'Família',    icon: Users },
  { id: 'settings',     label: 'Ajustes',    icon: Settings },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav className="bottom-nav">
      {mobileNav.map(item => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <Icon size={20} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
