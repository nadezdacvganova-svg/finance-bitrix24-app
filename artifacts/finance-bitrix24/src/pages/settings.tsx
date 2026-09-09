import { useState } from 'react';
import { Check, CircleAlert, Link2, Plus, Settings2, ShieldCheck } from 'lucide-react';
import { useGetBitrixStatus, useListCategories } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { CategoryForm } from '@/components/forms';
import { PageHeading } from '@/components/layout';
import { ErrorState, LoadingRows } from '@/components/finance-ui';

export default function Settings() {
  const categoriesQuery = useListCategories();
  const bitrixQuery = useGetBitrixStatus();
  const [requested, setRequested] = useState(false);
  const categories = categoriesQuery.data ?? [];
  const income = categories.filter((category) => category.type === 'income');
  const expenses = categories.filter((category) => category.type === 'expense');

  return <div className="space-y-10">
    <PageHeading eyebrow="Рабочая среда" title="Настройки" description="Справочники и подключения, на которых держится ваш финансовый контур." />
    <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <div className="animate-in rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-4"><div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/35 text-primary"><Settings2 className="h-5 w-5" /></div><h2 className="mt-5 font-serif text-2xl font-bold tracking-[-0.03em]">Добавить новую статью</h2><p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">Добавляйте статьи доходов и расходов, чтобы финансовый журнал точно отражал работу проектов.</p></div><span data-testid="text-category-count" className="rounded-full bg-secondary px-3 py-1 font-mono text-xs text-muted-foreground">{categories.length} всего</span></div><div className="mt-8"><CategoryForm /></div>{categoriesQuery.isLoading ? <div className="mt-7"><LoadingRows count={4} /></div> : categoriesQuery.isError ? <div className="mt-7"><ErrorState label="Статьи недоступны" onRetry={() => { void categoriesQuery.refetch(); }} /></div> : <div className="mt-8 grid gap-5 sm:grid-cols-2"><CategoryColumn label="Доходы" items={income} tone="income" /><CategoryColumn label="Расходы" items={expenses} tone="expense" /></div>}</div>
      <div className="animate-in delay-1 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--chart-2)/.2)] text-primary"><Link2 className="h-5 w-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Интеграция</p><h2 className="mt-2 font-serif text-2xl font-bold">Bitrix24</h2></div></div><p className="mt-6 text-sm leading-relaxed text-muted-foreground">{bitrixQuery.data?.message || 'Подключите Bitrix24, чтобы держать рабочие процессы и финансовые факты в одном контексте.'}</p><div className="mt-6 rounded-xl border border-border bg-secondary/45 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className={`h-2.5 w-2.5 rounded-full ${bitrixQuery.data?.connected ? 'bg-[hsl(var(--chart-3))]' : 'bg-muted-foreground/35'}`} /><span data-testid="status-bitrix-settings" className="text-sm font-semibold">{bitrixQuery.isLoading ? 'Проверка статуса' : bitrixQuery.data?.connected ? 'Соединение активно' : requested ? 'Запрос отправлен' : 'Подключение не настроено'}</span></div>{bitrixQuery.data?.connected && <Check className="h-4 w-4 text-[hsl(var(--chart-3))]" />}</div></div><Button data-testid="button-request-bitrix" className="mt-5 w-full" variant={bitrixQuery.data?.connected ? 'outline' : 'default'} onClick={() => setRequested(true)} disabled={Boolean(bitrixQuery.data?.connected) || requested}>{bitrixQuery.data?.connected ? 'Подключено' : requested ? 'Мы свяжемся с вами' : 'Запросить подключение'}</Button><p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />Доступ появится после подтверждения администратора.</p></div>
        <div className="rounded-2xl border border-primary/15 bg-primary p-6 text-primary-foreground"><div className="flex items-center gap-2 text-accent"><CircleAlert className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-[0.2em]">Принцип</span></div><p className="mt-4 font-serif text-xl font-bold leading-snug">Не прячьте операцию в заметках — зафиксируйте её как факт.</p><p className="mt-3 text-sm leading-relaxed text-primary-foreground/65">Категории нужны не для порядка ради порядка. Они помогают увидеть, где проект зарабатывает, а где теряет темп.</p></div>
      </div>
    </section>
  </div>;
}

function CategoryColumn({ label, items, tone }: { label: string; items: { id: number; name: string }[]; tone: 'income' | 'expense' }) {
  return <div><div className="mb-3 flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${tone === 'income' ? 'bg-[hsl(var(--chart-3))]' : 'bg-[hsl(var(--chart-4))]'}`} /><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p></div><div className="space-y-2">{items.length === 0 ? <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">Пока пусто</p> : items.map((item) => <div data-testid={`row-category-${item.id}`} key={item.id} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 text-sm"><span>{item.name}</span><span className="font-mono text-[10px] text-muted-foreground">#{item.id}</span></div>)}</div></div>;
}