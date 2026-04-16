import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Check, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, calcMonthSummary, formatMonthYear, capitalize } from '../utils/calculations';
import { MEMBER_AVATARS } from '../constants';
import Modal from '../components/ui/Modal';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import type { FamilyMember } from '../types';

const chartFmt = (val: any, name: any): any =>
  [formatCurrency(typeof val === 'number' ? val : 0), name];

interface FamilyProps {
  addToast: (t: any) => void;
}

const Family: React.FC<FamilyProps> = ({ addToast }) => {
  const { members, transactions, categories, settings, addMember, updateMember, deleteMember, updateSettings } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', avatar: '😊', role: 'member' as 'admin' | 'member' });
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const openAdd = () => {
    setEditingMember(null);
    setForm({ name: '', avatar: '😊', role: 'member' });
    setShowForm(true);
  };

  const openEdit = (m: FamilyMember) => {
    setEditingMember(m);
    setForm({ name: m.name, avatar: m.avatar, role: m.role });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingMember) {
      updateMember(editingMember.id, { name: form.name, avatar: form.avatar, role: form.role });
      addToast({ type: 'success', title: 'Membro atualizado!' });
    } else {
      addMember({ name: form.name, avatar: form.avatar, role: form.role });
      addToast({ type: 'success', title: 'Membro adicionado à família!' });
    }
    setShowForm(false);
  };

  // Member spending analysis
  const memberSpending = members.map(m => {
    const mTx = transactions.filter(t => t.memberId === m.id);
    const mSummary = calcMonthSummary(mTx, month, year);
    return { ...m, summary: mSummary, txCount: mTx.length };
  });

  // Filtered transactions
  const filteredTx = selectedMemberId === 'all'
    ? transactions
    : transactions.filter(t => t.memberId === selectedMemberId);

  const recent = [...filteredTx]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Pie chart by member
  const pieData = memberSpending
    .filter(m => m.summary.totalExpense > 0)
    .map((m, i) => ({
      name: `${m.avatar} ${m.name}`,
      value: m.summary.totalExpense,
      color: ['#00d4a8', '#4e8cff', '#a29bfe', '#ff6b6b', '#ffd32a', '#fd79a8'][i % 6],
    }));

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 style={{ marginBottom: 4 }}>Modo Família</h1>
          <p className="text-muted text-sm">{members.length} membro(s) cadastrado(s)</p>
        </div>
        {members.length < 6 && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Adicionar Membro
          </button>
        )}
      </div>

      {/* Member cards */}
      <div className="section-grid mb-24 stagger">
        {memberSpending.map(member => (
          <motion.div
            key={member.id}
            className={`member-card ${settings.activeMemberId === member.id ? 'active' : ''}`}
            whileHover={{ scale: 1.02 }}
          >
            {/* Active indicator */}
            {settings.activeMemberId === member.id && (
              <div
                style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'var(--green)', borderRadius: '50%',
                  width: 20, height: 20, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Check size={12} color="white" />
              </div>
            )}

            <div className="member-avatar" style={{ fontSize: '2rem' }}>{member.avatar}</div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{member.name}</div>
              <span className={`badge ${member.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                {member.role === 'admin' ? '👑 Admin' : '👤 Membro'}
              </span>
            </div>

            <div style={{
              width: '100%',
              background: 'var(--bg-input)',
              borderRadius: 10,
              padding: '10px 12px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              textAlign: 'center',
            }}>
              <div>
                <div className="text-xs text-muted">Entradas</div>
                <div className="text-green font-bold text-sm">{formatCurrency(member.summary.totalIncome)}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Saídas</div>
                <div className="text-red font-bold text-sm">{formatCurrency(member.summary.totalExpense)}</div>
              </div>
            </div>

            <div className="text-xs text-muted">{member.txCount} transações no total</div>

            <div className="flex gap-8" style={{ width: '100%' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ flex: 1 }}
                onClick={() => updateSettings({ activeMemberId: member.id })}
                disabled={settings.activeMemberId === member.id}
              >
                <UserCheck size={13} />
                {settings.activeMemberId === member.id ? 'Ativo' : 'Ativar'}
              </button>
              <button className="btn-icon" onClick={() => openEdit(member)}>
                <Pencil size={14} />
              </button>
              {members.length > 1 && (
                <button
                  className="btn-icon"
                  style={{ color: 'var(--red)' }}
                  onClick={() => setDeleteId(member.id)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + history */}
      <div className="charts-grid mb-16">
        {/* Pie */}
        <div className="card">
          <div className="section-title mb-12">
            Gastos por Membro — {capitalize(formatMonthYear(month, year))}
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
              <div className="empty-title">Sem gastos no mês</div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="card">
          <div className="flex items-center justify-between mb-12">
            <span className="section-title">Histórico de Transações</span>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={selectedMemberId}
              onChange={e => setSelectedMemberId(e.target.value)}
            >
              <option value="all">Todos</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
              ))}
            </select>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <div className="empty-title">Nenhuma transação</div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {recent.map(tx => {
                const cat = categories.find(c => c.id === tx.categoryId);
                const member = members.find(m => m.id === tx.memberId);
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
                        <span>{member?.avatar} {member?.name}</span>
                        <span>•</span>
                        <span>{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className={`tx-amount ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Member Form */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingMember ? 'Editar Membro' : 'Adicionar Membro'}
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editingMember ? 'Salvar' : 'Adicionar'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nome</label>
          <input
            className="form-input"
            type="text"
            placeholder="Nome do membro"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Avatar</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {MEMBER_AVATARS.map(avatar => (
              <button
                key={avatar}
                type="button"
                onClick={() => setForm(f => ({ ...f, avatar }))}
                style={{
                  width: 42, height: 42, fontSize: '1.4rem',
                  borderRadius: 10,
                  border: `2px solid ${form.avatar === avatar ? 'var(--blue)' : 'var(--border)'}`,
                  background: form.avatar === avatar ? 'var(--blue-dim)' : 'var(--bg-input)',
                  cursor: 'pointer',
                }}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Função</label>
          <select
            className="form-select"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
          >
            <option value="admin">👑 Administrador</option>
            <option value="member">👤 Membro</option>
          </select>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Remover Membro"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancelar</button>
            <button className="btn btn-red" onClick={() => {
              if (deleteId) {
                deleteMember(deleteId);
                setDeleteId(null);
                addToast({ type: 'success', title: 'Membro removido' });
              }
            }}>Remover</button>
          </>
        }
      >
        <p className="text-muted">Tem certeza que deseja remover este membro? As transações dele serão mantidas.</p>
      </Modal>
    </div>
  );
};

export default Family;
