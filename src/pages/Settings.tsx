import React, { useState } from 'react';
import { Moon, Sun, Download, Upload, Trash2, Globe, DollarSign, LogOut, ChevronUp, ChevronDown, Eye, EyeOff, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { exportBackup, importBackup } from '../services/storage';
import { exportCSV, exportPDF, exportAuditCSV } from '../services/export';
import { DEFAULT_DASHBOARD_WIDGETS } from '../constants';
import type { DashboardWidgetId, DashboardWidgetPreference, DashboardPresetId } from '../types';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils/calculations';

interface SettingsProps {
  addToast: (t: any) => void;
}

const DASHBOARD_WIDGET_META: Record<DashboardWidgetId, { title: string; description: string }> = {
  health: { title: 'Saúde Financeira', description: 'Mostra o estado geral das finanças do mês.' },
  stats: { title: 'Resumo do Mês', description: 'Exibe saldo, entradas, saídas e economia.' },
  insights: { title: 'Insights', description: 'Mostra tendência, categoria principal e média por gasto.' },
  tithe: { title: 'Dízimos e Ofertas', description: 'Mostra o total entregue à igreja no mês.' },
  charts: { title: 'Gráficos', description: 'Mostra distribuição por categoria e comparação mensal.' },
  recent: { title: 'Últimas Transações', description: 'Lista os lançamentos mais recentes.' },
  tips: { title: 'Dicas Financeiras', description: 'Exibe sugestões baseadas no seu uso.' },
  budgets: { title: 'Orçamentos do Mês', description: 'Resume os limites e gastos por categoria.' },
};

const DASHBOARD_PRESETS: Record<string, DashboardWidgetPreference[]> = {
  inicio: [
    { id: 'health', visible: true },
    { id: 'stats', visible: true },
    { id: 'tithe', visible: true },
    { id: 'recent', visible: true },
    { id: 'insights', visible: false },
    { id: 'charts', visible: false },
    { id: 'tips', visible: false },
    { id: 'budgets', visible: false },
  ],
  essencial: [
    { id: 'health', visible: true },
    { id: 'stats', visible: true },
    { id: 'recent', visible: true },
    { id: 'budgets', visible: true },
    { id: 'insights', visible: false },
    { id: 'charts', visible: false },
    { id: 'tips', visible: false },
  ],
  analise: [
    { id: 'health', visible: true },
    { id: 'stats', visible: true },
    { id: 'insights', visible: true },
    { id: 'charts', visible: true },
    { id: 'recent', visible: true },
    { id: 'tips', visible: false },
    { id: 'budgets', visible: true },
  ],
  planejamento: [
    { id: 'health', visible: true },
    { id: 'stats', visible: true },
    { id: 'insights', visible: true },
    { id: 'budgets', visible: true },
    { id: 'recent', visible: true },
    { id: 'tips', visible: true },
    { id: 'charts', visible: false },
  ],
};

const Settings: React.FC<SettingsProps> = ({ addToast }) => {
  const { settings, updateSettings, transactions, categories, goals, budgets, members, notifications, auditLogs, activeMember, canManageMembers, applySnapshot } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isAdmin = activeMember?.role === 'admin';

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    addToast({ type: 'success', title: 'Desconectado com sucesso!' });
  };

  const handleExportBackup = () => {
    const data = exportBackup({
      transactions,
      categories,
      budgets,
      goals,
      members,
      settings,
      notifications,
      auditLogs,
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Backup exportado com sucesso!' });
  };

  const handleExportCSV = () => {
    exportCSV(transactions, categories, members);
    addToast({ type: 'success', title: 'CSV exportado com sucesso!' });
  };

  const handleExportAudit = () => {
    exportAuditCSV(auditLogs);
    addToast({ type: 'success', title: 'Auditoria exportada com sucesso!' });
  };

  const handleExportPDF = () => {
    exportPDF(transactions, categories, members, 'Nexus Financeiro — Relatório Completo', auditLogs);
    addToast({ type: 'success', title: 'PDF exportado com sucesso!' });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const data = importBackup(json);
      if (data) {
        applySnapshot(data);
        addToast({ type: 'success', title: 'Backup importado! Sincronizando dados...' });
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

  const dashboardWidgets = settings.dashboardWidgets?.length > 0
    ? settings.dashboardWidgets
    : DEFAULT_DASHBOARD_WIDGETS;

  const saveDashboardWidgets = (nextWidgets: typeof dashboardWidgets) => {
    updateSettings({ dashboardWidgets: nextWidgets });
  };

  const applyPreset = (preset: keyof typeof DASHBOARD_PRESETS) => {
    saveDashboardWidgets(DASHBOARD_PRESETS[preset]);
    updateSettings({ homeDashboardPreset: preset as DashboardPresetId });
    addToast({ type: 'success', title: `Preset "${preset === 'inicio' ? 'Início simples' : preset === 'essencial' ? 'Essencial' : preset === 'analise' ? 'Análise' : 'Planejamento'}" aplicado` });
  };

  const toggleDashboardWidget = (id: DashboardWidgetId) => {
    saveDashboardWidgets(dashboardWidgets.map(widget => (
      widget.id === id ? { ...widget, visible: !widget.visible } : widget
    )));
  };

  const moveDashboardWidget = (id: DashboardWidgetId, direction: -1 | 1) => {
    const currentIndex = dashboardWidgets.findIndex(widget => widget.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= dashboardWidgets.length) return;

    const nextWidgets = [...dashboardWidgets];
    [nextWidgets[currentIndex], nextWidgets[nextIndex]] = [nextWidgets[nextIndex], nextWidgets[currentIndex]];
    saveDashboardWidgets(nextWidgets);
  };

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

      {/* Dashboard */}
      <Section title="📊 Dashboard Personalizado">
        <div className="text-xs text-muted" style={{ marginBottom: 12 }}>
          Escolha o que aparece no painel e ajuste a ordem dos blocos.
        </div>
        <div className="preset-row">
          <button className="btn btn-primary btn-sm" onClick={() => applyPreset('inicio')}>Início simples</button>
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('essencial')}>Essencial</button>
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('analise')}>Análise</button>
          <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('planejamento')}>Planejamento</button>
        </div>
        <div className="dashboard-customizer">
          {dashboardWidgets.map((widget, index) => (
            <div key={widget.id} className={`dashboard-widget-row ${widget.visible ? '' : 'is-hidden'}`}>
              <div className="dashboard-widget-main">
                <div className="dashboard-widget-title">
                  {index + 1}. {DASHBOARD_WIDGET_META[widget.id].title}
                </div>
                <div className="text-xs text-muted">
                  {DASHBOARD_WIDGET_META[widget.id].description}
                </div>
              </div>
              <div className="dashboard-widget-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => toggleDashboardWidget(widget.id)}>
                  {widget.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  {widget.visible ? 'Visível' : 'Oculto'}
                </button>
                <button
                  className="btn-icon"
                  onClick={() => moveDashboardWidget(widget.id, -1)}
                  disabled={index === 0}
                  title="Mover para cima"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => moveDashboardWidget(widget.id, 1)}
                  disabled={index === dashboardWidgets.length - 1}
                  title="Mover para baixo"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Approvals & Audit */}
      <Section title="🔐 Aprovação & Auditoria">
        <div className="text-xs text-muted" style={{ marginBottom: 12 }}>
          {isAdmin ? 'Administre aprovações pendentes e acompanhe o histórico de ações.' : 'Seu perfil é de leitura; aprovações e alterações administrativas ficam restritas ao admin.'}
        </div>
        <div className="settings-stats-grid" style={{ marginBottom: 12 }}>
          <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)' }}>
              {transactions.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-xs text-muted">Pendentes</div>
          </div>
          <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--blue)' }}>
              {auditLogs.length}
            </div>
            <div className="text-xs text-muted">Eventos registrados</div>
          </div>
        </div>
        <div className="card">
          <div className="flex flex-col gap-8">
            {auditLogs.slice(0, 8).map(log => (
              <div key={log.id} className="audit-item">
                <div>
                  <div className="audit-title">{log.title}</div>
                  <div className="audit-message">{log.message}</div>
                </div>
                <div className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDate(log.createdAt, 'dd/MM HH:mm')}</div>
              </div>
            ))}
          </div>
        </div>
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
        <div className="settings-stats-grid">
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
          icon={<FileText size={18} />}
          label="Exportar CSV"
          description="Baixe todas as transações em formato de planilha"
        >
          <button className="btn btn-ghost btn-sm" onClick={handleExportCSV}>
            <FileText size={14} /> CSV
          </button>
        </SettingRow>

        <SettingRow
          icon={<FileText size={18} />}
          label="Exportar PDF"
          description="Gere um relatório elegante para compartilhar"
        >
          <button className="btn btn-primary btn-sm" onClick={handleExportPDF}>
            <FileText size={14} /> PDF
          </button>
        </SettingRow>

        <SettingRow
          icon={<Upload size={18} />}
          label="Importar Backup"
          description="Restaure seus dados de um arquivo JSON"
        >
          <label
            className="btn btn-ghost btn-sm"
            style={{ cursor: isAdmin ? 'pointer' : 'not-allowed', opacity: isAdmin ? 1 : 0.55 }}
            onClick={e => { if (!isAdmin) e.preventDefault(); }}
          >
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
            disabled={!isAdmin}
          >
            <Trash2 size={14} /> Limpar Tudo
          </button>
        </SettingRow>

        <SettingRow
          icon={<FileText size={18} />}
          label="Auditoria CSV"
          description="Exporte o histórico de ações e aprovações"
        >
          <button className="btn btn-ghost btn-sm" onClick={handleExportAudit}>
            <FileText size={14} /> Auditoria
          </button>
        </SettingRow>
      </Section>

      {/* About */}
      <Section title="ℹ️ Sobre">
        <div style={{ padding: '8px 0', lineHeight: 2 }}>
          <div className="flex items-center gap-8">
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <div>
              <div style={{ fontWeight: 700 }}>Nexus Financeiro</div>
              <div className="text-muted text-sm">Gestão financeira da igreja e da família</div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                Versão 1.0.0 · Dados sincronizam com sua conta quando você está logado
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
  <div className="setting-row">
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
