import type { Category, FamilyMember, DashboardWidgetPreference } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-alimentacao', name: 'Alimentação', icon: '🍽️', color: '#ff6b6b', type: 'expense', isDefault: true },
  { id: 'cat-transporte', name: 'Transporte', icon: '🚗', color: '#ff9500', type: 'expense', isDefault: true },
  { id: 'cat-moradia', name: 'Moradia', icon: '🏠', color: '#d1a77a', type: 'expense', isDefault: true },
  { id: 'cat-saude', name: 'Saúde', icon: '💊', color: '#ff3b30', type: 'expense', isDefault: true },
  { id: 'cat-educacao', name: 'Educação', icon: '📚', color: '#0071e3', type: 'expense', isDefault: true },
  { id: 'cat-lazer', name: 'Lazer', icon: '🎮', color: '#8e8ce8', type: 'expense', isDefault: true },
  { id: 'cat-roupas', name: 'Roupas', icon: '👗', color: '#ff8fc7', type: 'expense', isDefault: true },
  { id: 'cat-contas', name: 'Contas & Serviços', icon: '💡', color: '#ffcc00', type: 'expense', isDefault: true },
  { id: 'cat-dizimos-ofertas', name: 'Dízimos e Ofertas', icon: '⛪', color: '#0071e3', type: 'expense', isDefault: true },
  { id: 'cat-investimentos', name: 'Investimentos', icon: '📈', color: '#34c759', type: 'expense', isDefault: true },
  { id: 'cat-outros-exp', name: 'Outros', icon: '💸', color: '#8e8e93', type: 'expense', isDefault: true },
  { id: 'cat-salario', name: 'Salário', icon: '💼', color: '#0071e3', type: 'income', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance', icon: '💻', color: '#5ac8fa', type: 'income', isDefault: true },
  { id: 'cat-presente', name: 'Presente / Doação', icon: '🎁', color: '#af52de', type: 'income', isDefault: true },
  { id: 'cat-rendimentos', name: 'Rendimentos', icon: '💰', color: '#34c759', type: 'income', isDefault: true },
  { id: 'cat-outros-inc', name: 'Outras Receitas', icon: '➕', color: '#64d2ff', type: 'income', isDefault: true },
];

export const DEFAULT_MEMBER: FamilyMember = {
  id: 'member-default',
  name: 'Eu',
  avatar: '😊',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

export const MEMBER_AVATARS = ['😊', '😎', '🥰', '🤩', '😄', '👨', '👩', '👦', '👧', '🧔', '👴', '👵', '🧑', '👱', '🧒'];

export const CATEGORY_COLORS = [
  '#ff6b6b', '#ff9500', '#d1a77a', '#ff3b30', '#0071e3',
  '#8e8ce8', '#ff8fc7', '#ffcc00', '#34c759', '#8e8e93',
  '#5ac8fa', '#64d2ff', '#af52de', '#7ee081', '#9fb0ff',
  '#d6a77a', '#e36b6b', '#4da3ff', '#85c86b', '#c2d95c',
];

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetPreference[] = [
  { id: 'health', visible: true },
  { id: 'stats', visible: true },
  { id: 'insights', visible: true },
  { id: 'tithe', visible: true },
  { id: 'charts', visible: true },
  { id: 'recent', visible: true },
  { id: 'tips', visible: true },
  { id: 'budgets', visible: true },
];
