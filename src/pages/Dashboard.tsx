import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { motion } from 'framer-motion';
import {
  Wallet, PiggyBank,
  ArrowUpCircle, ArrowDownCircle, Lightbulb, Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, calcMonthSummary, getHealthStatus,
  getLast6Months, formatMonthYear, capitalize, formatDate
} from '../utils/calculations';
import { generateTips } from '../services/tips';
import TransactionForm from '../components/transactions/TransactionForm';
import type { Toast } from '../components/ui/Toast';

const CHART_COLORS = [
  '#00d4a8', '#ff4757', '#4e8cff', '#ffd32a', '#a29bfe',
  '#ff6b6b', '#ffa502', '#00cec9', '#fd79a8', '#fdcb6e',
];

const chartFormatter = (val: any, _name: any): any =>
  [formatCurrency(typeof val === 'number' ? val : 0), _name];

interface DashboardProps {
  addToast: (t: Omit<Toast, 'id'>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ addToast }) => {
  const { transactions, categories, members, budgets, settings } = useApp();
  const [showForm, setShowForm] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const summary = calcMonthSummary(transactions, month, year);
  const health = getHealthStatus(summary.totalIncome, summary.totalExpense);
  const tips = generateTips(transactions, categories);
  const last6 = getLast6Months();

  // Pie chart data
  const pieData = Object.entries(summary.byCategory)
    .map(([catId, amount]: [string, unknown]) => {
      const cat = categories.find((c: any) => c.id === catId);
      return { name: cat?.name ?? 'Outros', value: amount as number, color: cat?.color ?? '#636e72' };
    })
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 8);

  // Bar chart data
  const barData = last6.map(({ month: m, year: y }: { month: number; year: number }) => {
    const s = calcMonthSummary(transactions, m, y);
    return {
      name: capitalize(formatMonthYear(m, y).slice(0, 3)),
      Entradas: s.totalIncome,
      Saídas: s.totalExpense,
    };
  });

  // Recent transactions
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const healthConfig: Record<string, { label: string; text: string }> = {
    positive: { label: '✅ Saúde Financeira: Ótima', text: 'Parabéns! Suas finanças estão equilibradas.' },
    neutral:  { label: '⚠️ Saúde Financeira: Atenção', text: 'Você está gastando boa parte da renda. Cuidado!' },
    negative: { label: '🔴 Saúde Financeira: Crítica', text: 'Seus gastos superam a renda. Reduza despesas!' },
  };
  const hc = healthConfig[health];

  const activeMember = members.find((m: any) => m.id === settings.activeMemberId);

  return (
    <div className="page-wrapper">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ marginBottom: 4 }}>
              Olá, {activeMember?.avatar} {activeMember?.name ?? 'Usuário'}!
            </h1>
            <p className="text-muted text-sm">
              {capitalize(formatMonthYear(month, year))} — resumo financeiro
            </p>
          </div>
          <button className="btn btn-green" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Nova Transação
          </button>
        </div>
      </motion.div>

      {/* Health Indicator */}
      <motion.div
        className={`health-indicator ${health} mb-16`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span style={{ fontSize: '1.2rem' }}>{health === 'positive' ? '💚' : health === 'neutral' ? '💛' : '❤️'}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{hc.label}</div>
          <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>{hc.text}</div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="stats-grid stagger mb-16">
        <StatCard
          label="Saldo Atual"
          value={formatCurrency(summary.totalIncome - summary.totalExpense)}
          color={summary.totalIncome - summary.totalExpense >= 0 ? 'blue' : 'red'}
          icon={<Wallet size={20} />}
        />
        <StatCard
          label="Entradas do Mês"
          value={formatCurrency(summary.totalIncome)}
          color="green"
          icon={<ArrowUpCircle size={20} />}
        />
        <StatCard
          label="Saídas do Mês"
          value={formatCurrency(summary.totalExpense)}
          color="red"
          icon={<ArrowDownCircle size={20} />}
        />
        <StatCard
          label="Economia"
          value={formatCurrency(Math.max(0, summary.totalIncome - summary.totalExpense))}
          color="gold"
          icon={<PiggyBank size={20} />}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid mb-16">
        {/* Pie */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Gastos por Categoria</span>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={chartFormatter}
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-title">Nenhum gasto registrado</div>
              <div className="empty-desc">Adicione transações para ver o gráfico</div>
            </div>
          )}
        </div>

        {/* Bar */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Entradas vs Saídas (6 meses)</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip
                formatter={chartFormatter}
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
              <Bar dataKey="Entradas" fill="#00d4a8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Saídas"   fill="#ff4757" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent + Tips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Recent Transactions */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Últimas Transações</span>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <div className="empty-title">Nenhuma transação</div>
              <div className="empty-desc">Clique em "Nova Transação" para começar</div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {recent.map(tx => {
                const cat = categories.find((c: any) => c.id === tx.categoryId);
                const member = members.find((m: any) => m.id === tx.memberId);
                return (
                  <div key={tx.id} className="transaction-item">
                    <div
                      className="tx-category-icon"
                      style={{ background: cat?.color ? `${cat.color}20` : 'var(--bg-input)' }}
                    >
                      {cat?.icon ?? '💸'}
                    </div>
                    <div className="tx-info">
                      <div className="tx-desc">{tx.description}</div>
                      <div className="tx-meta">
                        <span>{cat?.name}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                        {member && <><span>•</span><span>{member.avatar}</span></>}
                      </div>
                    </div>
                    <div className={`tx-amount ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="flex flex-col gap-12">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Lightbulb size={16} style={{ color: 'var(--gold)' }} />
            <span className="section-title">Dicas Financeiras</span>
          </div>
          {tips.map((tip: any) => (
            <div key={tip.id} className={`tip-card ${tip.type}`}>
              <div className="tip-icon">{tip.icon}</div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                  {tip.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {tip.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick budget overview */}
      {budgets.filter(b => b.month === month && b.year === year).length > 0 && (
        <div className="card mt-16">
          <div className="section-header mb-12">
            <span className="section-title">Orçamentos do Mês</span>
          </div>
          <div className="section-grid">
            {budgets
              .filter((b: any) => b.month === month && b.year === year)
              .slice(0, 4)
              .map((budget: any) => {
                const cat = categories.find((c: any) => c.id === budget.categoryId);
                const spent = summary.byCategory[budget.categoryId] || 0;
                const pct = Math.min((spent / budget.amount) * 100, 100);
                const status = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe';
                return (
                  <div key={budget.id} className="budget-card">
                    <div className="budget-header">
                      <div className="budget-cat">
                        <span>{cat?.icon}</span>
                        <span>{cat?.name}</span>
                      </div>
                      <span className={`badge badge-${status === 'safe' ? 'green' : status === 'warning' ? 'gold' : 'red'}`}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${status}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="budget-amounts">
                      <span>{formatCurrency(spent)} gastos</span>
                      <span>de {formatCurrency(budget.amount)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Transaction form */}
      <TransactionForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={(msg: string) => addToast({ type: 'success', title: msg })}
      />
    </div>
  );
};

// Stat Card component
const StatCard: React.FC<{
  label: string; value: string; color: string; icon: React.ReactNode;
}> = ({ label, value, color, icon }) => (
  <div className={`stat-card ${color}`}>
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div className="stat-label">{label}</div>
    <div className={`stat-value ${color}`}>{value}</div>
  </div>
);

export default Dashboard;
