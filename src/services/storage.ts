import type {
  Transaction, Category, Budget, Goal,
  FamilyMember, AppSettings, Notification, AuditLog
} from '../types';

const LOCAL_STATE_KEY = 'ffam_app_state';

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

export type LocalAppState = Omit<BackupData, 'exportedAt'>;

export const getLocalSnapshot = (): Partial<LocalAppState> | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
};

export const saveLocalSnapshot = (snapshot: LocalAppState): void => {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(snapshot));
};

export const clearLocalSnapshot = (): void => {
  localStorage.removeItem(LOCAL_STATE_KEY);
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
