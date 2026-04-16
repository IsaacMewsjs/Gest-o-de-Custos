export type TransactionType = 'income' | 'expense';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string; // emoji
  role: 'admin' | 'member';
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  date: string; // ISO string
  memberId: string;
  recurrence: RecurrenceType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: number; // 1-12
  year: number;
  spent?: number; // computed
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO string
  icon: string;
  color: string;
  createdAt: string;
  completedAt?: string;
}

export interface Notification {
  id: string;
  type: 'warning' | 'success' | 'info' | 'danger';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AppSettings {
  currency: string;
  locale: string;
  theme: 'dark' | 'light';
  activeMemberId: string;
}

export interface MonthSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, number>;
}

export interface FinancialTip {
  id: string;
  title: string;
  message: string;
  type: 'saving' | 'warning' | 'goal' | 'info';
  icon: string;
}
