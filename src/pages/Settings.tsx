import React, { useState } from 'react';
import { Moon, Sun, Download, Upload, Trash2, Globe, DollarSign, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { exportBackup, importBackup } from '../services/storage';
import Modal from '../components/ui/Modal';

interface SettingsProps {
  addToast: (t: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ addToast }) => {
  const { settings, updateSettings, transactions, categories, goals, budgets, members } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    addToast({ type: 'success', title: 'Desconectado com sucesso!' });
  };

  const handleExportBackup = () => {
    const data = exportBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Backup exportado com sucesso!' });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const success = importBackup(json);
      if (success) {
        addToast({ type: 'success', title: 'Backup importado! Recarregando...' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addToast({ type: 'danger', title: 'Erro ao importar backup', message: 'Arquivo inválido ou corrompido.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearData = () => {
    localStorage.clear();
    setShowClearConfirm(false);
    addToast({ type: 'success', title: 'Dados removidos. Recarregando...' });
    setTimeout(() => window.location.reload(), 1500);
  };

  const stats = [
    { label: 'Transações', value: transactions.length },
    { label: 'Categorias', value: categories.length },
    { label: 'Membros', value: members.length },
    { label: 'Metas', value: goals.length },
    { label: 'Orçamentos', value: budgets.length },
  ];

  return (
    <div className="page-wrapper">
      <h1 style={{ marginBottom: 24 }}>Configurações</h1>

      {/* Appearance */}
      <Section title="🎨 Aparência">
        <SettingRow
          icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          label="Tema"
          description={`Tema ${theme === 'dark' ? 'escuro' : 'claro'} ativado`}
        >
          <button
            className={`btn ${theme === 'dark' ? 'btn-ghost' : 'btn-primary'} btn-sm`}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
          </button>
        </SettingRow>
      </Section>

      {/* Currency */}
      <Section title="💱 Moeda & Regionalização">
        <SettingRow
          icon={<DollarSign size={18} />}
          label="Moeda"
          description="Selecione a moeda para exibição"
        >
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={settings.currency}
            onChange={e => updateSettings({ currency: e.target.value })}
          >
            <option value="BRL">🇧🇷 Real (BRL)</option>
            <option value="USD">🇺🇸 Dólar (USD)</option>
            <option value="EUR">🇪🇺 Euro (EUR)</option>
            <option value="GBP">🇬🇧 Libra (GBP)</option>
          </select>
        </SettingRow>
      </Section>

      {/* Data */}
      <Section title="💾 Dados & Backup">
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          gap: 8,
          padding: '12px 0',
          marginBottom: 16,
        }}>
          {stats.map(s => (
            <div
              key={s.label}
              style={{
                background: 'var(--bg-input)',
                borderRadius: 10,
                padding: '10px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--blue)' }}>
                {s.value}
              </div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        <SettingRow
          icon={<Download size={18} />}
          label="Exportar Backup"
          description="Salve seus dados em arquivo JSON"
        >
          <button className="btn btn-ghost btn-sm" onClick={handleExportBackup}>
            <Download size={14} /> Exportar
          </button>
        </SettingRow>

        <SettingRow
          icon={<Upload size={18} />}
          label="Importar Backup"
          description="Restaure seus dados de um arquivo JSON"
        >
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> Importar
            <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
          </label>
        </SettingRow>

        <SettingRow
          icon={<Trash2 size={18} style={{ color: 'var(--red)' }} />}
          label="Limpar Dados"
          description="Remove TODOS os dados permanentemente"
        >
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--red)', borderColor: 'var(--border-red)' }}
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 size={14} /> Limpar Tudo
          </button>
        </SettingRow>
      </Section>

      {/* About */}
      <Section title="ℹ️ Sobre">
        <div style={{ padding: '8px 0', lineHeight: 2 }}>
          <div className="flex items-center gap-8">
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <div>
              <div style={{ fontWeight: 700 }}>FinançasFamília</div>
              <div className="text-muted text-sm">Gestão financeira pessoal e familiar</div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                Versão 1.0.0 · Dados armazenados localmente no seu dispositivo
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Account */}
      <Section title="👤 Conta">
        <SettingRow
          icon={<LogOut size={18} style={{ color: 'var(--red)' }} />}
          label="Sair / Logout"
          description="Desconectar da sua conta"
        >
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--red)', borderColor: 'var(--border-red)' }}
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={14} /> Sair
          </button>
        </SettingRow>
      </Section>

      {/* Clear confirm */}
      <Modal
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="⚠️ Limpar Todos os Dados"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowClearConfirm(false)}>Cancelar</button>
            <button className="btn btn-red" onClick={handleClearData}>Limpar Tudo</button>
          </>
        }
      >
        <p className="text-muted">
          Esta ação irá remover <strong>todos os dados</strong> do aplicativo permanentemente:
          transações, categorias, metas, orçamentos e configurações.
        </p>
        <p className="text-muted" style={{ marginTop: 8 }}>
          💡 Considere exportar um backup antes.
        </p>
      </Modal>

      {/* Logout confirm */}
      <Modal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="⚠️ Desconectar"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowLogoutConfirm(false)}>Cancelar</button>
            <button className="btn btn-red" onClick={handleLogout}>Desconectar</button>
          </>
        }
      >
        <p className="text-muted">
          Você tem certeza que deseja sair da sua conta? Seus dados permanecerão salvos no dispositivo.
        </p>
      </Modal>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card mb-16">
    <div style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {children}
    </div>
  </div>
);

const SettingRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon, label, description, children }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 0',
    borderBottom: '1px solid var(--border)',
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: 'var(--bg-input)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</div>
      <div className="text-xs text-muted">{description}</div>
    </div>
    {children}
  </div>
);

export default Settings;
