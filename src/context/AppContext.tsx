import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  Transaction, Category, Budget, Goal,
  FamilyMember, Notification, AppSettings, AuditLog, DashboardWidgetPreference
} from '../types';
import { useAuth } from './AuthContext';
import { relationalDataService } from '../services/database';
import { generateId, calcMonthSummary, formatCurrency } from '../utils/calculations';
import { DEFAULT_CATEGORIES, DEFAULT_MEMBER, DEFAULT_DASHBOARD_WIDGETS } from '../constants';

interface AppContextType {
  // Data
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  members: FamilyMember[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  activeMember: FamilyMember;
  canManageTransactions: boolean;
  canManageMembers: boolean;
  canApproveTransactions: boolean;

  // Transactions
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  approveTransaction: (id: string) => void;

  // Categories
  addCategory: (c: Omit<Category, 'id' | 'isDefault'>) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Budgets
  setBudget: (b: Omit<Budget, 'id'>) => void;
  deleteBudget: (id: string) => void;

  // Goals
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, g: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // Members
  addMember: (m: Omit<FamilyMember, 'id' | 'createdAt'>) => void;
  updateMember: (id: string, m: Partial<FamilyMember>) => void;
  deleteMember: (id: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;

  // Settings
  updateSettings: (s: Partial<AppSettings>) => void;

  // Sync
  applySnapshot: (snapshot: Partial<CloudSnapshot>) => void;
  clearAllData: () => Promise<void>;
  dataReady: boolean;
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
  syncError: string | null;
  lastSyncedAt: string | null;
}

const AppContext = createContext<AppContextType | null>(null);

const normalizeDashboardWidgets = (widgets?: DashboardWidgetPreference[]): DashboardWidgetPreference[] => {
  const byId = new Map((widgets ?? []).map(widget => [widget.id, widget]));
  return DEFAULT_DASHBOARD_WIDGETS.map(widget => ({
    id: widget.id,
    visible: byId.get(widget.id)?.visible ?? widget.visible,
  }));
};

const defaultSettings: AppSettings = {
  currency: 'BRL',
  locale: 'pt-BR',
  theme: 'light',
  activeMemberId: DEFAULT_MEMBER.id,
  dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
  homeDashboardPreset: 'inicio',
  onboardingCompleted: false,
};

const normalizeSettings = (stored?: Partial<AppSettings> | null): AppSettings => ({
  ...defaultSettings,
  ...stored,
  dashboardWidgets: normalizeDashboardWidgets(stored?.dashboardWidgets),
});

type CloudSnapshot = {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  members: FamilyMember[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  updatedAt: string;
};

const formatSyncError = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const details = error as { message?: string; code?: string; details?: string; hint?: string };
    return [details.code, details.message, details.details, details.hint]
      .filter(Boolean)
      .join(' | ') || fallback;
  }
  return fallback;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userId, loading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([DEFAULT_MEMBER]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [syncReady, setSyncReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const hydratedRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const activeMember = members.find(member => member.id === settings.activeMemberId) ?? members[0];
  const canManageTransactions = activeMember?.role === 'admin';
  const canManageMembers = activeMember?.role === 'admin';
  const canApproveTransactions = activeMember?.role === 'admin';

  const getNextRecurringDate = useCallback((date: Date, recurrence: Transaction['recurrence']): Date => {
    const next = new Date(date);
    switch (recurrence) {
      case 'daily': next.setDate(next.getDate() + 1); break;
      case 'weekly': next.setDate(next.getDate() + 7); break;
      case 'monthly': next.setMonth(next.getMonth() + 1); break;
      case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
      default: break;
    }
    return next;
  }, []);

  const buildRecurringInstances = useCallback((list: Transaction[]) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const generated: Transaction[] = [];
    const obsoleteIds: string[] = [];

    list
      .filter(t => t.recurrence !== 'none' && !t.parentTransactionId && !t.isRecurringGenerated)
      .forEach(source => {
        const instances = list
          .filter(transaction => transaction.parentTransactionId === source.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const futureInstances = instances.filter(instance => new Date(instance.date) > now);

        obsoleteIds.push(...futureInstances.slice(1).map(instance => instance.id));
        if (futureInstances.length > 0) return;

        const latestDate = instances.length > 0
          ? new Date(instances[instances.length - 1].date)
          : new Date(source.date);
        let cursor = getNextRecurringDate(latestDate, source.recurrence);
        while (cursor <= now) {
          cursor = getNextRecurringDate(cursor, source.recurrence);
        }

        generated.push({
          ...source,
          id: generateId(),
          date: cursor.toISOString(),
          createdAt: nowIso,
          updatedAt: nowIso,
          parentTransactionId: source.id,
          isRecurringGenerated: true,
        });
      });

    return { generated, obsoleteIds };
  }, [getNextRecurringDate]);

  const applySnapshot = useCallback((snapshot: Partial<CloudSnapshot>) => {
    if (snapshot.transactions) setTransactions(snapshot.transactions);
    if (snapshot.categories) setCategories(snapshot.categories);
    if (snapshot.budgets) setBudgets(snapshot.budgets);
    if (snapshot.goals) setGoals(snapshot.goals);
    if (snapshot.members) setMembers(snapshot.members);
    if (snapshot.notifications) setNotifications(snapshot.notifications);
    if (snapshot.auditLogs) setAuditLogs(snapshot.auditLogs);
    if (snapshot.settings) setSettings(prev => normalizeSettings({ ...prev, ...snapshot.settings }));
  }, []);

  const buildSnapshot = useCallback((): CloudSnapshot => ({
    transactions,
    categories,
    budgets,
    goals,
    members,
    notifications,
    auditLogs,
    settings,
    updatedAt: new Date().toISOString(),
  }), [transactions, categories, budgets, goals, members, notifications, auditLogs, settings]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !userId) {
      hydratedRef.current = false;
      setSyncReady(false);
      setDataReady(false);
      setSyncStatus('local');
      return;
    }

    let cancelled = false;
    hydratedRef.current = false;
    setSyncReady(false);
    setDataReady(false);
    setSyncStatus('syncing');
    setSyncError(null);

    const hydrateFromCloud = async () => {
      try {
        const remoteData = await relationalDataService.loadAll(userId);
        if (cancelled) return;
        applySnapshot({
          ...remoteData,
          categories: remoteData.categories.length > 0 ? remoteData.categories : DEFAULT_CATEGORIES,
          members: remoteData.members.length > 0 ? remoteData.members : [DEFAULT_MEMBER],
          settings: remoteData.settings ?? undefined,
          updatedAt: new Date().toISOString(),
        });
        hydratedRef.current = true;
        setSyncReady(true);
        setDataReady(true);
      } catch (error) {
        console.error('Cloud sync load error:', error);
        if (!cancelled) {
          setSyncError(formatSyncError(error, 'Erro desconhecido ao carregar o banco de dados.'));
          setSyncStatus('error');
        }
      }
    };

    hydrateFromCloud();

    return () => {
      cancelled = true;
      hydratedRef.current = false;
      setSyncReady(false);
      setDataReady(false);
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [loading, isAuthenticated, userId, applySnapshot]);

  useEffect(() => {
    if (!syncReady || !hydratedRef.current || !isAuthenticated || !userId) return;

    setSyncStatus('syncing');
    if (syncTimerRef.current !== null) window.clearTimeout(syncTimerRef.current);

    syncTimerRef.current = window.setTimeout(async () => {
      try {
        const snapshot = buildSnapshot();
        const saveOperation = saveQueueRef.current
          .catch(() => undefined)
          .then(() => relationalDataService.saveAll(userId, snapshot));
        saveQueueRef.current = saveOperation;
        await saveOperation;
        setLastSyncedAt(snapshot.updatedAt);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Cloud sync save error:', error);
        setSyncError(formatSyncError(error, 'Erro desconhecido ao salvar no banco de dados.'));
        setSyncStatus('error');
      }
    }, 500);

    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [transactions, categories, budgets, members, notifications, auditLogs, settings, syncReady, isAuthenticated, userId, buildSnapshot]);

  useEffect(() => {
    if (!syncReady) return;
    const { generated, obsoleteIds } = buildRecurringInstances(transactions);
    if (generated.length > 0 || obsoleteIds.length > 0) {
      setTransactions(prev => [
        ...generated,
        ...prev.filter(transaction => !obsoleteIds.includes(transaction.id)),
      ]);
    }
  }, [transactions, syncReady, buildRecurringInstances]);

  useEffect(() => {
    if (!syncReady) return;
    const titheCategory = categories.find(category => category.id === 'cat-dizimos-ofertas');
    if (!titheCategory) return;

    const now = new Date();
    if (now.getDate() > 10) return;

    const thisMonthHasTithe = transactions.some(transaction => {
      const date = new Date(transaction.date);
      return transaction.type === 'expense'
        && transaction.categoryId === titheCategory.id
        && date.getMonth() === now.getMonth()
        && date.getFullYear() === now.getFullYear();
    });

    if (!thisMonthHasTithe) {
      addNotification({
        type: 'warning',
        title: 'Dízimo pendente',
        message: 'Ainda não há lançamento de dízimo neste mês. Registre o valor para manter o controle em dia.',
      });
    }
  }, [transactions, categories, syncReady, activeMember]);

  // Budget alerts
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const summary = calcMonthSummary(transactions, month, year);

    budgets
      .filter(b => b.month === month && b.year === year)
      .forEach(budget => {
        const spent = summary.byCategory[budget.categoryId] || 0;
        const ratio = spent / budget.amount;
        const cat = categories.find(c => c.id === budget.categoryId);

        if (ratio >= 1.0) {
          addNotification({
            type: 'danger',
            title: `Orçamento Excedido!`,
            message: `Você ultrapassou o limite de ${cat?.name ?? 'categoria'} este mês.`,
          });
        } else if (ratio >= 0.8) {
          addNotification({
            type: 'warning',
            title: `Orçamento Quase no Limite`,
            message: `Você usou ${Math.round(ratio * 100)}% do orçamento de ${cat?.name ?? 'categoria'}.`,
          });
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, budgets]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications(prev => {
      // Deduplicate by title+type within the same day
      const today = new Date().toDateString();
      const exists = prev.some(p =>
        p.title === n.title && new Date(p.createdAt).toDateString() === today
      );
      if (exists) return prev;
      const newN: Notification = {
        ...n,
        id: generateId(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      return [newN, ...prev].slice(0, 50);
    });
  }, []);

  const appendAuditLog = useCallback((entry: Omit<AuditLog, 'id' | 'createdAt'>) => {
    setAuditLogs(prev => [
      {
        ...entry,
        id: generateId(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 200));
  }, []);

  // Transactions
  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const status: 'approved' | 'pending' = activeMember?.role === 'admin' ? 'approved' : 'pending';
    const created = {
      ...t,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      status,
      approvalRequestedAt: status === 'pending' ? now : undefined,
      approvedAt: status === 'approved' ? now : undefined,
      approvedBy: status === 'approved' ? activeMember?.id : undefined,
    };

    setTransactions(prev => [created, ...prev]);
    appendAuditLog({
      action: 'create',
      entityType: 'transaction',
      entityId: created.id,
      title: status === 'pending' ? 'Lançamento aguardando aprovação' : 'Lançamento criado',
      message: `${created.description} de ${formatCurrency(created.amount)} foi registrada.`,
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });

    if (status === 'pending') {
      addNotification({
        type: 'warning',
        title: 'Lançamento pendente',
        message: `${created.description} foi enviada para aprovação do administrador.`,
      });
    }
  }, [activeMember, appendAuditLog]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    if (!canManageTransactions) {
      addNotification({
        type: 'warning',
        title: 'Acesso restrito',
        message: 'Somente administradores podem editar transações.',
      });
      return;
    }
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    );
    appendAuditLog({
      action: 'update',
      entityType: 'transaction',
      entityId: id,
      title: 'Transação atualizada',
      message: 'Uma transação foi editada manualmente.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, addNotification, appendAuditLog, canManageTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    if (!canManageTransactions) {
      addNotification({
        type: 'warning',
        title: 'Acesso restrito',
        message: 'Somente administradores podem excluir transações.',
      });
      return;
    }
    setTransactions(prev => prev.filter(t => t.id !== id && t.parentTransactionId !== id));
    appendAuditLog({
      action: 'delete',
      entityType: 'transaction',
      entityId: id,
      title: 'Transação excluída',
      message: 'Uma transação foi removida do sistema.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, addNotification, appendAuditLog, canManageTransactions]);

  const approveTransaction = useCallback((id: string) => {
    if (!canApproveTransactions) {
      addNotification({
        type: 'warning',
        title: 'Aprovação indisponível',
        message: 'Somente administradores podem aprovar transações pendentes.',
      });
      return;
    }

    const approvedAt = new Date().toISOString();
    const target = transactions.find(transaction => transaction.id === id);
    setTransactions(prev => prev.map(transaction => (
      transaction.id === id
        ? { ...transaction, status: 'approved', approvedAt, approvedBy: activeMember?.id, updatedAt: approvedAt }
        : transaction
    )));

    if (target) {
      appendAuditLog({
        action: 'approve',
        entityType: 'transaction',
        entityId: id,
        title: 'Transação aprovada',
        message: `${target.description} foi aprovada pelo administrador.`,
        actorId: activeMember?.id ?? 'member-default',
        actorName: activeMember?.name ?? 'Usuário',
        actorRole: activeMember?.role ?? 'member',
      });
      addNotification({
        type: 'success',
        title: 'Transação aprovada',
        message: `${target.description} foi liberada para o fluxo financeiro.`,
      });
    }
  }, [activeMember, addNotification, appendAuditLog, canApproveTransactions, transactions]);

  // Categories
  const addCategory = useCallback((c: Omit<Category, 'id' | 'isDefault'>) => {
    if (!canManageMembers) return;
    setCategories(prev => [...prev, { ...c, id: generateId(), isDefault: false }]);
    appendAuditLog({
      action: 'create',
      entityType: 'category',
      title: 'Categoria criada',
      message: `Nova categoria adicionada: ${c.name}.`,
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    if (!canManageMembers) return;
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    appendAuditLog({
      action: 'update',
      entityType: 'category',
      entityId: id,
      title: 'Categoria atualizada',
      message: 'Uma categoria foi ajustada nas configurações.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  const deleteCategory = useCallback((id: string) => {
    if (!canManageMembers) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    appendAuditLog({
      action: 'delete',
      entityType: 'category',
      entityId: id,
      title: 'Categoria removida',
      message: 'Uma categoria foi removida do cadastro.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  // Budgets
  const setBudget = useCallback((b: Omit<Budget, 'id'>) => {
    if (!canManageMembers) return;
    setBudgets(prev => {
      const existing = prev.find(
        x => x.categoryId === b.categoryId && x.month === b.month && x.year === b.year
      );
      if (existing) {
        return prev.map(x => x.id === existing.id ? { ...x, amount: b.amount } : x);
      }
      return [...prev, { ...b, id: generateId() }];
    });
    appendAuditLog({
      action: 'update',
      entityType: 'budget',
      title: 'Orçamento ajustado',
      message: 'Um orçamento mensal foi criado ou atualizado.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  const deleteBudget = useCallback((id: string) => {
    if (!canManageMembers) return;
    setBudgets(prev => prev.filter(b => b.id !== id));
    appendAuditLog({
      action: 'delete',
      entityType: 'budget',
      entityId: id,
      title: 'Orçamento removido',
      message: 'Um orçamento foi removido do cadastro.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  // Goals
  const addGoal = useCallback((g: Omit<Goal, 'id' | 'createdAt'>) => {
    if (!canManageMembers) return;
    setGoals(prev => [...prev, { ...g, id: generateId(), createdAt: new Date().toISOString() }]);
    appendAuditLog({
      action: 'create',
      entityType: 'goal',
      title: 'Meta criada',
      message: `Meta adicionada: ${g.name}.`,
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    if (!canManageMembers) return;
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const updated = { ...g, ...updates };
      if (updated.currentAmount >= updated.targetAmount && !updated.completedAt) {
        updated.completedAt = new Date().toISOString();
        addNotification({
          type: 'success',
          title: '🎯 Meta Conquistada!',
          message: `Parabéns! Você atingiu a meta "${updated.name}"!`,
        });
      }
      return updated;
    }));
    appendAuditLog({
      action: 'update',
      entityType: 'goal',
      entityId: id,
      title: 'Meta atualizada',
      message: 'Uma meta financeira foi ajustada.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, addNotification, appendAuditLog, canManageMembers]);

  const deleteGoal = useCallback((id: string) => {
    if (!canManageMembers) return;
    setGoals(prev => prev.filter(g => g.id !== id));
    appendAuditLog({
      action: 'delete',
      entityType: 'goal',
      entityId: id,
      title: 'Meta removida',
      message: 'Uma meta financeira foi removida.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  // Members
  const addMember = useCallback((m: Omit<FamilyMember, 'id' | 'createdAt'>) => {
    if (!canManageMembers) return;
    setMembers(prev => [...prev, { ...m, id: generateId(), createdAt: new Date().toISOString() }]);
    appendAuditLog({
      action: 'create',
      entityType: 'member',
      title: 'Membro adicionado',
      message: `Novo membro cadastrado: ${m.name}.`,
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  const updateMember = useCallback((id: string, updates: Partial<FamilyMember>) => {
    if (!canManageMembers) return;
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    appendAuditLog({
      action: 'update',
      entityType: 'member',
      entityId: id,
      title: 'Membro atualizado',
      message: 'Dados de um membro foram atualizados.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  const deleteMember = useCallback((id: string) => {
    if (!canManageMembers) return;
    setMembers(prev => prev.filter(m => m.id !== id));
    appendAuditLog({
      action: 'delete',
      entityType: 'member',
      entityId: id,
      title: 'Membro removido',
      message: 'Um membro foi removido da lista.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog, canManageMembers]);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Settings
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    appendAuditLog({
      action: 'settings',
      entityType: 'settings',
      title: 'Configurações alteradas',
      message: 'Preferências do aplicativo foram atualizadas.',
      actorId: activeMember?.id ?? 'member-default',
      actorName: activeMember?.name ?? 'Usuário',
      actorRole: activeMember?.role ?? 'member',
    });
  }, [activeMember, appendAuditLog]);

  const clearAllData = useCallback(async () => {
    const clearedSnapshot: CloudSnapshot = {
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      goals: [],
      members: [DEFAULT_MEMBER],
      notifications: [],
      auditLogs: [],
      settings: defaultSettings,
      updatedAt: new Date().toISOString(),
    };
    if (!userId) throw new Error('Usuário não autenticado');
    await relationalDataService.clearAll(userId);

    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
    setBudgets([]);
    setGoals([]);
    setMembers([DEFAULT_MEMBER]);
    setNotifications([]);
    setAuditLogs([]);
    setSettings(defaultSettings);
    setLastSyncedAt(clearedSnapshot.updatedAt);
  }, [userId]);

  return (
    <AppContext.Provider value={{
      transactions, categories, budgets, goals, members, notifications, auditLogs, settings,
      activeMember,
      canManageTransactions,
      canManageMembers,
      canApproveTransactions,
      addTransaction, updateTransaction, deleteTransaction,
      approveTransaction,
      addCategory, updateCategory, deleteCategory,
      setBudget, deleteBudget,
      addGoal, updateGoal, deleteGoal,
      addMember, updateMember, deleteMember,
      addNotification, markNotificationRead, clearNotifications,
      updateSettings,
      applySnapshot,
      clearAllData,
      dataReady,
      syncStatus,
      syncError,
      lastSyncedAt,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
