import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORY_COLORS } from '../constants';
import Modal from '../components/ui/Modal';
import type { Category } from '../types';

const CATEGORY_ICONS = [
  '🍽️','🚗','🏠','💊','📚','🎮','👗','💡','📈','💸',
  '💼','💻','🎁','💰','➕','✈️','🎵','🏋️','🐕','🛒',
  '☕','🎬','🏥','🎓','🏦','🛁','🎂','🌿','⚡','🚿',
];

interface CategoriesProps {
  addToast: (t: any) => void;
}

const Categories: React.FC<CategoriesProps> = ({ addToast }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [form, setForm] = useState({
    name: '', icon: '💸', color: '#00d4a8', type: 'expense' as 'income' | 'expense' | 'both',
  });

  const filtered = categories.filter(c => filterType === 'all' || c.type === filterType || c.type === 'both');

  const openAdd = () => {
    setEditingCat(null);
    setForm({ name: '', icon: '💸', color: '#00d4a8', type: 'expense' });
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditingCat(c);
    setForm({ name: c.name, icon: c.icon, color: c.color, type: c.type as any });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingCat) {
      updateCategory(editingCat.id, { name: form.name, icon: form.icon, color: form.color, type: form.type });
      addToast({ type: 'success', title: 'Categoria atualizada!' });
    } else {
      addCategory({ name: form.name, icon: form.icon, color: form.color, type: form.type });
      addToast({ type: 'success', title: 'Categoria criada!' });
    }
    setShowForm(false);
    setEditingCat(null);
  };

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 style={{ marginBottom: 4 }}>Categorias</h1>
          <p className="text-muted text-sm">{categories.length} categorias cadastradas</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      {/* Filter */}
      <div className="filter-chips mb-16">
        {(['all', 'income', 'expense'] as const).map(t => (
          <button
            key={t}
            className={`chip ${t !== 'all' ? t : ''} ${filterType === t ? 'active' : ''}`}
            onClick={() => setFilterType(t)}
          >
            {t === 'all' ? 'Todas' : t === 'income' ? '↑ Receitas' : '↓ Despesas'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="section-grid stagger">
        {filtered.map((cat, i) => (
          <motion.div
            key={cat.id}
            className="card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}
          >
            {/* Icon */}
            <div
              style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${cat.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', flexShrink: 0,
                border: `1px solid ${cat.color}40`,
              }}
            >
              {cat.icon}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{cat.name}</div>
              <div className="flex gap-6 items-center">
                <span
                  className={`badge ${cat.type === 'income' ? 'badge-green' : cat.type === 'expense' ? 'badge-red' : 'badge-blue'}`}
                >
                  {cat.type === 'income' ? '↑ Receita' : cat.type === 'expense' ? '↓ Despesa' : '↕ Ambos'}
                </span>
                {cat.isDefault && <span className="badge badge-gray">Padrão</span>}
                <div className="color-dot" style={{ background: cat.color }} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button className="btn-icon" onClick={() => openEdit(cat)}>
                <Pencil size={14} />
              </button>
              {!cat.isDefault && (
                <button
                  className="btn-icon"
                  style={{ color: 'var(--red)' }}
                  onClick={() => setDeleteId(cat.id)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingCat ? 'Editar Categoria' : 'Nova Categoria'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editingCat ? 'Salvar' : 'Criar'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nome</label>
          <input
            className="form-input"
            type="text"
            placeholder="Ex: Alimentação, Lazer..."
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tipo</label>
          <div className="type-selector" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {(['expense', 'income', 'both'] as const).map(t => (
              <button
                key={t}
                type="button"
                className={`type-btn ${t === 'income' ? 'income' : t === 'expense' ? 'expense' : ''} ${form.type === t ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, type: t }))}
              >
                {t === 'income' ? '↑ Receita' : t === 'expense' ? '↓ Despesa' : '↕ Ambos'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ícone</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
            {CATEGORY_ICONS.map(icon => (
              <button
                key={icon}
                type="button"
                onClick={() => setForm(f => ({ ...f, icon }))}
                style={{
                  width: 38, height: 38, fontSize: '1.1rem',
                  borderRadius: 8,
                  border: `2px solid ${form.icon === icon ? 'var(--blue)' : 'var(--border)'}`,
                  background: form.icon === icon ? 'var(--blue-dim)' : 'var(--bg-input)',
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORY_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setForm(f => ({ ...f, color }))}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: color,
                  border: `3px solid ${form.color === color ? 'var(--text-primary)' : 'transparent'}`,
                  cursor: 'pointer', transition: 'border 0.15s',
                  outline: form.color === color ? `2px solid ${color}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-input)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `${form.color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem',
            border: `1px solid ${form.color}40`,
          }}>
            {form.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{form.name || 'Nome da Categoria'}</div>
            <div className="color-dot" style={{ background: form.color, display: 'inline-block', marginRight: 4 }} />
            <span className="text-xs text-muted" style={{ color: form.color }}>{form.color}</span>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Excluir Categoria"
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancelar</button>
            <button className="btn btn-red" onClick={() => {
              if (deleteId) deleteCategory(deleteId);
              setDeleteId(null);
              addToast({ type: 'success', title: 'Categoria excluída' });
            }}>Excluir</button>
          </>
        }
      >
        <p className="text-muted">Tem certeza? Transações com esta categoria não serão excluídas.</p>
      </Modal>
    </div>
  );
};

export default Categories;
