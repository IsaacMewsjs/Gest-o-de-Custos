import { supabase } from './supabase';
import type { Transaction, Category, Budget, Goal, FamilyMember, Notification, AuditLog, AppSettings } from '../types';

export interface RelationalSnapshot {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  members: FamilyMember[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: AppSettings | null;
}

const withOwner = (ownerId: string, item: Record<string, unknown>) => ({
  ...item,
  owner_id: ownerId,
});

const syncTable = async (table: string, ownerId: string, rows: Record<string, unknown>[]) => {
  const { error: deleteError } = await supabase.from(table).delete().eq('owner_id', ownerId);
  if (deleteError) throw deleteError;
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows.map(row => withOwner(ownerId, row)));
  if (error) throw error;
};

export const relationalDataService = {
  async loadAll(ownerId: string): Promise<RelationalSnapshot> {
    const [transactions, categories, budgets, goals, members, notifications, auditLogs, settings] = await Promise.all([
      supabase.from('transactions').select('*').eq('owner_id', ownerId),
      supabase.from('categories').select('*').eq('owner_id', ownerId),
      supabase.from('budgets').select('*').eq('owner_id', ownerId),
      supabase.from('goals').select('*').eq('owner_id', ownerId),
      supabase.from('family_members').select('*').eq('owner_id', ownerId),
      supabase.from('notifications').select('*').eq('owner_id', ownerId),
      supabase.from('audit_logs').select('*').eq('owner_id', ownerId),
      supabase.from('settings').select('*').eq('owner_id', ownerId).maybeSingle(),
    ]);
    const result = [transactions, categories, budgets, goals, members, notifications, auditLogs, settings];
    const failed = result.find(query => query.error);
    if (failed?.error) throw failed.error;

    return {
      transactions: (transactions.data ?? []).map(row => ({
        ...row,
        categoryId: row.category_id,
        memberId: row.member_id,
        parentTransactionId: row.parent_transaction_id,
        isRecurringGenerated: row.is_recurring_generated,
        approvalRequestedAt: row.approval_requested_at,
        approvedAt: row.approved_at,
        approvedBy: row.approved_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } as Transaction)),
      categories: (categories.data ?? []).map(row => ({ ...row, categoryId: row.category_id, isDefault: row.is_default } as Category)),
      budgets: (budgets.data ?? []).map(row => ({ ...row, categoryId: row.category_id } as Budget)),
      goals: (goals.data ?? []).map(row => ({ ...row, targetAmount: row.target_amount, currentAmount: row.current_amount, createdAt: row.created_at, completedAt: row.completed_at } as Goal)),
      members: (members.data ?? []).map(row => ({ ...row, createdAt: row.created_at } as FamilyMember)),
      notifications: (notifications.data ?? []).map(row => ({ ...row, createdAt: row.created_at } as Notification)),
      auditLogs: (auditLogs.data ?? []).map(row => ({ ...row, entityType: row.entity_type, entityId: row.entity_id, actorId: row.actor_id, actorName: row.actor_name, actorRole: row.actor_role, createdAt: row.created_at } as AuditLog)),
      settings: settings.data ? { ...settings.data, activeMemberId: settings.data.active_member_id, dashboardWidgets: settings.data.dashboard_widgets, homeDashboardPreset: settings.data.home_dashboard_preset, onboardingCompleted: settings.data.onboarding_completed } as AppSettings : null,
    };
  },

  async saveAll(ownerId: string, snapshot: RelationalSnapshot) {
    await Promise.all([
      syncTable('transactions', ownerId, snapshot.transactions.map(item => ({ id: item.id, type: item.type, amount: item.amount, category_id: item.categoryId, description: item.description, date: item.date, member_id: item.memberId, recurrence: item.recurrence, notes: item.notes, parent_transaction_id: item.parentTransactionId, is_recurring_generated: item.isRecurringGenerated ?? false, status: item.status ?? 'approved', approval_requested_at: item.approvalRequestedAt, approved_at: item.approvedAt, approved_by: item.approvedBy, created_at: item.createdAt, updated_at: item.updatedAt }))),
      syncTable('categories', ownerId, snapshot.categories.map(item => ({ id: item.id, name: item.name, icon: item.icon, color: item.color, type: item.type, is_default: item.isDefault }))),
      syncTable('budgets', ownerId, snapshot.budgets.map(item => ({ id: item.id, category_id: item.categoryId, amount: item.amount, month: item.month, year: item.year }))),
      syncTable('goals', ownerId, snapshot.goals.map(item => ({ id: item.id, name: item.name, target_amount: item.targetAmount, current_amount: item.currentAmount, deadline: item.deadline, icon: item.icon, color: item.color, created_at: item.createdAt, completed_at: item.completedAt }))),
      syncTable('family_members', ownerId, snapshot.members.map(item => ({ id: item.id, name: item.name, avatar: item.avatar, role: item.role, created_at: item.createdAt }))),
      syncTable('notifications', ownerId, snapshot.notifications.map(item => ({ id: item.id, type: item.type, title: item.title, message: item.message, read: item.read, created_at: item.createdAt }))),
      syncTable('audit_logs', ownerId, snapshot.auditLogs.map(item => ({ id: item.id, action: item.action, entity_type: item.entityType, entity_id: item.entityId, title: item.title, message: item.message, actor_id: item.actorId, actor_name: item.actorName, actor_role: item.actorRole, created_at: item.createdAt }))),
      snapshot.settings ? supabase.from('settings').upsert(withOwner(ownerId, { currency: snapshot.settings.currency, locale: snapshot.settings.locale, theme: snapshot.settings.theme, active_member_id: snapshot.settings.activeMemberId, dashboard_widgets: snapshot.settings.dashboardWidgets, home_dashboard_preset: snapshot.settings.homeDashboardPreset, onboarding_completed: snapshot.settings.onboardingCompleted }), { onConflict: 'owner_id' }).then(({ error }) => { if (error) throw error; }) : Promise.resolve(),
    ]);
  },

  async clearAll(ownerId: string) {
    await Promise.all([
      'transactions', 'categories', 'budgets', 'goals', 'family_members', 'notifications', 'audit_logs', 'settings',
    ].map(table => supabase.from(table).delete().eq('owner_id', ownerId).then(({ error }) => { if (error) throw error; })));
  },
};

// ==================== TRANSACTIONS ====================
export const transactionsService = {
  // Get all transactions for a family group
  async getTransactions(familyGroupId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('family_group_id', familyGroupId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get transactions by date range
  async getTransactionsByDateRange(familyGroupId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('family_group_id', familyGroupId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create transaction
  async createTransaction(transaction: any) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Update transaction
  async updateTransaction(id: string, updates: any) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Delete transaction
  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ==================== CATEGORIES ====================
export const categoriesService = {
  // Get all categories for a family group
  async getCategories(familyGroupId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('family_group_id', familyGroupId);
    
    if (error) throw error;
    return data || [];
  },

  // Create category
  async createCategory(category: any) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Update category
  async updateCategory(id: string, updates: any) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Delete category
  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ==================== BUDGETS ====================
export const budgetsService = {
  // Get all budgets for a family group
  async getBudgets(familyGroupId: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('family_group_id', familyGroupId);
    
    if (error) throw error;
    return data || [];
  },

  // Get budgets by month
  async getBudgetsByMonth(familyGroupId: string, month: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('family_group_id', familyGroupId)
      .eq('month', month);
    
    if (error) throw error;
    return data || [];
  },

  // Create budget
  async createBudget(budget: any) {
    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Update budget
  async updateBudget(id: string, updates: any) {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Delete budget
  async deleteBudget(id: string) {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ==================== GOALS ====================
export const goalsService = {
  // Get all goals for a family group
  async getGoals(familyGroupId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('family_group_id', familyGroupId);
    
    if (error) throw error;
    return data || [];
  },

  // Create goal
  async createGoal(goal: any) {
    const { data, error } = await supabase
      .from('goals')
      .insert([goal])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Update goal
  async updateGoal(id: string, updates: any) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Delete goal
  async deleteGoal(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ==================== FAMILY MEMBERS ====================
export const familyMembersService = {
  // Get all members of a family group
  async getMembers(familyGroupId: string) {
    const { data, error } = await supabase
      .from('family_members')
      .select('*, users(*)')
      .eq('family_group_id', familyGroupId);
    
    if (error) throw error;
    return data || [];
  },

  // Add member to family group
  async addMember(familyGroupId: string, userId: string, role: string = 'member') {
    const { data, error } = await supabase
      .from('family_members')
      .insert([{ family_group_id: familyGroupId, user_id: userId, role }])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Remove member from family group
  async removeMember(familyGroupId: string, userId: string) {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('family_group_id', familyGroupId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },
};

// ==================== FAMILY GROUPS ====================
export const familyGroupsService = {
  // Get all family groups for current user
  async getFamilyGroups() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('family_groups')
      .select('*')
      .or(`owner_id.eq.${user.id},id.in.(SELECT family_group_id FROM family_members WHERE user_id = ${user.id})`);
    
    if (error) throw error;
    return data || [];
  },

  // Create family group
  async createFamilyGroup(name: string, description?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('family_groups')
      .insert([{ name, description, owner_id: user.id }])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Update family group
  async updateFamilyGroup(id: string, updates: any) {
    const { data, error } = await supabase
      .from('family_groups')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Delete family group
  async deleteFamilyGroup(id: string) {
    const { error } = await supabase
      .from('family_groups')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ==================== USERS ====================
export const usersService = {
  // Create user profile
  async createUserProfile(userId: string, email: string, displayName?: string) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, email, display_name: displayName }])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },
};

// ==================== NOTIFICATIONS ====================
export const notificationsService = {
  // Get user notifications
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Create notification
  async createNotification(notification: any) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },

  // Mark notification as read
  async markNotificationAsRead(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },
};
