import React, { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import { ToastContainer, useToast } from './components/ui/Toast';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Reports from './pages/Reports';
import Family from './pages/Family';
import Categories from './pages/Categories';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import TransactionForm from './components/transactions/TransactionForm';
import Modal from './components/ui/Modal';
import { useApp } from './context/AppContext';
import { Sparkles, Plus } from 'lucide-react';

type Page =
  | 'dashboard'
  | 'transactions'
  | 'budget'
  | 'goals'
  | 'reports'
  | 'family'
  | 'categories'
  | 'notifications'
  | 'settings';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { settings, updateSettings } = useApp();
  const [page, setPage] = useState<Page>('dashboard');
  const [showGlobalForm, setShowGlobalForm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (!loading && isAuthenticated && !settings.onboardingCompleted && !dismissedOnboarding) {
      setShowOnboarding(true);
    }
  }, [loading, isAuthenticated, settings.onboardingCompleted, dismissedOnboarding]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const completeOnboarding = () => {
    updateSettings({ onboardingCompleted: true });
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
            <img src="/nexus-mark.svg" alt="Nexus Financeiro" style={{ width: 72, height: 72, marginBottom: 16, animation: 'float 2.8s ease-in-out infinite' }} />
            <div style={{ color: 'var(--text-secondary)' }}>Carregando...</div>
          </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':    return <Dashboard addToast={addToast} />;
      case 'transactions': return <Transactions addToast={addToast} />;
      case 'budget':
      case 'goals':        return <Budget addToast={addToast} />;
      case 'reports':      return <Reports />;
      case 'family':       return <Family addToast={addToast} />;
      case 'categories':   return <Categories addToast={addToast} />;
      case 'notifications':return <Notifications addToast={addToast} />;
      case 'settings':     return <Settings addToast={addToast} />;
      default:             return <Dashboard addToast={addToast} />;
    }
  };

  const showAddButton = ['dashboard', 'transactions'].includes(page);

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNavigate={(p) => setPage(p as Page)} />

      <div className="main-content">
        {!isOnline && (
          <div className="connection-banner offline">
            <strong>Modo offline ativo.</strong> Seus dados continuam salvos localmente e serão sincronizados quando a conexão voltar.
          </div>
        )}
        <Header
          title={page}
          onNavigate={(p) => setPage(p as Page)}
          onAddTransaction={showAddButton ? () => setShowGlobalForm(true) : undefined}
        />

        {renderPage()}
      </div>

      <BottomNav currentPage={page} onNavigate={(p) => setPage(p as Page)} />

      <button
        className="mobile-fab"
        onClick={() => setShowGlobalForm(true)}
        aria-label="Adicionar movimento"
      >
        <Plus size={22} />
      </button>

      {/* Global transaction form (triggered from header) */}
      <TransactionForm
        open={showGlobalForm}
        onClose={() => setShowGlobalForm(false)}
        onSuccess={(msg) => addToast({ type: 'success', title: msg })}
      />

      <Modal
        open={showOnboarding}
        onClose={() => { setShowOnboarding(false); setDismissedOnboarding(true); }}
        title="Bem-vindo ao Nexus Financeiro"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowOnboarding(false); setDismissedOnboarding(true); }}>Depois</button>
            <button className="btn btn-primary" onClick={completeOnboarding}>
              <Sparkles size={14} /> Começar
            </button>
          </>
        }
      >
        <div className="empty-state" style={{ padding: '8px 0 0' }}>
          <div className="empty-icon">✨</div>
          <div className="empty-title">Organize suas finanças com um painel minimalista</div>
          <div className="empty-desc">Escolha o que aparece no painel, crie seus primeiros movimentos e acompanhe tudo em português.</div>
        </div>
        <div className="onboarding-list">
          <div>1. Escolha o modo Início simples para começar com menos ruído visual.</div>
          <div>2. Registre dízimos, ofertas e despesas com o botão de adicionar.</div>
          <div>3. Acompanhe aprovações, alertas e exportações no mesmo lugar.</div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
