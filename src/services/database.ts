import { supabase } from './supabase';

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
