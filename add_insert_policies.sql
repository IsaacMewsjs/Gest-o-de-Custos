-- Add INSERT policies for RLS
-- Run this SQL in your Supabase SQL Editor to fix the signup error

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can insert family groups
CREATE POLICY "Users can insert family groups" ON family_groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can insert family members (only admins, but we'll allow for now)
CREATE POLICY "Users can insert family members" ON family_members
  FOR INSERT WITH CHECK (
    family_group_id IN (
      SELECT id FROM family_groups WHERE owner_id = auth.uid()
    )
  );

-- Users can insert categories
CREATE POLICY "Users can insert categories" ON categories
  FOR INSERT WITH CHECK (
    family_group_id IN (
      SELECT id FROM family_groups WHERE owner_id = auth.uid()
      UNION 
      SELECT family_group_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert transactions
CREATE POLICY "Users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (
    family_group_id IN (
      SELECT id FROM family_groups WHERE owner_id = auth.uid()
      UNION 
      SELECT family_group_id FROM family_members WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can insert budgets
CREATE POLICY "Users can insert budgets" ON budgets
  FOR INSERT WITH CHECK (
    family_group_id IN (
      SELECT id FROM family_groups WHERE owner_id = auth.uid()
      UNION 
      SELECT family_group_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert goals
CREATE POLICY "Users can insert goals" ON goals
  FOR INSERT WITH CHECK (
    family_group_id IN (
      SELECT id FROM family_groups WHERE owner_id = auth.uid()
      UNION 
      SELECT family_group_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert notifications
CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());
