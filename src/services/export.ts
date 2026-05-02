import jsPDF from 'jspdf';
import Papa from 'papaparse';
import type { Transaction, Category, FamilyMember, AuditLog } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';

const findCategory = (categories: Category[], id: string) =>
  categories.find(c => c.id === id);

const findMember = (members: FamilyMember[], id: string) =>
  members.find(m => m.id === id);

export const exportCSV = (
  transactions: Transaction[],
  categories: Category[],
  members: FamilyMember[]
): void => {
  const rows = transactions.map(t => ({
    Data: formatDate(t.date),
    Tipo: t.type === 'income' ? 'Entrada' : 'Saída',
    Status: t.status ?? 'approved',
    Descrição: t.description,
    Categoria: findCategory(categories, t.categoryId)?.name ?? '—',
    Valor: t.amount.toFixed(2),
    Membro: findMember(members, t.memberId)?.name ?? '—',
    Notas: t.notes ?? '',
  }));

  const csv = Papa.unparse(rows, { delimiter: ';' });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportAuditCSV = (logs: AuditLog[]): void => {
  const rows = logs.map(log => ({
    Data: formatDate(log.createdAt, 'dd/MM/yyyy HH:mm'),
    Ação: log.action,
    Entidade: log.entityType,
    Título: log.title,
    Mensagem: log.message,
    Autor: log.actorName,
    Perfil: log.actorRole,
  }));

  const csv = Papa.unparse(rows, { delimiter: ';' });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportPDF = (
  transactions: Transaction[],
  categories: Category[],
  members: FamilyMember[],
  title = 'Relatório Financeiro',
  auditLogs: AuditLog[] = []
): void => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header
  doc.setFillColor(245, 245, 247);
  doc.rect(0, 0, 297, 30, 'F');
  doc.setTextColor(0, 113, 227);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);

  doc.setTextColor(110, 110, 115);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em ${formatDate(new Date().toISOString())}`, 14, 26);

  // Summary
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  doc.setTextColor(52, 199, 89);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Entradas: ${formatCurrency(totalIncome)}`, 14, 40);
  doc.setTextColor(255, 59, 48);
  doc.text(`Saídas: ${formatCurrency(totalExpense)}`, 80, 40);
  doc.setTextColor(0, 113, 227);
  doc.text(`Saldo: ${formatCurrency(totalIncome - totalExpense)}`, 160, 40);

  // Table header
  const headers = ['Data', 'Tipo', 'Status', 'Descrição', 'Categoria', 'Valor', 'Membro'];
  const colWidths = [28, 20, 22, 62, 34, 26, 35];
  let y = 52;
  let x = 14;

  doc.setFillColor(228, 228, 230);
  doc.rect(14, y - 6, 270, 10, 'F');
  doc.setTextColor(28, 28, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });

  y += 6;
  doc.setFont('helvetica', 'normal');

  transactions.slice(0, 40).forEach((t, idx) => {
    if (y > 190) {
      doc.addPage();
      y = 20;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(14, y - 5, 270, 9, 'F');
    }

    x = 14;
    const catName = findCategory(categories, t.categoryId)?.name ?? '—';
    const memberName = findMember(members, t.memberId)?.name ?? '—';

    if (t.type === 'income') doc.setTextColor(52, 199, 89);
    else doc.setTextColor(255, 59, 48);
    doc.text(t.type === 'income' ? '↑' : '↓', x + colWidths[0], y);
    doc.setTextColor(28, 28, 30);

    const row = [
      formatDate(t.date),
      '',
      t.status ?? 'aprovado',
      t.description.slice(0, 40),
      catName.slice(0, 20),
      formatCurrency(t.amount),
      memberName,
    ];

    row.forEach((val, i) => {
      if (i !== 1) doc.text(val, x, y);
      x += colWidths[i];
    });

    y += 9;
  });

  if (auditLogs.length > 0) {
    doc.addPage();
    doc.setTextColor(28, 28, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Auditoria recente', 14, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    let auditY = 26;
    auditLogs.slice(0, 18).forEach((log, index) => {
      if (auditY > 185) {
        doc.addPage();
        auditY = 18;
      }
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(12, auditY - 4, 272, 10, 'F');
      }
      doc.setTextColor(0, 113, 227);
      doc.text(formatDate(log.createdAt, 'dd/MM HH:mm'), 14, auditY);
      doc.setTextColor(28, 28, 30);
      doc.text(`${log.title} - ${log.message}`.slice(0, 92), 40, auditY);
      doc.setTextColor(110, 110, 115);
      doc.text(`${log.actorName} (${log.actorRole})`, 220, auditY);
      auditY += 10;
    });
  }

  doc.save(`relatorio_${new Date().toISOString().slice(0, 10)}.pdf`);
};
