import React from 'react';
import { Bell, Moon, Sun, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  title: string;
  onAddTransaction?: () => void;
  onNavigate: (page: string) => void;
}

const pageTitles: Record<string, string> = {
  dashboard:    'Dashboard',
  transactions: 'Transações',
  budget:       'Orçamento',
  goals:        'Metas Financeiras',
  reports:      'Relatórios',
  family:       'Modo Família',
  categories:   'Categorias',
  notifications:'Notificações',
  settings:     'Configurações',
};

const Header: React.FC<HeaderProps> = ({ title, onAddTransaction, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useApp();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="top-header">
      <h1 className="header-title">{pageTitles[title] ?? title}</h1>

      <div className="header-actions">
        {onAddTransaction && (
          <button className="btn btn-green btn-sm" onClick={onAddTransaction}>
            <Plus size={15} />
            Nova
          </button>
        )}

        <button
          className="btn-icon"
          onClick={() => onNavigate('notifications')}
          title="Notificações"
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--red)',
              animation: 'pulse-dot 2s infinite',
            }} />
          )}
        </button>

        <button className="btn-icon" onClick={toggleTheme} title="Alternar tema">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
