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
import { DEFAULT_DASHBOARD_WIDGETS } from '../constants';
import type { DashboardWidgetId } from '../types';

const CHART_COLORS = [
  '#0071e3', '#34c759', '#ff9500', '#8e8ce8', '#ff6b6b',
  '#5ac8fa', '#af52de', '#ff8fc7', '#ffcc00', '#8e8e93',
];

const chartFormatter = (val: any, _name: any): any =>
  [formatCurrency(typeof val === 'number' ? val : 0), _name];

interface DashboardProps {
  addToast: (t: Omit<Toast, 'id'>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ addToast }) => {
  const { transactions, categories, members, budgets, settings } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formPreset, setFormPreset] = useState<{ type?: 'income' | 'expense'; categoryId?: string; description?: string; memberId?: string; recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' } | null>(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const summary = calcMonthSummary(transactions, month, year);
  const previousMonthDate = new Date(year, month - 2, 1);
  const previousSummary = calcMonthSummary(transactions, previousMonthDate.getMonth() + 1, previousMonthDate.getFullYear());
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
  const dashboardWidgets = settings.dashboardWidgets?.length > 0
    ? settings.dashboardWidgets
    : DEFAULT_DASHBOARD_WIDGETS;
  const titheCategory = categories.find(c => c.id === 'cat-dizimos-ofertas');
  const titheTransactions = titheCategory
    ? transactions.filter(tx => tx.status !== 'pending' && tx.type === 'expense' && tx.categoryId === titheCategory.id)
    : [];
  const titheThisMonth = titheTransactions
    .filter(tx => new Date(tx.date).getMonth() + 1 === month && new Date(tx.date).getFullYear() === year)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const tithePreviousMonth = titheTransactions
    .filter(tx => new Date(tx.date).getMonth() + 1 === previousMonthDate.getMonth() + 1 && new Date(tx.date).getFullYear() === previousMonthDate.getFullYear())
    .reduce((sum, tx) => sum + tx.amount, 0);
  const titheVariation = tithePreviousMonth > 0
    ? ((titheThisMonth - tithePreviousMonth) / tithePreviousMonth) * 100
    : 0;
  const tithePendingCount = titheTransactions.filter(tx => tx.status === 'pending').length;

  const openTitheForm = () => {
    setFormPreset({
      type: 'expense',
      categoryId: titheCategory?.id ?? 'cat-dizimos-ofertas',
      description: 'Dízimo',
      memberId: settings.activeMemberId,
      recurrence: 'monthly',
    });
    setShowForm(true);
  };

  const topCategoryEntry = Object.entries(summary.byCategory)
    .sort((a, b) => b[1] - a[1])[0];
  const topCategory = topCategoryEntry
    ? categories.find(c => c.id === topCategoryEntry[0])
    : undefined;
  const expenseCount = transactions.filter(t => t.status !== 'pending' && t.type === 'expense' && new Date(t.date).getMonth() + 1 === month && new Date(t.date).getFullYear() === year).length;
  const avgExpense = expenseCount > 0 ? summary.totalExpense / expenseCount : 0;
  const spendVariation = previousSummary.totalExpense > 0
    ? ((summary.totalExpense - previousSummary.totalExpense) / previousSummary.totalExpense) * 100
    : 0;

  const widgetElements: Record<DashboardWidgetId, React.ReactNode> = {
    health: (
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
    ),
    stats: (
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
    ),
    tithe: (
      <div className="card mb-16">
        <div className="section-header mb-8">
          <span className="section-title">Dízimos e Ofertas</span>
        </div>
        <div className="insight-grid" style={{ marginBottom: 12 }}>
          <div className="card" style={{ background: 'var(--bg-elevated)' }}>
            <div className="insight-kicker">Neste mês</div>
            <div className="insight-value">{formatCurrency(titheThisMonth)}</div>
            <div className="insight-sub">{titheTransactions.filter(tx => new Date(tx.date).getMonth() + 1 === month && new Date(tx.date).getFullYear() === year).length} lançamentos</div>
          </div>
          <div className="card" style={{ background: 'var(--bg-elevated)' }}>
            <div className="insight-kicker">Variação mensal</div>
            <div className={`insight-value ${titheVariation > 0 ? 'text-red' : 'text-green'}`}>{tithePreviousMonth > 0 ? `${titheVariation > 0 ? '+' : ''}${titheVariation.toFixed(0)}%` : 'N/A'}</div>
            <div className="insight-sub">Comparado ao mês anterior</div>
          </div>
          <div className="card" style={{ background: 'var(--bg-elevated)' }}>
            <div className="insight-kicker">Pendências</div>
            <div className="insight-value">{tithePendingCount}</div>
            <div className="insight-sub">Aguardando aprovação</div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-12 flex-wrap">
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{titheCategory?.icon ?? '⛪'} {titheCategory?.name ?? 'Dízimos e Ofertas'}</div>
            <div className="text-muted text-sm">Registre os valores entregues pela igreja e acompanhe o total com facilidade.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openTitheForm}>
            <Plus size={14} /> Lançar dízimo
          </button>
        </div>
      </div>
    ),
    insights: (
      <div className="insight-grid mb-16">
        <div className="card">
          <div className="section-title mb-8">Insight Principal</div>
          <div className="insight-kicker">Maior categoria</div>
          <div className="insight-value">{topCategory?.name ?? 'Sem dados'}</div>
          <div className="insight-sub">{topCategoryEntry ? formatCurrency(topCategoryEntry[1]) : 'Adicione transações para gerar insights'}</div>
        </div>
        <div className="card">
          <div className="section-title mb-8">Variação Mensal</div>
          <div className="insight-kicker">Despesas vs mês anterior</div>
          <div className={`insight-value ${spendVariation > 0 ? 'text-red' : 'text-green'}`}>{spendVariation > 0 ? '+' : ''}{spendVariation.toFixed(0)}%</div>
          <div className="insight-sub">{previousSummary.totalExpense > 0 ? `Baseado em ${formatCurrency(previousSummary.totalExpense)}` : 'Sem comparação anterior'}</div>
        </div>
        <div className="card">
          <div className="section-title mb-8">Média por Saída</div>
          <div className="insight-kicker">Ticket médio do mês</div>
          <div className="insight-value">{formatCurrency(avgExpense)}</div>
          <div className="insight-sub">{expenseCount} despesas registradas neste período</div>
        </div>
      </div>
    ),
    charts: (
      <div className="charts-grid mb-16">
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
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>Adicionar movimento</button>
            </div>
          )}
        </div>

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
              <Bar dataKey="Entradas" fill="#0071e3" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Saídas" fill="#ff3b30" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    ),
    recent: (
      <div className="card mb-16">
        <div className="section-header">
          <span className="section-title">Últimas Transações</span>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <div className="empty-title">Nenhuma transação</div>
            <div className="empty-desc">Clique em "Nova Transação" para começar</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>Nova transação</button>
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
    ),
    tips: (
      <div className="card mb-16">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Lightbulb size={16} style={{ color: 'var(--gold)' }} />
          <span className="section-title">Dicas Financeiras</span>
        </div>
        {tips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💡</div>
            <div className="empty-title">Sem dicas no momento</div>
            <div className="empty-desc">Registre mais transações para receber recomendações</div>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
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
        )}
      </div>
    ),
    budgets: (
      <div className="card mb-16">
        <div className="section-header mb-12">
          <span className="section-title">Orçamentos do Mês</span>
        </div>
        {budgets.filter(b => b.month === month && b.year === year).length > 0 ? (
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
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <div className="empty-title">Nenhum orçamento definido</div>
            <div className="empty-desc">Defina limites por categoria para controlar seus gastos</div>
          </div>
        )}
      </div>
    ),
  };

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
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Nova Transação
          </button>
        </div>
      </motion.div>

      {dashboardWidgets.filter(widget => widget.visible).map(widget => (
        <React.Fragment key={widget.id}>
          {widgetElements[widget.id]}
        </React.Fragment>
      ))}

      {dashboardWidgets.every(widget => !widget.visible) && (
        <div className="card mb-16">
          <div className="empty-state">
            <div className="empty-icon">🧩</div>
            <div className="empty-title">Seu dashboard está vazio</div>
            <div className="empty-desc">Ative os blocos do dashboard em Configurações para ver conteúdo aqui.</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>Adicionar movimento</button>
          </div>
        </div>
      )}

      {/* Transaction form */}
      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setFormPreset(null); }}
        preset={formPreset}
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
