import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
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
  const [page, setPage] = useState<Page>('dashboard');
  const [showGlobalForm, setShowGlobalForm] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

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
        <Header
          title={page}
          onNavigate={(p) => setPage(p as Page)}
          onAddTransaction={showAddButton ? () => setShowGlobalForm(true) : undefined}
        />

        {renderPage()}
      </div>

      <BottomNav currentPage={page} onNavigate={(p) => setPage(p as Page)} />

      {/* Global transaction form (triggered from header) */}
      <TransactionForm
        open={showGlobalForm}
        onClose={() => setShowGlobalForm(false)}
        onSuccess={(msg) => addToast({ type: 'success', title: msg })}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
