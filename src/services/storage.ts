import type {
  Transaction, Category, Budget, Goal,
  FamilyMember, AppSettings, Notification, AuditLog
} from '../types';

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
