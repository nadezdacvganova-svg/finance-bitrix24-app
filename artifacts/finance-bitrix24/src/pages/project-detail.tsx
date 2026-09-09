import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, CalendarDays, CircleAlert, Plus, Trash2, TrendingDown, TrendingUp, UserRoundPlus, Users } from 'lucide-react';
import { useDeleteProjectMember, useDeleteTransaction, useGetProject, useListCategories, useListProjectMembers, useListTransactions, getGetProjectQueryKey, getListProjectMembersQueryKey, getListProjectsQueryKey, getListTransactionsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MemberDialog, TransactionDialog } from '@/components/forms';
import { PageHeading } from '@/components/layout';
import { EmptyState, ErrorState, formatDate, formatMoney, formatPercent, LoadingRows, TransactionRow } from '@/components/finance-ui';

export default function ProjectDetail() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const projectQuery = useGetProject(projectId, { query: { queryKey: getGetProjectQueryKey(projectId), enabled: Boolean(projectId) } });
  const categoriesQuery = useListCategories();
  const transactionsQuery = useListTransactions({ projectId });
  const membersQuery = useListProjectMembers(projectId, { query: { queryKey: getListProjectMembersQueryKey(projectId), enabled: Boolean(projectId) } });
  const deleteMutation = useDeleteTransaction();
  const deleteMemberMutation = useDeleteProjectMember();
  const project = projectQuery.data;
  const transactions = transactionsQuery.data ?? project?.transactions ?? [];
  const members = membersQuery.data ?? project?.members ?? [];
  const sortedTransactions = useMemo(() => [...transactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()), [transactions]);

  const deleteTransaction = (transactionId: number) => {
    if (!window.confirm('Удалить эту операцию? Данные о проекте пересчитаются.')) return;
    deleteMutation.mutate({ transactionId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey({ projectId }) });
      },
    });
  };

  const deleteMember = (memberId: number) => {
    if (!window.confirm('Убрать сотрудника из проекта?')) return;
    deleteMemberMutation.mutate(
      { projectId, memberId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        },
      },
    );
  };

  if (projectQuery.isLoading) return <div className="space-y-8"><div className="h-5 w-32 animate-pulse rounded bg-secondary" /><LoadingRows count={5} /></div>;
  if (projectQuery.isError || !project) return <ErrorState label="Проект не найден" onRetry={() => { void projectQuery.refetch(); }} />;

  return <div className="space-y-9">
    <div className="animate-in"><Link href="/" data-testid="link-back-dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Все проекты</Link></div>
    <PageHeading eyebrow={`Проект · создан ${formatDate(project.createdAt)}`} title={project.name} description="Финансовая картина проекта, собранная из фактических движений." actions={<Button data-testid="button-project-add-article" onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Добавить статью</Button>} />

    <section className="animate-in delay-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div data-testid="detail-stat-income" className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-xs text-muted-foreground">Доходы</p><p className="mt-4 font-mono text-2xl">{formatMoney(project.totalIncome)} ₽</p><div className="mt-4 flex items-center gap-2 text-xs text-[hsl(var(--chart-3))]"><TrendingUp className="h-3.5 w-3.5" />входящий поток</div></div>
      <div data-testid="detail-stat-expenses" className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-xs text-muted-foreground">Расходы</p><p className="mt-4 font-mono text-2xl">{formatMoney(project.totalExpenses)} ₽</p><div className="mt-4 flex items-center gap-2 text-xs text-[hsl(var(--chart-4))]"><TrendingDown className="h-3.5 w-3.5" />исходящий поток</div></div>
      <div data-testid="detail-stat-profit" className="rounded-2xl border border-primary/20 bg-primary p-5 text-primary-foreground shadow-md"><p className="text-xs text-primary-foreground/65">Чистая прибыль</p><p className="mt-4 font-mono text-2xl">{project.profit >= 0 ? '+' : '−'}{formatMoney(Math.abs(project.profit))} ₽</p><div className="mt-4 flex items-center gap-2 text-xs text-accent"><CircleAlert className="h-3.5 w-3.5" />итог проекта</div></div>
      <div data-testid="detail-stat-margin" className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-xs text-muted-foreground">Рентабельность</p><p className="mt-4 font-mono text-2xl">{formatPercent(project.profitability)}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, project.profitability))}%` }} /></div></div>
    </section>

    <section className="animate-in delay-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/35 text-primary"><Users className="h-5 w-5" /></div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Команда проекта</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Участники</h2>
            <p className="mt-1 text-sm text-muted-foreground">Сотрудники, которые работают с экономикой этого проекта.</p>
          </div>
        </div>
        <Button data-testid="button-add-project-member" variant="outline" size="sm" onClick={() => setMemberDialogOpen(true)}><UserRoundPlus className="mr-2 h-4 w-4" />Добавить сотрудника</Button>
      </div>
      {membersQuery.isLoading ? <div className="mt-6"><LoadingRows count={2} /></div> : members.length === 0 ? <EmptyState title="Команда пока не добавлена" description="Добавьте сотрудников, чтобы зафиксировать состав рабочей группы проекта." action={<Button data-testid="button-empty-add-project-member" onClick={() => setMemberDialogOpen(true)}>Добавить первого сотрудника</Button>} /> : <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{members.map((member) => <div data-testid={`row-project-member-${member.id}`} key={member.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 px-4 py-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{member.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><span className="min-w-0 flex-1 truncate text-sm font-semibold">{member.name}</span><button type="button" data-testid={`button-delete-project-member-${member.id}`} aria-label={`Убрать ${member.name}`} className="text-muted-foreground transition-colors hover:text-destructive" onClick={() => deleteMember(member.id)} disabled={deleteMemberMutation.isPending}><Trash2 className="h-4 w-4" /></button></div>)}</div>}
    </section>

    <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <div className="animate-in delay-2 rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Структура</p><h2 className="mt-2 font-serif text-2xl font-bold">Разбор результата</h2></div><CalendarDays className="h-5 w-5 text-muted-foreground" /></div><div className="mt-8 space-y-6"><div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Доходы</span><span className="font-mono">{formatMoney(project.totalIncome)} ₽</span></div><div className="mt-3 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-[hsl(var(--chart-3))]" style={{ width: '100%' }} /></div></div><div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Расходы</span><span className="font-mono">{formatMoney(project.totalExpenses)} ₽</span></div><div className="mt-3 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-[hsl(var(--chart-4))]" style={{ width: `${project.totalIncome ? Math.min(100, (project.totalExpenses / project.totalIncome) * 100) : 0}%` }} /></div></div><div className="border-t border-border pt-5"><p className="text-sm text-muted-foreground">На каждый рубль дохода</p><p data-testid="detail-expense-ratio" className="mt-2 font-mono text-2xl">{project.totalIncome ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(project.totalExpenses / project.totalIncome) : '0'} ₽ расходов</p></div></div></div>
      <div className="animate-in delay-3 rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Лента фактов</p><h2 className="mt-2 font-serif text-2xl font-bold">История операций</h2></div><span data-testid="text-transaction-count" className="font-mono text-xs text-muted-foreground">{sortedTransactions.length.toString().padStart(2, '0')} шт.</span></div>{transactionsQuery.isLoading ? <div className="mt-6"><LoadingRows count={4} /></div> : transactionsQuery.isError ? <div className="mt-6 flex items-center gap-3 rounded-xl bg-destructive/5 p-4 text-sm text-destructive"><CircleAlert className="h-4 w-4" />Не удалось загрузить историю.</div> : sortedTransactions.length === 0 ? <div className="mt-5"><EmptyState title="История пуста" description="Добавьте первую статью — доход или расход — чтобы зафиксировать экономику проекта." action={<Button data-testid="button-empty-add-article" onClick={() => setDialogOpen(true)}>Добавить статью</Button>} /></div> : <div className="mt-3">{sortedTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onDelete={() => deleteTransaction(transaction.id)} />)}</div>}</div>
    </section>
    <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} project={project} categories={categoriesQuery.data ?? []} />
    <MemberDialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen} project={project} />
  </div>;
}