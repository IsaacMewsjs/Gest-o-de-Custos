import { Component, ErrorInfo, ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'

interface ErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application render error:', error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f5f5f7', color: '#1c1c1e', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: 620, padding: 28, borderRadius: 18, background: '#ffffff', boxShadow: '0 12px 36px rgba(0,0,0,0.12)' }}>
          <h1 style={{ marginTop: 0 }}>Não foi possível abrir o sistema</h1>
          <p>Ocorreu um erro ao carregar a aplicação. Recarregue a página e, se continuar, envie esta mensagem para o suporte:</p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#b42318', fontSize: 13 }}>{this.state.error.message}</pre>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 16px', border: 0, borderRadius: 10, background: '#1c1c1e', color: '#fff', cursor: 'pointer' }}>
            Recarregar página
          </button>
        </div>
      </div>
    );
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is best-effort; the app still works without the worker.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
