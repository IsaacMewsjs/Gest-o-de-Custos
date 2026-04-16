import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Transaction, Category, Budget, Goal,
  FamilyMember, Notification, AppSettings
} from '../types';
import * as storage from '../services/storage';
import { generateId, calcMonthSummary } from '../utils/calculations';

interface AppContextType {
  // Data
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  members: FamilyMember[];
  notifications: Notification[];
  settings: AppSettings;

  // Transactions
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

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
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions());
  const [categories, setCategories] = useState<Category[]>(() => storage.getCategories());
  const [budgets, setBudgets] = useState<Budget[]>(() => storage.getBudgets());
  const [goals, setGoals] = useState<Goal[]>(() => storage.getGoals());
  const [members, setMembers] = useState<FamilyMember[]>(() => storage.getMembers());
  const [notifications, setNotifications] = useState<Notification[]>(() => storage.getNotifications());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());

  // Persist whenever state changes
  useEffect(() => { storage.saveTransactions(transactions); }, [transactions]);
  useEffect(() => { storage.saveCategories(categories); }, [categories]);
  useEffect(() => { storage.saveBudgets(budgets); }, [budgets]);
  useEffect(() => { storage.saveGoals(goals); }, [goals]);
  useEffect(() => { storage.saveMembers(members); }, [members]);
  useEffect(() => { storage.saveNotifications(notifications); }, [notifications]);
  useEffect(() => { storage.saveSettings(settings); }, [settings]);

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

  // Transactions
  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    setTransactions(prev => [
      { ...t, id: generateId(), createdAt: now, updatedAt: now },
      ...prev,
    ]);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    );
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // Categories
  const addCategory = useCallback((c: Omit<Category, 'id' | 'isDefault'>) => {
    setCategories(prev => [...prev, { ...c, id: generateId(), isDefault: false }]);
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // Budgets
  const setBudget = useCallback((b: Omit<Budget, 'id'>) => {
    setBudgets(prev => {
      const existing = prev.find(
        x => x.categoryId === b.categoryId && x.month === b.month && x.year === b.year
      );
      if (existing) {
        return prev.map(x => x.id === existing.id ? { ...x, amount: b.amount } : x);
      }
      return [...prev, { ...b, id: generateId() }];
    });
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  // Goals
  const addGoal = useCallback((g: Omit<Goal, 'id' | 'createdAt'>) => {
    setGoals(prev => [...prev, { ...g, id: generateId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
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
  }, [addNotification]);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  // Members
  const addMember = useCallback((m: Omit<FamilyMember, 'id' | 'createdAt'>) => {
    setMembers(prev => [...prev, { ...m, id: generateId(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<FamilyMember>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

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
  }, []);

  return (
    <AppContext.Provider value={{
      transactions, categories, budgets, goals, members, notifications, settings,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      setBudget, deleteBudget,
      addGoal, updateGoal, deleteGoal,
      addMember, updateMember, deleteMember,
      addNotification, markNotificationRead, clearNotifications,
      updateSettings,
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
