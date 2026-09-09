# Финансовый учет Битрикс24

Веб-приложение для учета доходов и расходов по проектам с локальной финансовой базой и подготовленной кнопкой подключения Битрикс24.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/finance-bitrix24/` — React/Vite интерфейс дашборда, деталей проектов и настроек.
- `artifacts/api-server/src/routes/finance.ts` — API проектов, операций, категорий и статуса Битрикс24.
- `artifacts/api-server/src/routes/finance.ts` — также API участников проекта.
- `lib/api-spec/openapi.yaml` — источник API-контракта.
- `lib/db/src/schema/` — таблицы проектов, операций, категорий и участников проектов.

## Architecture decisions

- Финансовые данные хранятся в PostgreSQL через Drizzle, а фронтенд использует сгенерированные Orval-хуки.
- Синхронизация с Битрикс24 отложена; текущая кнопка отображает статус подключения без запроса учетных данных.
- Сотрудники хранятся как участники проекта с возможностью добавления и удаления; данные общие для сотрудников, использующих приложение.
- Демо-данные создаются при первом обращении к проектам/категориям, чтобы интерфейс сразу был информативным.

## Product

Показывает сводку по портфелю проектов, прибыль и рентабельность, журнал последних операций, детали проекта, добавление проектов/доходов/расходов и управление категориями.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
