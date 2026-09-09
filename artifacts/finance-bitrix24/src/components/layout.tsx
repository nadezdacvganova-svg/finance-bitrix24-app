import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowDownToLine, ChevronRight, CircleDollarSign, LayoutDashboard, Menu, Settings2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/', label: 'Обзор', icon: LayoutDashboard },
  { href: '/settings', label: 'Настройки', icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="texture min-h-[100dvh] bg-background text-foreground">
      <button
        data-testid="button-mobile-menu"
        aria-label="Открыть меню"
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <button
          data-testid="button-close-mobile-menu-overlay"
          aria-label="Закрыть меню"
          className="fixed inset-0 z-40 bg-primary/35 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[260px] -translate-x-full flex-col bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 md:translate-x-0',
        open && 'translate-x-0',
      )}>
        <div className="flex items-center justify-between">
          <Link href="/" data-testid="link-brand" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <CircleDollarSign className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-serif text-[17px] font-bold leading-none">Финучёт</span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/55">финансовый учёт</span>
            </span>
          </Link>
          <button data-testid="button-close-mobile-menu" className="text-sidebar-foreground/60 md:hidden" onClick={() => setOpen(false)} aria-label="Закрыть меню">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-14">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/42">Рабочее пространство</p>
          <nav className="space-y-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? location === '/' : location.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  data-testid={`link-nav-${label}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-sidebar-foreground/64 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    active && 'bg-sidebar-accent text-sidebar-foreground shadow-inner',
                  )}
                >
                  <span className="flex items-center gap-3"><Icon className={cn('h-[18px] w-[18px]', active && 'text-sidebar-primary')} />{label}</span>
                  {active && <ChevronRight className="h-4 w-4 text-sidebar-primary" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sidebar-primary shadow-[0_0_0_4px_hsl(var(--sidebar-primary)/.13)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/70">Данные защищены</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-sidebar-foreground/48">Один центр контроля для проектов, денег и решений.</p>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-sidebar-border pt-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">АМ</div>
              <div>
                <p className="text-xs font-semibold">Анна Миронова</p>
                <p className="text-[10px] text-sidebar-foreground/45">Операционный директор</p>
              </div>
            </div>
            <ArrowDownToLine className="h-4 w-4 rotate-45 text-sidebar-foreground/35" />
          </div>
        </div>
      </aside>

      <main className="min-h-[100dvh] md:pl-[260px]">
        <div className="mx-auto max-w-[1560px] px-5 pb-10 pt-20 sm:px-8 md:px-10 md:pt-10 xl:px-14">
          {children}
        </div>
      </main>
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="animate-in flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-[42px]">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}