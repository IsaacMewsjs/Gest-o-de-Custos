import type {
  Transaction, Category, Budget, Goal,
  FamilyMember, AppSettings, Notification
} from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_MEMBER } from '../constants';

const KEYS = {
  transactions: 'ffam_transactions',
  categories: 'ffam_categories',
  budgets: 'ffam_budgets',
  goals: 'ffam_goals',
  members: 'ffam_members',
  settings: 'ffam_settings',
  notifications: 'ffam_notifications',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
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
const DEFAULT_SETTINGS: AppSettings = {
  currency: 'BRL',
  locale: 'pt-BR',
  theme: 'dark',
  activeMemberId: DEFAULT_MEMBER.id,
};

export const getSettings = (): AppSettings =>
  getItem<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);

export const saveSettings = (settings: AppSettings): void =>
  setItem(KEYS.settings, settings);

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (): Notification[] =>
  getItem<Notification[]>(KEYS.notifications, []);

export const saveNotifications = (notifications: Notification[]): void =>
  setItem(KEYS.notifications, notifications);

// ── Export ────────────────────────────────────────────────────────────────────
export const exportBackup = (): string => {
  const data = {
    transactions: getTransactions(),
    categories: getCategories(),
    budgets: getBudgets(),
    goals: getGoals(),
    members: getMembers(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

export const importBackup = (json: string): boolean => {
  try {
    const data = JSON.parse(json);
    if (data.transactions) saveTransactions(data.transactions);
    if (data.categories) saveCategories(data.categories);
    if (data.budgets) saveBudgets(data.budgets);
    if (data.goals) saveGoals(data.goals);
    if (data.members) saveMembers(data.members);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch {
    return false;
  }
};
