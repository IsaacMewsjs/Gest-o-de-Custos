import type { FinancialTip, Transaction, Category } from '../types';
import { calcMonthSummary } from '../utils/calculations';

export const generateTips = (
  transactions: Transaction[],
  categories: Category[]
): FinancialTip[] => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const summary = calcMonthSummary(transactions, month, year);
  const tips: FinancialTip[] = [];

  // Tip 1: Savings rate
  if (summary.totalIncome > 0) {
    const savingsRate = ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100;
    if (savingsRate >= 20) {
      tips.push({
        id: 'tip-savings-good',
        title: 'Parabéns! 🎉',
        message: `Você está economizando ${savingsRate.toFixed(0)}% da sua renda este mês. Continue assim!`,
        type: 'goal',
        icon: '🏆',
      });
    } else if (savingsRate >= 0) {
      tips.push({
        id: 'tip-savings-ok',
        title: 'Dica de Economia',
        message: `Tente economizar pelo menos 20% da renda. Você está em ${savingsRate.toFixed(0)}%. Reduza os gastos variáveis!`,
        type: 'saving',
        icon: '💡',
      });
    } else {
      tips.push({
        id: 'tip-overspending',
        title: 'Atenção: Gastos Altos!',
        message: `Suas despesas estão superando a renda este mês. Revise os gastos de lazer e alimentação.`,
        type: 'warning',
        icon: '⚠️',
      });
    }
  }

  // Tip 2: Highest expense category
  const entries = Object.entries(summary.byCategory);
  if (entries.length > 0) {
    const [topCatId, topAmount] = entries.sort((a, b) => b[1] - a[1])[0];
    const cat = categories.find(c => c.id === topCatId);
    if (cat) {
      tips.push({
        id: 'tip-top-category',
        title: `Maior Gasto: ${cat.name}`,
        message: `R$ ${topAmount.toFixed(2)} gastos em ${cat.name} este mês. Analise se todos os gastos são necessários.`,
        type: 'info',
        icon: cat.icon,
      });
    }
  }

  // Tip 3: General
  const generalTips: FinancialTip[] = [
    {
      id: 'tip-rule-50-30-20',
      title: 'Regra 50-30-20',
      message: '50% para necessidades, 30% para desejos e 20% para poupança. Uma fórmula simples para equilibrar suas finanças!',
      type: 'info',
      icon: '📊',
    },
    {
      id: 'tip-emergency-fund',
      title: 'Reserva de Emergência',
      message: 'Mantenha de 3 a 6 meses de despesas guardados. Isso te protege de imprevistos!',
      type: 'saving',
      icon: '🛡️',
    },
    {
      id: 'tip-automate-savings',
      title: 'Automatize Sua Poupança',
      message: 'Configure uma transferência automática para poupança no dia do salário. Poupe antes de gastar!',
      type: 'goal',
      icon: '🤖',
    },
  ];

  if (generalTips.length > 0) {
    const idx = now.getDate() % generalTips.length;
    tips.push(generalTips[idx]);
  }

  return tips.slice(0, 3);
};
