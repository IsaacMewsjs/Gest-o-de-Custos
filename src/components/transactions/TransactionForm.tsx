import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import type { Transaction, RecurrenceType } from '../../types';
import { formatDate } from '../../utils/calculations';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  onSuccess?: (msg: string) => void;
  preset?: {
    type?: 'income' | 'expense';
    categoryId?: string;
    description?: string;
    memberId?: string;
    recurrence?: RecurrenceType;
  } | null;
}

const EMPTY_FORM = {
  type: 'expense' as 'income' | 'expense',
  amount: '',
  categoryId: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  memberId: '',
  recurrence: 'none' as RecurrenceType,
  notes: '',
};

const toSafeIsoDate = (dateValue: string): string => {
  return new Date(`${dateValue}T12:00:00.000Z`).toISOString();
};

const TransactionForm: React.FC<TransactionFormProps> = ({
  open, onClose, editingTransaction, onSuccess, preset,
}) => {
  const { categories, members, settings, addTransaction, updateTransaction } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingTransaction) {
      setForm({
        type: editingTransaction.type,
        amount: editingTransaction.amount.toString(),
        categoryId: editingTransaction.categoryId,
        description: editingTransaction.description,
        date: editingTransaction.date.slice(0, 10),
        memberId: editingTransaction.memberId,
        recurrence: editingTransaction.recurrence,
        notes: editingTransaction.notes ?? '',
      });
    } else {
      setForm({
        ...EMPTY_FORM,
        type: preset?.type ?? EMPTY_FORM.type,
        categoryId: preset?.categoryId ?? EMPTY_FORM.categoryId,
        description: preset?.description ?? EMPTY_FORM.description,
        memberId: preset?.memberId ?? settings.activeMemberId,
        recurrence: preset?.recurrence ?? EMPTY_FORM.recurrence,
      });
    }
    setErrors({});
  }, [editingTransaction, open, settings.activeMemberId, preset]);

  const filteredCategories = categories.filter(
    c => c.type === form.type || c.type === 'both'
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Informe um valor válido';
    if (!form.categoryId) e.categoryId = 'Selecione uma categoria';
    if (!form.description.trim()) e.description = 'Informe uma descrição';
    if (!form.date) e.date = 'Informe a data';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      type: form.type,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId,
      description: form.description.trim(),
      date: toSafeIsoDate(form.date),
      memberId: form.memberId || settings.activeMemberId,
      recurrence: form.recurrence,
      notes: form.notes.trim() || undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, data);
      onSuccess?.('Transação atualizada com sucesso!');
    } else {
      addTransaction(data);
      onSuccess?.('Transação adicionada!');
    }
    onClose();
  };

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTransaction ? 'Editar Transação' : 'Nova Transação'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className={`btn ${form.type === 'income' ? 'btn-primary' : 'btn-red'}`}
            onClick={handleSubmit}
          >
            {editingTransaction ? 'Salvar' : 'Adicionar'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
        {/* Type Selector */}
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <div className="type-selector">
            <button
              type="button"
              className={`type-btn income ${form.type === 'income' ? 'active' : ''}`}
              onClick={() => { set('type', 'income'); set('categoryId', ''); }}
            >
              ↑ Entrada
            </button>
            <button
              type="button"
              className={`type-btn expense ${form.type === 'expense' ? 'active' : ''}`}
              onClick={() => { set('type', 'expense'); set('categoryId', ''); }}
            >
              ↓ Saída
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">Valor (R$)</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
          />
          {errors.amount && <span className="text-red text-xs">{errors.amount}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Descrição</label>
          <input
            className="form-input"
            type="text"
            placeholder="Ex: Almoço, Salário, Conta de luz..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
          {errors.description && <span className="text-red text-xs">{errors.description}</span>}
        </div>

        {/* Category + Date */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select
              className="form-select"
              value={form.categoryId}
              onChange={e => set('categoryId', e.target.value)}
            >
              <option value="">Selecionar...</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {errors.categoryId && <span className="text-red text-xs">{errors.categoryId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Data</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
            />
            {errors.date && <span className="text-red text-xs">{errors.date}</span>}
          </div>
        </div>

        {/* Member */}
        {members.length > 1 && (
          <div className="form-group">
            <label className="form-label">Membro Responsável</label>
            <select
              className="form-select"
              value={form.memberId}
              onChange={e => set('memberId', e.target.value)}
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Recurrence */}
        <div className="form-group">
          <label className="form-label">Recorrência</label>
          <select
            className="form-select"
            value={form.recurrence}
            onChange={e => set('recurrence', e.target.value as any)}
          >
            <option value="none">Nenhuma (único)</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
            <option value="yearly">Anual</option>
          </select>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Observações (opcional)</label>
          <textarea
            className="form-textarea"
            placeholder="Notas adicionais..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};

export default TransactionForm;
