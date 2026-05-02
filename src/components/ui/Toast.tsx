import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const icons = {
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  danger:  <AlertCircle size={16} />,
  info:    <Info size={16} />,
};

const colors = {
  success: 'var(--green)',
  warning: 'var(--gold)',
  danger:  'var(--red)',
  info:    'var(--blue)',
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({
  toast, onRemove,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      className={`toast ${toast.type}`}
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="toast-icon" style={{ color: colors[toast.type] }}>
        {icons[toast.type]}
      </div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button
        className="btn-icon"
        style={{ padding: 4 }}
        onClick={() => onRemove(toast.id)}
        aria-label="Fechar notificação"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook to use toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};
