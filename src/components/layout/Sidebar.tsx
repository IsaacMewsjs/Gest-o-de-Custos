import React from 'react';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, BarChart3,
  Users, Tag, Settings, Bell, Moon, Sun
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard',    label: 'Painel',       icon: LayoutDashboard },
  { id: 'transactions', label: 'Transações',   icon: ArrowLeftRight },
  { id: 'budget',       label: 'Orçamentos & Metas', icon: PiggyBank },
  { id: 'reports',      label: 'Relatórios',   icon: BarChart3 },
  { id: 'family',       label: 'Família',      icon: Users },
  { id: 'categories',   label: 'Categorias',   icon: Tag },
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { notifications } = useApp();
  const { theme, toggleTheme } = useTheme();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon" aria-hidden="true">
          <img src="/nexus-mark.svg" alt="" />
        </div>
        <div>
          <div className="logo-text">Nexus Financeiro</div>
          <div className="logo-sub">Gestão financeira da igreja</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu Principal</div>

        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}

        <div className="divider" style={{ margin: '10px 0' }} />
        <div className="nav-section-label">Sistema</div>

        <button
          className={`nav-item ${currentPage === 'notifications' ? 'active' : ''}`}
          onClick={() => onNavigate('notifications')}
          aria-label="Abrir alertas"
        >
          <Bell size={18} />
          Alertas
          {unread > 0 && <span className="nav-badge">{unread}</span>}
        </button>

        <button
          className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <Settings size={18} />
          Configurações
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="nav-item" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
