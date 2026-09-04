import type {
  Transaction, Category, Budget, Goal,
  FamilyMember, AppSettings, Notification, DashboardWidgetPreference, AuditLog, DashboardPresetId
} from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_MEMBER, DEFAULT_DASHBOARD_WIDGETS } from '../constants';

const KEYS = {
  transactions: 'ffam_transactions',
  categories: 'ffam_categories',
  budgets: 'ffam_budgets',
  goals: 'ffam_goals',
  members: 'ffam_members',
  settings: 'ffam_settings',
  notifications: 'ffam_notifications',
  auditLogs: 'ffam_audit_logs',
  syncMeta: 'ffam_sync_meta',
  savedTransactionFilters: 'ffam_saved_transaction_filters',
};

export interface SyncMeta {
  updatedAt: string;
}

export interface SavedTransactionFilter {
  id: string;
  name: string;
  search: string;
  filterType: 'all' | 'income' | 'expense';
  filterCat: string;
  filterMember: string;
  sortBy: 'date' | 'amount';
}

export interface AuditLogEntry extends AuditLog {}

export interface BackupData {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  members: FamilyMember[];
  settings: AppSettings;
  notifications: Notification[];
  auditLogs: AuditLog[];
  exportedAt?: string;
}

const normalizeDashboardWidgets = (
  widgets?: DashboardWidgetPreference[]
): DashboardWidgetPreference[] => {
  const byId = new Map((widgets ?? []).map(widget => [widget.id, widget]));
  return DEFAULT_DASHBOARD_WIDGETS.map(widget => ({
    id: widget.id,
    visible: byId.get(widget.id)?.visible ?? widget.visible,
  }));
};

const normalizeSettings = (stored?: Partial<AppSettings> | null): AppSettings => ({
  currency: stored?.currency ?? 'BRL',
  locale: stored?.locale ?? 'pt-BR',
  theme: stored?.theme ?? 'light',
  activeMemberId: stored?.activeMemberId ?? DEFAULT_MEMBER.id,
  dashboardWidgets: normalizeDashboardWidgets(stored?.dashboardWidgets),
  homeDashboardPreset: stored?.homeDashboardPreset ?? 'inicio',
  onboardingCompleted: stored?.onboardingCompleted ?? false,
});

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(_key: string, _value: T): void {
  // Business data persistence is handled in Supabase. We intentionally avoid
  // writing app state to localStorage to prevent stale browser copies.
}

// ── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions = (): Transaction[] =>
  getItem<Transaction[]>(KEYS.transactions, []);

export const saveTransactions = (transactions: Transaction[]): void =>
  setItem(KEYS.transactions, transactions);

// ── Categories ───────────────────────────────────────────────────────────────
export const getCategories = (): Category[] => {
  const stored = getItem<Category[]>(KEYS.categories, []);
  if (stored.length === 0) {
    setItem(KEYS.categories, DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return stored;
};

export const saveCategories = (categories: Category[]): void =>
  setItem(KEYS.categories, categories);

// ── Budgets ──────────────────────────────────────────────────────────────────
export const getBudgets = (): Budget[] =>
  getItem<Budget[]>(KEYS.budgets, []);

export const saveBudgets = (budgets: Budget[]): void =>
  setItem(KEYS.budgets, budgets);

// ── Goals ────────────────────────────────────────────────────────────────────
export const getGoals = (): Goal[] =>
  getItem<Goal[]>(KEYS.goals, []);

export const saveGoals = (goals: Goal[]): void =>
  setItem(KEYS.goals, goals);

// ── Family Members ────────────────────────────────────────────────────────────
export const getMembers = (): FamilyMember[] => {
  const stored = getItem<FamilyMember[]>(KEYS.members, []);
  if (stored.length === 0) {
    setItem(KEYS.members, [DEFAULT_MEMBER]);
    return [DEFAULT_MEMBER];
  }
  return stored;
};

export const saveMembers = (members: FamilyMember[]): void =>
  setItem(KEYS.members, members);

// ── Settings ─────────────────────────────────────────────────────────────────
export const getSettings = (): AppSettings =>
  normalizeSettings(getItem<Partial<AppSettings> | null>(KEYS.settings, null));

export const saveSettings = (settings: AppSettings): void =>
  setItem(KEYS.settings, settings);

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (): Notification[] =>
  getItem<Notification[]>(KEYS.notifications, []);

export const saveNotifications = (notifications: Notification[]): void =>
  setItem(KEYS.notifications, notifications);

// ── Audit Logs ──────────────────────────────────────────────────────────────
export const getAuditLogs = (): AuditLog[] =>
  getItem<AuditLog[]>(KEYS.auditLogs, []);

export const saveAuditLogs = (logs: AuditLog[]): void =>
  setItem(KEYS.auditLogs, logs);

// ── Saved transaction filters ───────────────────────────────────────────────
export const getSavedTransactionFilters = (): SavedTransactionFilter[] =>
  getItem<SavedTransactionFilter[]>(KEYS.savedTransactionFilters, []);

export const saveSavedTransactionFilters = (filters: SavedTransactionFilter[]): void =>
  setItem(KEYS.savedTransactionFilters, filters);

// ── Sync metadata ────────────────────────────────────────────────────────────
export const getSyncMeta = (): SyncMeta =>
  getItem<SyncMeta>(KEYS.syncMeta, { updatedAt: '' });

export const saveSyncMeta = (meta: SyncMeta): void =>
  setItem(KEYS.syncMeta, meta);

export const clearSyncMeta = (): void => {
  localStorage.removeItem(KEYS.syncMeta);
};

// ── Export ────────────────────────────────────────────────────────────────────
export const exportBackup = (data: Omit<BackupData, 'exportedAt'>): string => {
  return JSON.stringify({
    ...data,
    exportedAt: new Date().toISOString(),
  }, null, 2);
};

export const importBackup = (json: string): Partial<BackupData> | null => {
  try {
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data as Partial<BackupData>;
  } catch {
    return null;
  }
};
