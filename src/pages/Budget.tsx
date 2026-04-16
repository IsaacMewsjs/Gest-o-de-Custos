import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, calcMonthSummary, formatMonthYear, capitalize
} from '../utils/calculations';
import Modal from '../components/ui/Modal';
import type { Goal } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface BudgetProps {
  addToast: (t: any) => void;
}

const GOAL_ICONS = ['🎯', '🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🐕', '💰', '🏋️', '🛒'];

const Budget: React.FC<BudgetProps> = ({ addToast }) => {
  const { categories, budgets, goals, transactions, setBudget, deleteBudget, addGoal, updateGoal, deleteGoal } = useApp();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const summary = calcMonthSummary(transactions, selectedMonth, selectedYear);

  // Budget form
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ categoryId: '', amount: '' });

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalForm, setGoalForm] = useState({
    name: '', targetAmount: '', currentAmount: '',
    deadline: '', icon: '🎯', color: '#00d4a8',
  });
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  const handleSaveBudget = () => {
    if (!budgetForm.categoryId || !budgetForm.amount) return;
    setBudget({
      categoryId: budgetForm.categoryId,
      amount: parseFloat(budgetForm.amount),
      month: selectedMonth,
      year: selectedYear,
    });
    setShowBudgetForm(false);
    setBudgetForm({ categoryId: '', amount: '' });
    addToast({ type: 'success', title: 'Orçamento definido!' });
  };

  const handleSaveGoal = () => {
    if (!goalForm.name || !goalForm.targetAmount) return;
    const data = {
      name: goalForm.name,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: parseFloat(goalForm.currentAmount || '0'),
      deadline: goalForm.deadline || undefined,
      icon: goalForm.icon,
      color: goalForm.color,
    };
    if (editingGoal) {
      updateGoal(editingGoal.id, data);
      addToast({ type: 'success', title: 'Meta atualizada!' });
    } else {
      addGoal(data);
      addToast({ type: 'success', title: 'Meta criada!' });
    }
    setShowGoalForm(false);
    setEditingGoal(null);
    setGoalForm({ name: '', targetAmount: '', currentAmount: '', deadline: '', icon: '🎯', color: '#00d4a8' });
  };

  const openEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setGoalForm({
      name: g.name,
      targetAmount: g.targetAmount.toString(),
      currentAmount: g.currentAmount.toString(),
      deadline: g.deadline?.slice(0, 10) ?? '',
      icon: g.icon,
      color: g.color,
    });
    setShowGoalForm(true);
  };

  const monthBudgets = budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: capitalize(formatMonthYear(i + 1, selectedYear)),
  }));

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-24">
        <h1>Orçamento & Metas</h1>
        <div className="flex gap-8">
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
          >
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── BUDGETS ─────────────────────────────── */}
      <div className="section-header mb-16">
        <span className="section-title">💳 Orçamento por Categoria</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowBudgetForm(true)}>
          <Plus size={14} /> Definir Orçamento
        </button>
      </div>

      {monthBudgets.length === 0 ? (
        <div className="card mb-24">
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <div className="empty-title">Nenhum orçamento definido</div>
            <div className="empty-desc">Defina limites por categoria para controlar seus gastos</div>
            <button className="btn btn-primary btn-sm mt-8" onClick={() => setShowBudgetForm(true)}>
              <Plus size={14} /> Criar Orçamento
            </button>
          </div>
        </div>
      ) : (
        <div className="section-grid mb-24">
          {monthBudgets.map((budget, i) => {
            const cat = categories.find(c => c.id === budget.categoryId);
            const spent = summary.byCategory[budget.categoryId] || 0;
            const remaining = budget.amount - spent;
            const pct = Math.min((spent / budget.amount) * 100, 100);
            const status = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe';

            return (
              <motion.div
                key={budget.id}
                className="budget-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="budget-header">
                  <div className="budget-cat">
                    <span style={{ fontSize: '1.2rem' }}>{cat?.icon}</span>
                    <span>{cat?.name ?? '—'}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className={`badge badge-${status === 'safe' ? 'green' : status === 'warning' ? 'gold' : 'red'}`}>
                      {Math.round(pct)}%
                    </span>
                    <button
                      className="btn-icon"
                      style={{ padding: 4 }}
                      onClick={() => deleteBudget(budget.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="progress-track">
                  <div
                    className={`progress-fill ${status}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="budget-amounts">
                  <span>
                    <span style={{ color: status === 'safe' ? 'var(--green)' : status === 'warning' ? 'var(--gold)' : 'var(--red)', fontWeight: 700 }}>
                      {formatCurrency(spent)}
                    </span>
                    {' '}gastos
                  </span>
                  <span>Limite: {formatCurrency(budget.amount)}</span>
                </div>

                <div className="text-xs" style={{
                  color: remaining >= 0 ? 'var(--text-muted)' : 'var(--red)',
                  fontWeight: 600,
                }}>
                  {remaining >= 0
                    ? `✓ Restam ${formatCurrency(remaining)}`
                    : `⚠️ Excedeu ${formatCurrency(Math.abs(remaining))}`}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── GOALS ────────────────────────────────── */}
      <div className="section-header mb-16">
        <span className="section-title">🎯 Metas Financeiras</span>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditingGoal(null); setShowGoalForm(true); }}>
          <Plus size={14} /> Nova Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <div className="empty-title">Nenhuma meta criada</div>
            <div className="empty-desc">Crie metas para juntar dinheiro para seus sonhos</div>
            <button className="btn btn-primary btn-sm mt-8" onClick={() => setShowGoalForm(true)}>
              Nova Meta
            </button>
          </div>
        </div>
      ) : (
        <div className="section-grid">
          {goals.map((goal, i) => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const isDone = goal.currentAmount >= goal.targetAmount;
            const r = 26;
            const circ = 2 * Math.PI * r;
            const offset = circ - (pct / 100) * circ;

            return (
              <motion.div
                key={goal.id}
                className={`goal-card ${isDone ? 'goal-completed' : ''}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-12">
                    <div
                      className="goal-icon"
                      style={{ background: `${goal.color}20`, fontSize: '1.6rem' }}
                    >
                      {goal.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>{goal.name}</div>
                      {goal.deadline && (
                        <div className="text-xs text-muted">
                          Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {isDone && (
                        <span className="badge badge-green" style={{ marginTop: 4 }}>✅ Concluída!</span>
                      )}
                    </div>
                  </div>

                  {/* Circular progress */}
                  <div className="circular-progress">
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <circle className="track" cx="30" cy="30" r={r} />
                      <circle
                        className="fill"
                        cx="30"
                        cy="30"
                        r={r}
                        stroke={goal.color}
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                      />
                    </svg>
                    <div className="pct">{Math.round(pct)}%</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: goal.color, fontWeight: 700 }}>
                    {formatCurrency(goal.currentAmount)}
                  </span>
                  <span className="text-muted">de {formatCurrency(goal.targetAmount)}</span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill safe"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${goal.color}, ${goal.color}cc)` }}
                  />
                </div>

                {!isDone && (
                  <div className="text-xs text-muted">
                    Faltam {formatCurrency(remaining)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-8" style={{ marginTop: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const deposit = parseFloat(prompt('Quanto deseja depositar?') ?? '0');
                      if (!isNaN(deposit) && deposit > 0) {
                        updateGoal(goal.id, { currentAmount: goal.currentAmount + deposit });
                        addToast({ type: 'success', title: `+${formatCurrency(deposit)} adicionados à meta` });
                      }
                    }}
                  >
                    + Depositar
                  </button>
                  <button className="btn-icon" onClick={() => openEditGoal(goal)}>
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--red)' }}
                    onClick={() => setDeleteGoalId(goal.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Budget Form Modal */}
      <Modal
        open={showBudgetForm}
        onClose={() => setShowBudgetForm(false)}
        title="Definir Orçamento"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowBudgetForm(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveBudget}>Salvar</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select
            className="form-select"
            value={budgetForm.categoryId}
            onChange={e => setBudgetForm(f => ({ ...f, categoryId: e.target.value }))}
          >
            <option value="">Selecionar...</option>
            {categories.filter(c => c.type === 'expense' || c.type === 'both').map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Limite Mensal (R$)</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={budgetForm.amount}
            onChange={e => setBudgetForm(f => ({ ...f, amount: e.target.value }))}
          />
        </div>
        <p className="text-muted text-sm">
          Período: {capitalize(formatMonthYear(selectedMonth, selectedYear))}
        </p>
      </Modal>

      {/* Goal Form Modal */}
      <Modal
        open={showGoalForm}
        onClose={() => { setShowGoalForm(false); setEditingGoal(null); }}
        title={editingGoal ? 'Editar Meta' : 'Nova Meta'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowGoalForm(false); setEditingGoal(null); }}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveGoal}>
              {editingGoal ? 'Salvar' : 'Criar Meta'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nome da Meta</label>
          <input
            className="form-input"
            type="text"
            placeholder="Ex: Viagem, Carro, Reserva de emergência..."
            value={goalForm.name}
            onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Valor Alvo (R$)</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={goalForm.targetAmount}
              onChange={e => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Valor Atual (R$)</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={goalForm.currentAmount}
              onChange={e => setGoalForm(f => ({ ...f, currentAmount: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Prazo (opcional)</label>
          <input
            className="form-input"
            type="date"
            value={goalForm.deadline}
            onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Ícone</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {GOAL_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => setGoalForm(f => ({ ...f, icon }))}
                style={{
                  width: 38, height: 38, fontSize: '1.2rem',
                  borderRadius: 8, border: `2px solid ${goalForm.icon === icon ? 'var(--blue)' : 'var(--border)'}`,
                  background: goalForm.icon === icon ? 'var(--blue-dim)' : 'var(--bg-input)',
                  cursor: 'pointer',
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Cor</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORY_COLORS.slice(0, 10).map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setGoalForm(f => ({ ...f, color }))}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: color,
                  border: `3px solid ${goalForm.color === color ? 'var(--text-primary)' : 'transparent'}`,
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Goal Confirm */}
      <Modal
        open={!!deleteGoalId}
        onClose={() => setDeleteGoalId(null)}
        title="Excluir Meta"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteGoalId(null)}>Cancelar</button>
            <button className="btn btn-red" onClick={() => {
              if (deleteGoalId) deleteGoal(deleteGoalId);
              setDeleteGoalId(null);
              addToast({ type: 'success', title: 'Meta excluída' });
            }}>Excluir</button>
          </>
        }
      >
        <p className="text-muted">Tem certeza que deseja excluir esta meta?</p>
      </Modal>
    </div>
  );
};

export default Budget;
