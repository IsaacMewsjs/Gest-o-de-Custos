import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, CheckCheck, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/calculations';

interface NotificationsProps {
  addToast: (t: any) => void;
}

const iconByType: Record<string, string> = {
  success: '✅',
  warning: '⚠️',
  danger:  '🔴',
  info:    'ℹ️',
};

const Notifications: React.FC<NotificationsProps> = ({ addToast }) => {
  const { notifications, markNotificationRead, clearNotifications, transactions, approveTransaction, canApproveTransactions } = useApp();
  const unread = notifications.filter(n => !n.read).length;
  const pendingTransactions = transactions.filter(tx => tx.status === 'pending');

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 style={{ marginBottom: 4 }}>Notificações</h1>
          <p className="text-muted text-sm">{unread} não lida(s)</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-8">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                notifications.forEach(n => markNotificationRead(n.id));
                addToast({ type: 'success', title: 'Todas marcadas como lidas' });
              }}
            >
              <CheckCheck size={14} /> Ler todas
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--red)' }}
              onClick={() => {
                clearNotifications();
                addToast({ type: 'success', title: 'Notificações limpas' });
              }}
            >
              <Trash2 size={14} /> Limpar
            </button>
          </div>
        )}
      </div>

      {pendingTransactions.length > 0 && (
        <div className="card mb-16 pending-card">
          <div className="flex items-center gap-8 mb-12">
            <ShieldAlert size={16} style={{ color: 'var(--gold)' }} />
            <div className="section-title">Aprovações pendentes</div>
          </div>
          <div className="flex flex-col gap-8">
            {pendingTransactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="audit-item">
                <div>
                  <div className="audit-title">{tx.description}</div>
                  <div className="audit-message">{formatDate(tx.date, 'dd/MM/yyyy')} · {tx.amount.toFixed(2)}</div>
                </div>
                {canApproveTransactions && (
                  <button className="btn btn-ghost btn-sm" onClick={() => approveTransaction(tx.id)}>
                    <Check size={14} /> Aprovar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><Bell size={32} /></div>
            <div className="empty-title">Tudo em dia!</div>
            <div className="empty-desc">Nenhuma notificação por enquanto</div>
          </div>
        </div>
      ) : (
        <div className="card">
          <AnimatePresence>
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: n.read ? 'transparent' : 'var(--blue-dim)',
                  border: '1px solid',
                  borderColor: n.read ? 'transparent' : 'rgba(78,140,255,0.15)',
                  marginBottom: i < notifications.length - 1 ? 8 : 0,
                  transition: 'all 0.2s',
                  cursor: n.read ? 'default' : 'pointer',
                }}
                onClick={() => !n.read && markNotificationRead(n.id)}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: n.type === 'success' ? 'var(--green-dim)'
                    : n.type === 'warning' ? 'var(--gold-dim)'
                    : n.type === 'danger' ? 'var(--red-dim)'
                    : 'var(--blue-dim)',
                  fontSize: '1.1rem',
                }}>
                  {iconByType[n.type]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: n.read ? 500 : 700,
                    fontSize: '0.875rem',
                    marginBottom: 3,
                    color: 'var(--text-primary)',
                  }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {n.message}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                    {formatDate(n.createdAt, 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--blue)',
                      marginTop: 6,
                      flexShrink: 0,
                    }} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notifications;
