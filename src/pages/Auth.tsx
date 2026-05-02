import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Lock, LogIn, Mail, ShieldCheck, Smartphone, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (!isLogin && !displayName) {
      setError('Por favor, insira seu nome.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
      // No need to show success - the component will unmount when auth succeeds
    } catch (err: any) {
      const errorMessage = err.message || 'Ocorreu um erro ao autenticar';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <motion.aside
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="auth-hero card"
        >
          <div className="auth-brand">
            <img className="auth-brand-mark" src="/nexus-mark.svg" alt="Nexus Financeiro" />
            <div>
              <div className="auth-brand-name">Nexus Financeiro</div>
              <div className="auth-brand-sub">Gestão financeira da igreja e da família</div>
            </div>
          </div>

          <div className="auth-hero-copy">
            <span className="auth-kicker"><Sparkles size={14} /> Plataforma profissional</span>
            <h1>Um painel elegante para dízimos, ofertas e finanças da sua comunidade.</h1>
            <p>
              Entre em um ambiente claro, rápido e confiável para acompanhar lançamentos,
              relatórios e sincronização entre dispositivos com um visual premium.
            </p>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <div className="auth-feature-title"><ShieldCheck size={16} /> Segurança</div>
              <p>Login com sincronização protegida e dados centralizados na sua conta.</p>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-title"><Smartphone size={16} /> Mobile-first</div>
              <p>Layout confortável no celular, com leitura rápida e ações simples.</p>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-title"><BarChart3 size={16} /> Relatórios</div>
              <p>Visão clara de entradas, saídas e dízimos para decisão mais rápida.</p>
            </div>
          </div>

          <div className="auth-visual">
            <img src="/login-hero.svg" alt="Ilustração do painel Nexus Financeiro" />
            <motion.div className="auth-floating auth-floating-top" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div>
                <div className="auth-floating-label">Sincronização</div>
                <div className="auth-floating-value">Entre dispositivos</div>
              </div>
            </motion.div>
            <motion.div className="auth-floating auth-floating-bottom" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <div>
                <div className="auth-floating-label">Acesso rápido</div>
                <div className="auth-floating-value">Painel pronto em segundos</div>
              </div>
            </motion.div>
          </div>

          <div className="auth-mini-grid">
            <div className="auth-mini-card">
              <div className="label">Experiência</div>
              <div className="value">Minimalista e clara</div>
            </div>
            <div className="auth-mini-card">
              <div className="label">Uso</div>
              <div className="value">Igreja, família e equipe</div>
            </div>
            <div className="auth-mini-card">
              <div className="label">Acesso</div>
              <div className="value">Celular e computador</div>
            </div>
          </div>
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="auth-panel card"
        >
          <div className="auth-form-card card">
            <div className="auth-form-header">
              <div className="auth-form-note">
                <ArrowRight size={14} /> Acesse sua conta
              </div>
              <h2>{isLogin ? 'Entrar' : 'Criar conta'}</h2>
              <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                {isLogin
                  ? 'Retome seu painel e continue acompanhando as finanças da sua igreja.'
                  : 'Crie seu acesso para começar a registrar entradas, saídas e dízimos.'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--red)',
                  borderRadius: '14px',
                  fontSize: '0.875rem',
                  marginBottom: '18px',
                  textAlign: 'left',
                  border: '1px solid rgba(239, 68, 68, 0.16)',
                }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isLogin && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.875rem' }}>Nome</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)'
                    }}>
                      👤
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      placeholder="Seu nome completo"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.875rem' }}>E-mail</label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)'
                  }}>
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.875rem' }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)'
                  }}>
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '8px', width: '100%', justifyContent: 'center', height: '50px', opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Processando...
                  </>
                ) : (
                  isLogin ? <><LogIn size={18} /> Entrar</> : <><UserPlus size={18} /> Cadastrar</>
                )}
              </button>
            </form>

            <div className="auth-prompt">
              {isLogin ? 'Ainda não tem uma conta? Crie o acesso em poucos segundos.' : 'Já tem uma conta? Faça login e volte para o painel.'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  padding: 0,
                  marginLeft: 8,
                  opacity: loading ? 0.6 : 1,
                }}
                disabled={loading}
              >
                {isLogin ? 'Criar conta' : 'Entrar'}
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Auth;
