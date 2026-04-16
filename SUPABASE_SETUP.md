# Supabase Backend Setup Guide

## 📋 Configuração Supabase - Igreja App

Você já tem:
✅ Conta Supabase criada  
✅ Variáveis de ambiente configuradas (.env.local)  
✅ Cliente Supabase instalado  
✅ Autenticação Supabase integrada  
✅ Serviços de banco de dados criados  

---

## 🚀 Próximas Etapas

### 1. Criar as Tabelas do Banco de Dados

1. Acesse seu painel Supabase: https://app.supabase.com
2. Vá para **SQL Editor** (no menu esquerdo)
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `database_schema.sql` do seu projeto
5. Cole no SQL Editor do Supabase
6. Clique em **Run** para executar todos os comandos

**O que será criado:**
- `users` - Perfis de usuários
- `family_groups` - Grupos familiares
- `family_members` - Membros de grupos
- `categories` - Categorias de transações
- `transactions` - Transações financeiras
- `budgets` - Orçamentos
- `goals` - Metas financeiras
- `notifications` - Notificações

### 2. Configurar Autenticação no Supabase

1. Vá para **Authentication** > **Providers**
2. Ative "Email" (deve estar habilitado por padrão)
3. Vá para **Authentication** > **Email Templates**
4. Customize as templates se desejar

### 3. Configurar RLS (Row Level Security)

As policies de segurança já estão incluídas no SQL. Elas garantem que:
- Usuários só veem seus próprios dados
- Membros de um grupo veem apenas dados do grupo
- Dados são compartilhados apenas entre membros autorizados

Para verificar:
1. Vá para **Authentication** > **Policies** em cada tabela
2. Confirme que as policies estão aplicadas

---

## 📁 Arquivos Criados

### `src/services/supabase.ts`
Cliente Supabase configurado com suas credenciais

### `src/services/database.ts`
Serviços de CRUD para todas as tabelas:
- `transactionsService` - Gerenciar transações
- `categoriesService` - Gerenciar categorias
- `budgetsService` - Gerenciar orçamentos
- `goalsService` - Gerenciar metas
- `familyMembersService` - Gerenciar membros
- `familyGroupsService` - Gerenciar grupos
- `usersService` - Gerenciar perfis
- `notificationsService` - Gerenciar notificações

### `src/context/AuthContext.tsx` (ATUALIZADO)
- Autenticação real com Supabase
- Funções: `login()`, `signup()`, `logout()`
- Carrega estado de autenticação automaticamente

### `src/pages/Auth.tsx` (ATUALIZADO)
- Login e signup com validação
- Tratamento de erros real
- State de carregamento

---

## 🔌 Como Usar os Serviços

### Exemplo: Buscar Transações

```typescript
import { transactionsService } from '../services/database';
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { userId } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await transactionsService.getTransactions(familyGroupId);
        setTransactions(data);
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
      }
    };
    loadTransactions();
  }, [familyGroupId]);

  return <div>{/* render transactions */}</div>;
};
```

### Exemplo: Criar uma Transação

```typescript
const newTransaction = {
  family_group_id: 'group-id',
  category_id: 'category-id',
  user_id: userId,
  description: 'Compra no supermercado',
  amount: 150.00,
  type: 'expense',
  date: new Date().toISOString().split('T')[0],
  notes: 'Alimentos'
};

await transactionsService.createTransaction(newTransaction);
```

---

## ✨ Próximas Integrações Necessárias

1. **AppContext** - Integrar com Supabase para sincronizar dados
2. **Dashboard** - Buscar dados reais do Supabase
3. **Transactions** - CRUD de transações
4. **Categories** - CRUD de categorias
5. **Budgets** - CRUD de orçamentos
6. **Goals** - CRUD de metas
7. **Family** - Gerenciar membros e grupos

---

## 🆘 Troubleshooting

### "Missing Supabase credentials"
- Verifique se `.env.local` existe e tem os valores corretos
- Reinicie o servidor dev

### Erro de autenticação
- Confirme que as credenciais no `.env.local` estão corretas
- Verifique se a autenticação email está habilitada no Supabase

### Erro de RLS Policy
- Garanta que você está logado quando fazendo requisições
- Confirme que as policies foram criadas no SQL

### Erro de CORS
- Isso não deve acontecer, mas se acontecer, vá para Supabase > Settings > API
- Adicione `localhost:5173` (ou sua porta de dev) em "Allowed Client IPs"

---

## 📝 Ambiente de Desenvolvimento

Seu `.env.local` está configurado com:
- `VITE_SUPABASE_URL` - URL do seu projeto
- `VITE_SUPABASE_ANON_KEY` - Chave pública

Para produção, use variáveis de ambiente diferentes e mais seguras.

---

## ✅ Checklist Final

- [ ] Tabelas criadas no Supabase (execute o SQL)
- [ ] RLS policies aplicadas
- [ ] Teste login/signup na página de Auth
- [ ] Verificar se dados estão salvando no Supabase
- [ ] Integrar AppContext com dados do Supabase
- [ ] Testar CRUD completo

---

Pronto! Seu backend Supabase está preparado. Qualquer dúvida, avise! 🚀
