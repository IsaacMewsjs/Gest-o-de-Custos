import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { Download, FileText, ArrowLeftRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, calcMonthSummary, formatMonthYear,
  getMonthTransactions, getLast6Months, capitalize
} from '../utils/calculations';
import { exportCSV, exportPDF } from '../services/export';

const chartFmt = (val: any, name: any): any =>
  [formatCurrency(typeof val === 'number' ? val : 0), name];


const Reports: React.FC = () => {
  const { transactions, categories, members } = useApp();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [compareMonth, setCompareMonth] = useState(month === 1 ? 12 : month - 1);
  const [compareYear, setCompareYear] = useState(month === 1 ? year - 1 : year);
  const [showCompare, setShowCompare] = useState(false);

  const summary = calcMonthSummary(transactions, month, year);
  const compareSummary = calcMonthSummary(transactions, compareMonth, compareYear);
  const monthTx = getMonthTransactions(transactions, month, year);

  // Category breakdown
  const catData = Object.entries(summary.byCategory)
    .map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      return { name: cat?.name ?? '?', value: amount, color: cat?.color ?? '#636e72' };
    })
    .sort((a, b) => b.value - a.value);

  // Bar data for last 6 months
  const last6 = getLast6Months();
  const trendData = last6.map(({ month: m, year: y }) => {
    const s = calcMonthSummary(transactions, m, y);
    return {
      name: capitalize(formatMonthYear(m, y).slice(0, 3)),
      Entradas: s.totalIncome,
      Saídas: s.totalExpense,
      Saldo: s.totalIncome - s.totalExpense,
    };
  });

  // Compare bar
  const compareData = [
    {
      name: 'Entradas',
      [formatMonthYear(month, year).slice(0, 3)]: summary.totalIncome,
      [formatMonthYear(compareMonth, compareYear).slice(0, 3)]: compareSummary.totalIncome,
    },
    {
      name: 'Saídas',
      [formatMonthYear(month, year).slice(0, 3)]: summary.totalExpense,
      [formatMonthYear(compareMonth, compareYear).slice(0, 3)]: compareSummary.totalExpense,
    },
  ];

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: capitalize(formatMonthYear(i + 1, year)),
  }));

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between mb-24">
        <h1>Relatórios</h1>
        <div className="flex gap-8">
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
          >
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {[year - 1, year, year + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowCompare(!showCompare)}
          >
            <ArrowLeftRight size={14} />
            Comparar
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => exportCSV(monthTx, categories, members)}
          >
            <Download size={14} /> CSV
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => exportPDF(
              monthTx, categories, members,
              `Relatório — ${capitalize(formatMonthYear(month, year))}`
            )}
          >
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Receitas', value: formatCurrency(summary.totalIncome), color: 'green' },
          { label: 'Despesas', value: formatCurrency(summary.totalExpense), color: 'red' },
          { label: 'Saldo', value: formatCurrency(summary.balance), color: summary.balance >= 0 ? 'blue' : 'red' },
          { label: 'Transações', value: `${monthTx.length}`, color: 'purple' },
        ].map(c => (
          <div key={c.label} className="card" style={{ textAlign: 'center' }}>
            <div className="stat-label">{c.label}</div>
            <div className={`stat-value ${c.color}`} style={{ marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-grid mb-16">
        {/* Pie */}
        <div className="card">
          <div className="section-title mb-12">Distribuição de Gastos</div>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={catData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={chartFmt}
                  contentStyle={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-primary)',
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <div className="empty-title">Sem dados para o período</div>
            </div>
          )}
        </div>

        {/* Trend */}
        <div className="card">
          <div className="section-title mb-12">Tendência (6 meses)</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={48} />
              <Tooltip
                formatter={chartFmt}
                contentStyle={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, fontSize: '0.8rem', color: 'var(--text-primary)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Line type="monotone" dataKey="Entradas" stroke="#00d4a8" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Saídas"   stroke="#ff4757" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Saldo"    stroke="#4e8cff" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compare */}
      {showCompare && (
        <div className="card mb-16">
          <div className="flex items-center justify-between mb-16">
            <div className="section-title">Comparação de Meses</div>
            <div className="flex gap-8">
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={compareMonth}
                onChange={e => setCompareMonth(Number(e.target.value))}
              >
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={compareYear}
                onChange={e => setCompareYear(Number(e.target.value))}
              >
                {[year - 1, year].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Mês selecionado', s: summary, month, year },
              { label: 'Mês comparado', s: compareSummary, month: compareMonth, year: compareYear },
            ].map(({ label, s, month: m, year: y }) => (
              <div key={label} className="card" style={{ textAlign: 'center', boxShadow: 'none' }}>
                <div className="text-muted text-xs mb-8" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  {label} — {capitalize(formatMonthYear(m, y))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div><div className="text-xs text-muted">Entradas</div><div className="text-green font-bold">{formatCurrency(s.totalIncome)}</div></div>
                  <div><div className="text-xs text-muted">Saídas</div><div className="text-red font-bold">{formatCurrency(s.totalExpense)}</div></div>
                  <div><div className="text-xs text-muted">Saldo</div><div className="text-blue font-bold">{formatCurrency(s.balance)}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown table */}
      {catData.length > 0 && (
        <div className="card mb-16">
          <div className="section-title mb-16">Detalhamento por Categoria</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {catData.map(c => {
              const pct = summary.totalExpense > 0 ? (c.value / summary.totalExpense) * 100 : 0;
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-8">
                      <div className="color-dot" style={{ background: c.color }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.name}</span>
                    </div>
                    <div className="flex gap-12 items-center">
                      <span className="text-muted text-xs">{pct.toFixed(1)}%</span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatCurrency(c.value)}</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, background: c.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction table */}
      {monthTx.length > 0 && (
        <div className="card">
          <div className="section-title mb-16">Todas as Transações do Período</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Descrição', 'Categoria', 'Membro', 'Valor'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...monthTx]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(tx => {
                    const cat = categories.find(c => c.id === tx.categoryId);
                    const member = members.find(m => m.id === tx.memberId);
                    return (
                      <tr
                        key={tx.id}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{tx.description}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            className="cat-pill"
                            style={{
                              background: cat?.color ? `${cat.color}20` : 'var(--bg-input)',
                              color: cat?.color ?? 'var(--text-muted)',
                            }}
                          >
                            {cat?.icon} {cat?.name ?? '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {member?.avatar} {member?.name ?? '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>
                          <span style={{ color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
