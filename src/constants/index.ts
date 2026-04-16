import type { Category, FamilyMember } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-alimentacao', name: 'Alimentação', icon: '🍽️', color: '#ff6b6b', type: 'expense', isDefault: true },
  { id: 'cat-transporte', name: 'Transporte', icon: '🚗', color: '#ffa502', type: 'expense', isDefault: true },
  { id: 'cat-moradia', name: 'Moradia', icon: '🏠', color: '#ff7f50', type: 'expense', isDefault: true },
  { id: 'cat-saude', name: 'Saúde', icon: '💊', color: '#ff4757', type: 'expense', isDefault: true },
  { id: 'cat-educacao', name: 'Educação', icon: '📚', color: '#5352ed', type: 'expense', isDefault: true },
  { id: 'cat-lazer', name: 'Lazer', icon: '🎮', color: '#a29bfe', type: 'expense', isDefault: true },
  { id: 'cat-roupas', name: 'Roupas', icon: '👗', color: '#fd79a8', type: 'expense', isDefault: true },
  { id: 'cat-contas', name: 'Contas & Serviços', icon: '💡', color: '#fdcb6e', type: 'expense', isDefault: true },
  { id: 'cat-investimentos', name: 'Investimentos', icon: '📈', color: '#00b894', type: 'expense', isDefault: true },
  { id: 'cat-outros-exp', name: 'Outros', icon: '💸', color: '#636e72', type: 'expense', isDefault: true },
  { id: 'cat-salario', name: 'Salário', icon: '💼', color: '#00d4a8', type: 'income', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance', icon: '💻', color: '#00cec9', type: 'income', isDefault: true },
  { id: 'cat-presente', name: 'Presente / Doação', icon: '🎁', color: '#6c5ce7', type: 'income', isDefault: true },
  { id: 'cat-rendimentos', name: 'Rendimentos', icon: '💰', color: '#55efc4', type: 'income', isDefault: true },
  { id: 'cat-outros-inc', name: 'Outras Receitas', icon: '➕', color: '#74b9ff', type: 'income', isDefault: true },
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
  '#ff6b6b', '#ffa502', '#ff7f50', '#ff4757', '#5352ed',
  '#a29bfe', '#fd79a8', '#fdcb6e', '#00b894', '#636e72',
  '#00d4a8', '#00cec9', '#6c5ce7', '#55efc4', '#74b9ff',
  '#e17055', '#d63031', '#0984e3', '#6ab04c', '#badc58',
];
