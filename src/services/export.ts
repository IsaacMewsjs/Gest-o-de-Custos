import jsPDF from 'jspdf';
import Papa from 'papaparse';
import type { Transaction, Category, FamilyMember } from '../types';
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

export const exportPDF = (
  transactions: Transaction[],
  categories: Category[],
  members: FamilyMember[],
  title = 'Relatório Financeiro'
): void => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header
  doc.setFillColor(15, 17, 23);
  doc.rect(0, 0, 297, 30, 'F');
  doc.setTextColor(0, 212, 168);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);

  doc.setTextColor(180, 180, 200);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em ${formatDate(new Date().toISOString())}`, 14, 26);

  // Summary
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  doc.setTextColor(0, 212, 168);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Entradas: ${formatCurrency(totalIncome)}`, 14, 40);
  doc.setTextColor(255, 71, 87);
  doc.text(`Saídas: ${formatCurrency(totalExpense)}`, 80, 40);
  doc.setTextColor(74, 140, 255);
  doc.text(`Saldo: ${formatCurrency(totalIncome - totalExpense)}`, 160, 40);

  // Table header
  const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Membro'];
  const colWidths = [28, 20, 80, 40, 30, 35];
  let y = 52;
  let x = 14;

  doc.setFillColor(30, 34, 53);
  doc.rect(14, y - 6, 270, 10, 'F');
  doc.setTextColor(200, 200, 220);
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
      doc.setFillColor(26, 29, 39);
      doc.rect(14, y - 5, 270, 9, 'F');
    }

    x = 14;
    const catName = findCategory(categories, t.categoryId)?.name ?? '—';
    const memberName = findMember(members, t.memberId)?.name ?? '—';

    if (t.type === 'income') doc.setTextColor(0, 212, 168);
    else doc.setTextColor(255, 71, 87);
    doc.text(t.type === 'income' ? '↑' : '↓', x + colWidths[0], y);
    doc.setTextColor(200, 200, 220);

    const row = [
      formatDate(t.date),
      '',
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

  doc.save(`relatorio_${new Date().toISOString().slice(0, 10)}.pdf`);
};
