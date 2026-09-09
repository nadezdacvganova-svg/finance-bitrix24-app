import { Link } from 'wouter';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, CircleAlert, MoreHorizontal, Trash2 } from 'lucide-react';
import type { Project, Transaction } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const formatMoney = (value: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
export const formatDate = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(new Date(value)).replace('.', '');
export const formatPercent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`;

export function ErrorState({ onRetry, label = 'Не удалось загрузить данные' }: { onRetry: () => void; label?: string }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center"><CircleAlert className="h-8 w-8 text-destructive" /><p className="mt-4 font-semibold">{label}</p><p className="mt-1 text-sm text-muted-foreground">Проверьте соединение и попробуйте ещё раз.</p><Button data-testid="button-retry" variant="outline" className="mt-5" onClick={onRetry}>Повторить</Button></div>;
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-3" data-testid="loading-skeleton">{Array.from({ length: count }).map((_, index) => <div key={index} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/60 p-4"><Skeleton className="h-10 w-10 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/5" /><Skeleton className="h-3 w-1/4" /></div><Skeleton className="h-4 w-20" /></div>)}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/55 p-8 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><MoreHorizontal className="h-5 w-5" /></div><p className="mt-4 font-serif text-lg font-bold">{title}</p><p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function ProjectCard({ project }: { project: Project }) {
  const healthy = project.profit >= 0;
  return <Link href={`/projects/${project.id}`} data-testid={`card-project-${project.id}`} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
    <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[80px] bg-accent/25 transition-transform duration-500 group-hover:scale-125" />
    <div className="relative flex items-start justify-between gap-3"><div><span className="font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Проект</span><h3 data-testid={`text-project-name-${project.id}`} className="mt-2 line-clamp-1 font-serif text-xl font-bold tracking-[-0.03em]">{project.name}</h3></div><ChevronRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></div>
    <div className="relative mt-8 grid grid-cols-2 gap-4"><div><p className="text-xs text-muted-foreground">Прибыль</p><p data-testid={`text-project-profit-${project.id}`} className={`mt-1 font-mono text-lg font-medium ${healthy ? 'text-primary' : 'text-destructive'}`}>{healthy ? '+' : '−'}{formatMoney(Math.abs(project.profit))} ₽</p></div><div><p className="text-xs text-muted-foreground">Рентабельность</p><p data-testid={`text-project-profitability-${project.id}`} className="mt-1 font-mono text-lg font-medium">{formatPercent(project.profitability)}</p></div></div>
    <div className="relative mt-5 border-t border-border/70 pt-4"><div className="flex justify-between text-xs text-muted-foreground"><span>Доходы</span><span className="font-mono text-foreground">{formatMoney(project.totalIncome)} ₽</span></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Расходы</span><span className="font-mono text-foreground">{formatMoney(project.totalExpenses)} ₽</span></div></div>
    <div className="relative mt-4 flex items-center justify-between border-t border-border/70 pt-4"><span className="text-xs text-muted-foreground">Команда</span><span data-testid={`text-project-members-${project.id}`} className="max-w-[65%] truncate text-right text-xs font-medium text-foreground">{project.members.length ? project.members.map((member) => member.name).join(', ') : 'Не добавлена'}</span></div>
  </Link>;
}

export function TransactionRow({ transaction, onDelete, compact = false }: { transaction: Transaction; onDelete?: (transaction: Transaction) => void; compact?: boolean }) {
  const income = transaction.type === 'income';
  return <div data-testid={`row-transaction-${transaction.id}`} className="group flex items-center gap-3 border-b border-border/65 py-4 last:border-0">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${income ? 'bg-[hsl(var(--chart-3)/.13)] text-[hsl(var(--chart-3))]' : 'bg-[hsl(var(--chart-4)/.13)] text-[hsl(var(--chart-4))]'}`}>{income ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</div>
    <div className="min-w-0 flex-1"><p data-testid={`text-transaction-description-${transaction.id}`} className="truncate text-sm font-semibold">{transaction.description || transaction.category}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{transaction.category} · {formatDate(transaction.transactionDate)}</p></div>
    <div className="text-right"><p data-testid={`text-transaction-amount-${transaction.id}`} className={`font-mono text-sm font-medium ${income ? 'text-[hsl(var(--chart-3))]' : 'text-foreground'}`}>{income ? '+' : '−'}{formatMoney(transaction.amount)} ₽</p>{!compact && onDelete && <button data-testid={`button-delete-transaction-${transaction.id}`} className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100" onClick={() => onDelete(transaction)}><Trash2 className="h-3 w-3" />Удалить</button>}</div>
  </div>;
}