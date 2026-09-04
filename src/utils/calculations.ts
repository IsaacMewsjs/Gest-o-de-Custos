import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction, MonthSummary } from '../types';

export const formatCurrency = (value: number, currency = 'BRL', locale = 'pt-BR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateStr: string, fmt = 'dd/MM/yyyy'): string => {
  try {
    return format(parseISO(dateStr), fmt, { locale: ptBR });
  } catch {
    return dateStr;
  }
};

export const formatMonthYear = (month: number, year: number): string => {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMMM yyyy', { locale: ptBR });
};

export const formatPercent = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

export const getMonthTransactions = (
  transactions: Transaction[],
  month: number,
  year: number
): Transaction[] => {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(new Date(year, month - 1, 1));
  return transactions.filter(t => {
    const date = parseISO(t.date);
    return t.status !== 'pending' && isWithinInterval(date, { start, end });
  });
};

export const calcMonthSummary = (
  transactions: Transaction[],
  month: number,
  year: number
): MonthSummary => {
  const monthTx = getMonthTransactions(transactions, month, year);
  const byCategory: Record<string, number> = {};

  let totalIncome = 0;
  let totalExpense = 0;

  monthTx.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + t.amount;
    }
  });

  return {
    month,
    year,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory,
  };
};

export const getHealthStatus = (income: number, expense: number): 'positive' | 'neutral' | 'negative' => {
  if (income === 0 && expense === 0) return 'neutral';
  const ratio = expense / income;
  if (ratio <= 0.7) return 'positive';
  if (ratio <= 1.0) return 'neutral';
  return 'negative';
};

export const getLast6Months = (): { month: number; year: number }[] => {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return result;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);
