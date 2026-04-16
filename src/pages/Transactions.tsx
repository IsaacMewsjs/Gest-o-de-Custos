import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pencil, Trash2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/calculations';
import TransactionForm from '../components/transactions/TransactionForm';
import Modal from '../components/ui/Modal';
import type { Transaction } from '../types';
import type { Toast } from '../components/ui/Toast';

interface TransactionsProps {
  addToast: (t: Omit<Toast, 'id'>) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ addToast }) => {
  const { transactions, categories, members, deleteTransaction, settings } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCat, setFilterCat] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (filterCat) list = list.filter(t => t.categoryId === filterCat);
    if (filterMember) list = list.filter(t => t.memberId === filterMember);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.description.toLowerCase().includes(q) ||
        categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) =>
      sortBy === 'date'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : b.amount - a.amount
    );
    return list;
  }, [transactions, filterType, filterCat, filterMember, search, sortBy, categories]);

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId);
      setDeleteId(null);
      addToast({ type: 'success', title: 'Transação removida' });
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 style={{ marginBottom: 4 }}>Transações</h1>
          <p className="text-muted text-sm">{filtered.length} transações encontradas</p>
        </div>
        <button className="btn btn-green" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> Nova
        </button>
      </div>

      {/* Summary mini cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <MiniCard label="Entradas" value={formatCurrency(totalIncome)} color="green" />
        <MiniCard label="Saídas" value={formatCurrency(totalExpense)} color="red" />
        <MiniCard
          label="Saldo Filtrado"
          value={formatCurrency(totalIncome - totalExpense)}
          color={totalIncome - totalExpense >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            className="form-input search-input"
            placeholder="Buscar por descrição ou categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          {(['all', 'income', 'expense'] as const).map(type => (
            <button
              key={type}
              className={`chip ${type !== 'all' ? type : ''} ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'Todos' : type === 'income' ? '↑ Entradas' : '↓ Saídas'}
            </button>
          ))}
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 140 }}
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value="">Categoria</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        {members.length > 1 && (
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 120 }}
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
          >
            <option value="">Membro</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
            ))}
          </select>
        )}

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 120 }}
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
        >
          <option value="date">Mais recentes</option>
          <option value="amount">Maior valor</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <div className="empty-title">Nenhuma transação encontrada</div>
            <div className="empty-desc">Tente ajustar os filtros ou adicione uma nova transação</div>
          </div>
        </div>
      ) : (
        <div className="card">
          <AnimatePresence>
            {filtered.map((tx, i) => {
              const cat = categories.find(c => c.id === tx.categoryId);
              const member = members.find(m => m.id === tx.memberId);
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  style={{ marginBottom: i < filtered.length - 1 ? 8 : 0 }}
                >
                  <div className="transaction-item">
                    <div
                      className="tx-category-icon"
                      style={{ background: cat?.color ? `${cat.color}25` : 'var(--bg-input)' }}
                    >
                      {cat?.icon ?? '💸'}
                    </div>
                    <div className="tx-info">
                      <div className="tx-desc">{tx.description}</div>
                      <div className="tx-meta">
                        <span
                          className="cat-pill"
                          style={{
                            background: cat?.color ? `${cat.color}20` : 'var(--bg-input)',
                            color: cat?.color ?? 'var(--text-muted)',
                          }}
                        >
                          {cat?.name ?? '—'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                        {member && <><span>•</span><span>{member.avatar} {member.name}</span></>}
                        {tx.recurrence !== 'none' && (
                          <><span>•</span><span className="badge badge-blue">{tx.recurrence}</span></>
                        )}
                      </div>
                    </div>
                    <div className={`tx-amount ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                    <div className="tx-actions">
                      <button
                        className="btn-icon"
                        onClick={() => { setEditing(tx); setShowForm(true); }}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--red)' }}
                        onClick={() => setDeleteId(tx.id)}
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Form */}
      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        editingTransaction={editing}
        onSuccess={(msg) => addToast({ type: 'success', title: msg })}
      />

      {/* Delete Confirm */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirmar Exclusão"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancelar</button>
            <button className="btn btn-red" onClick={handleDelete}>Excluir</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
};

const MiniCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 16px',
  }}>
    <div className="text-muted text-xs" style={{ marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: `var(--${color})` }}>{value}</div>
  </div>
);

export default Transactions;
