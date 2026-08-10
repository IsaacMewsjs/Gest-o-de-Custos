import React from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  title: string;
  onNavigate: (page: string) => void;
}

const pageTitles: Record<string, string> = {
  dashboard:    'Painel',
  transactions: 'Transações',
  budget:       'Orçamentos & Metas',
  reports:      'Relatórios',
  family:       'Modo Família',
  categories:   'Categorias',
  notifications:'Alertas',
  settings:     'Ajustes',
};

const Header: React.FC<HeaderProps> = ({ title, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, syncStatus, lastSyncedAt } = useApp();
  const unread = notifications.filter(n => !n.read).length;
  const syncLabel = syncStatus === 'local'
    ? 'Somente local'
    : syncStatus === 'syncing'
      ? 'Sincronizando'
      : syncStatus === 'error'
        ? 'Erro ao sincronizar'
        : 'Sincronizado';

  return (
    <header className="top-header">
      <h1 className="header-title">{pageTitles[title] ?? title}</h1>

      <div className="header-actions">
        <span className={`sync-badge ${syncStatus}`} title={lastSyncedAt ? `Última sincronização ${new Date(lastSyncedAt).toLocaleString('pt-BR')}` : syncLabel}>
          <span className="sync-dot" />
          {syncLabel}
        </span>

        <button
          className="btn-icon"
          onClick={() => onNavigate('notifications')}
          title="Notificações"
          aria-label="Abrir notificações"
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

        <button className="btn-icon" onClick={toggleTheme} title="Alternar tema" aria-label="Alternar tema">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
