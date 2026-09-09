import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { CalendarDays, Plus, ReceiptText, UserRoundPlus } from 'lucide-react';
import { getListCategoriesQueryKey, getListProjectsQueryKey, getListTransactionsQueryKey, getGetProjectQueryKey, getListProjectMembersQueryKey, useCreateCategory, useCreateProject, useCreateProjectMember, useCreateTransaction } from '@workspace/api-client-react';
import type { Category, Project } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const projectSchema = z.object({ name: z.string().min(1, 'Введите название проекта').max(120) });
const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Выберите категорию'),
  amount: z.coerce.number().positive('Сумма должна быть больше нуля'),
  description: z.string().optional(),
  transactionDate: z.string().min(1, 'Укажите дату'),
});
const categorySchema = z.object({ type: z.enum(['income', 'expense']), name: z.string().min(1, 'Введите название категории').max(80) });
const memberSchema = z.object({ name: z.string().min(1, 'Введите имя сотрудника').max(120) });

type FormProps = { open: boolean; onOpenChange: (open: boolean) => void };

export function CreateProjectDialog({ open, onOpenChange }: FormProps) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const mutation = useCreateProject();
  const form = useForm<z.infer<typeof projectSchema>>({ resolver: zodResolver(projectSchema), defaultValues: { name: '' } });
  const onSubmit = (values: z.infer<typeof projectSchema>) => {
    mutation.mutate({ data: values }, {
      onSuccess: (createdProject) => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        onOpenChange(false);
        form.reset();
        setLocation(`/projects/${createdProject.id}`);
      },
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card p-0">
        <div className="border-b border-border px-6 py-5">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Новый проект</DialogTitle>
            <DialogDescription className="mt-2">Добавьте проект, чтобы сразу начать видеть его экономику.</DialogDescription>
          </DialogHeader>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 py-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Название проекта</FormLabel><FormControl><Input data-testid="input-project-name" placeholder="Например, Редизайн каталога" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter><Button type="button" variant="ghost" data-testid="button-cancel-project" onClick={() => onOpenChange(false)}>Отмена</Button><Button type="submit" data-testid="button-submit-project" disabled={mutation.isPending}>{mutation.isPending ? 'Создаём…' : 'Создать проект'}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function TransactionDialog({ open, onOpenChange, project, categories }: FormProps & { project: Project; categories: Category[] }) {
  const queryClient = useQueryClient();
  const mutation = useCreateTransaction();
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: 'expense', category: '', amount: 0, description: '', transactionDate: new Date().toISOString().slice(0, 10) },
  });
  const type = form.watch('type');
  const availableCategories = useMemo(() => categories.filter((category) => category.type === type), [categories, type]);
  const onSubmit = (values: z.infer<typeof transactionSchema>) => {
    mutation.mutate({ data: { ...values, projectId: project.id, description: values.description || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey({ projectId: project.id }) });
        form.reset({ type: 'expense', category: '', amount: 0, description: '', transactionDate: new Date().toISOString().slice(0, 10) });
        onOpenChange(false);
      },
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-card p-0">
        <div className="border-b border-border bg-primary px-6 py-6 text-primary-foreground">
          <DialogHeader><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><ReceiptText className="h-5 w-5" /></div><DialogTitle className="font-serif text-2xl">Добавить статью</DialogTitle><DialogDescription className="mt-2 text-primary-foreground/68">Проект: {project.name}</DialogDescription></DialogHeader>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 px-6 py-6">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem><FormLabel>Тип операции</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger data-testid="select-transaction-type"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="expense">Расход</SelectItem><SelectItem value="income">Доход</SelectItem></SelectContent></Select></FormItem>
            )} />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Категория</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-transaction-category"><SelectValue placeholder="Выберите" /></SelectTrigger></FormControl><SelectContent>{availableCategories.map((category) => <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Сумма, ₽</FormLabel><FormControl><Input data-testid="input-transaction-amount" type="number" min="0" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="transactionDate" render={({ field }) => (
              <FormItem><FormLabel>Дата операции</FormLabel><FormControl><div className="relative"><CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input data-testid="input-transaction-date" type="date" className="pl-9" {...field} /></div></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Комментарий <span className="font-normal text-muted-foreground">(необязательно)</span></FormLabel><FormControl><Textarea data-testid="input-transaction-description" placeholder="Что важно помнить об операции?" className="min-h-[80px] resize-none" {...field} /></FormControl></FormItem>
            )} />
            <DialogFooter><Button type="button" variant="ghost" data-testid="button-cancel-transaction" onClick={() => onOpenChange(false)}>Отмена</Button><Button type="submit" data-testid="button-submit-transaction" disabled={mutation.isPending}>{mutation.isPending ? 'Сохраняем…' : 'Сохранить операцию'}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryForm({ onCreated }: { onCreated?: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useCreateCategory();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const form = useForm<z.infer<typeof categorySchema>>({ resolver: zodResolver(categorySchema), defaultValues: { type: 'expense', name: '' } });
  const onSubmit = (values: z.infer<typeof categorySchema>) => mutation.mutate({ data: values }, {
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }); form.reset({ type, name: '' }); onCreated?.(); },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <FormField control={form.control} name="name" render={({ field }) => <FormItem className="flex-1"><FormLabel>Название статьи</FormLabel><FormControl><Input data-testid="input-category-name" placeholder="Например, подрядчики" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="type" render={({ field }) => <FormItem className="sm:w-36"><FormLabel>Тип</FormLabel><Select onValueChange={(value) => { field.onChange(value); setType(value as 'income' | 'expense'); }} defaultValue={field.value}><FormControl><SelectTrigger data-testid="select-category-type"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="expense">Расход</SelectItem><SelectItem value="income">Доход</SelectItem></SelectContent></Select></FormItem>} />
        <Button type="submit" data-testid="button-submit-category" disabled={mutation.isPending}><Plus className="mr-2 h-4 w-4" />Добавить</Button>
      </form>
    </Form>
  );
}

export function MemberDialog({ open, onOpenChange, project }: FormProps & { project: Project }) {
  const queryClient = useQueryClient();
  const mutation = useCreateProjectMember();
  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: '' },
  });
  const onSubmit = (values: z.infer<typeof memberSchema>) => mutation.mutate(
    { projectId: project.id, data: values },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(project.id) });
        form.reset();
        onOpenChange(false);
      },
    },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card p-0">
        <div className="border-b border-border bg-primary px-6 py-6 text-primary-foreground">
          <DialogHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><UserRoundPlus className="h-5 w-5" /></div>
            <DialogTitle className="font-serif text-2xl">Добавить сотрудника</DialogTitle>
            <DialogDescription className="mt-2 text-primary-foreground/68">Проект: {project.name}</DialogDescription>
          </DialogHeader>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 py-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Имя сотрудника</FormLabel>
                <FormControl><Input data-testid="input-project-member-name" placeholder="Например, Елена Смирнова" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" data-testid="button-cancel-project-member" onClick={() => onOpenChange(false)}>Отмена</Button>
              <Button type="submit" data-testid="button-submit-project-member" disabled={mutation.isPending}>{mutation.isPending ? 'Добавляем…' : 'Добавить сотрудника'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}