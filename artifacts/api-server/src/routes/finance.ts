import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  categoriesTable,
  projectMembersTable,
  projectsTable,
  transactionsTable,
} from "@workspace/db";
import {
  CreateCategoryBody,
  CreateProjectBody,
  CreateTransactionBody,
  DeleteTransactionParams,
  GetBitrixStatusResponse,
  GetProjectParams,
  GetProjectResponse,
  ListCategoriesResponse,
  ListProjectsResponse,
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateCategoryResponse,
  CreateProjectResponse,
  CreateTransactionResponse,
  CreateProjectMemberBody,
  CreateProjectMemberParams,
  CreateProjectMemberResponse,
  DeleteProjectMemberParams,
  ListProjectMembersParams,
  ListProjectMembersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const defaultCategories = [
  { type: "income", name: "Продажа" },
  { type: "income", name: "Аванс" },
  { type: "income", name: "Оплата услуг" },
  { type: "income", name: "Другое" },
  { type: "expense", name: "Внешние программисты" },
  { type: "expense", name: "Внутренние программисты" },
  { type: "expense", name: "Расходы на ИИ" },
  { type: "expense", name: "Аренда сервера" },
  { type: "expense", name: "Дивиденды" },
  { type: "expense", name: "Другое" },
];

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

async function seedFinanceData(): Promise<void> {
  const existingProjects = await db.select({ id: projectsTable.id }).from(projectsTable);
  if (existingProjects.length > 0) {
    const existingMembers = await db
      .select({ id: projectMembersTable.id })
      .from(projectMembersTable);
    if (existingMembers.length === 0) {
      const projectIds = new Set(existingProjects.map((project) => project.id));
      const starterMembers = [
        { projectId: "alpha", name: "Анна Миронова" },
        { projectId: "alpha", name: "Иван Петров" },
        { projectId: "beta", name: "Мария Соколова" },
      ].filter((member) => projectIds.has(member.projectId));
      if (starterMembers.length > 0) {
        await db.insert(projectMembersTable).values(starterMembers);
      }
    }
    return;
  }

  await db.insert(categoriesTable).values(defaultCategories).onConflictDoNothing();
  await db.insert(projectsTable).values([
    { id: "alpha", name: "Проект Альфа" },
    { id: "beta", name: "Проект Бета" },
  ]);
  await db.insert(transactionsTable).values([
    {
      projectId: "alpha",
      type: "income",
      category: "Продажа",
      amount: 150000,
      description: "Оплата по договору",
      transactionDate: todayString(),
    },
    {
      projectId: "alpha",
      type: "expense",
      category: "Внешние программисты",
      amount: 45000,
      description: "Разработка модуля",
      transactionDate: todayString(),
    },
    {
      projectId: "beta",
      type: "income",
      category: "Аванс",
      amount: 80000,
      description: "Первый платеж",
      transactionDate: todayString(),
    },
    {
      projectId: "beta",
      type: "expense",
      category: "Аренда сервера",
      amount: 12000,
      description: "Аренда VPS",
      transactionDate: todayString(),
    },
  ]);
  await db.insert(projectMembersTable).values([
    { projectId: "alpha", name: "Анна Миронова" },
    { projectId: "alpha", name: "Иван Петров" },
    { projectId: "beta", name: "Мария Соколова" },
  ]);
}

async function getTransactions(projectId?: string) {
  const query = db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.transactionDate), desc(transactionsTable.createdAt));

  if (projectId) {
    return query.where(eq(transactionsTable.projectId, projectId));
  }

  return query;
}

function summarizeProject(
  project: typeof projectsTable.$inferSelect,
  transactions: typeof transactionsTable.$inferSelect[],
  members: typeof projectMembersTable.$inferSelect[] = [],
) {
  const projectTransactions = transactions.filter(
    (transaction) => transaction.projectId === project.id,
  );
  const totalIncome = projectTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpenses = projectTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const profit = totalIncome - totalExpenses;

  return {
    ...project,
    totalIncome,
    totalExpenses,
    profit,
    profitability: totalIncome > 0 ? (profit / totalIncome) * 100 : 0,
    transactions: projectTransactions,
    members: members.filter((member) => member.projectId === project.id),
  };
}

router.get("/projects", async (_req, res): Promise<void> => {
  await seedFinanceData();
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
  const transactions = await getTransactions();
  const members = await db.select().from(projectMembersTable);
  res.json(
    ListProjectsResponse.parse(
      projects.map((project) => summarizeProject(project, transactions, members)),
    ),
  );
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = `${parsed.data.name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "") || "project"}-${Date.now().toString(36)}`;
  const [project] = await db
    .insert(projectsTable)
    .values({ id, name: parsed.data.name })
    .returning();
  const response = summarizeProject(project, [], []);
  res.status(201).json(CreateProjectResponse.parse(response));
});

router.get("/projects/:projectId", async (req, res): Promise<void> => {
  await seedFinanceData();
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.projectId));
  if (!project) {
    res.status(404).json({ error: "Проект не найден" });
    return;
  }

  const transactions = await getTransactions(project.id);
  const members = await db
    .select()
    .from(projectMembersTable)
    .where(eq(projectMembersTable.projectId, project.id));
  res.json(GetProjectResponse.parse(summarizeProject(project, transactions, members)));
});

router.get("/projects/:projectId/members", async (req, res): Promise<void> => {
  await seedFinanceData();
  const params = ListProjectMembersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.projectId));
  if (!project) {
    res.status(404).json({ error: "Проект не найден" });
    return;
  }

  const members = await db
    .select()
    .from(projectMembersTable)
    .where(eq(projectMembersTable.projectId, project.id))
    .orderBy(projectMembersTable.createdAt);
  res.json(ListProjectMembersResponse.parse(members));
});

router.post("/projects/:projectId/members", async (req, res): Promise<void> => {
  const params = CreateProjectMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateProjectMemberBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [project] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.projectId));
  if (!project) {
    res.status(404).json({ error: "Проект не найден" });
    return;
  }

  const [member] = await db
    .insert(projectMembersTable)
    .values({ projectId: project.id, name: body.data.name })
    .returning();
  res.status(201).json(CreateProjectMemberResponse.parse(member));
});

router.delete(
  "/projects/:projectId/members/:memberId",
  async (req, res): Promise<void> => {
    const params = DeleteProjectMemberParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const deleted = await db
      .delete(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.projectId, params.data.projectId),
          eq(projectMembersTable.id, params.data.memberId),
        ),
      )
      .returning({ id: projectMembersTable.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: "Сотрудник не найден" });
      return;
    }
    res.sendStatus(204);
  },
);

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.id, parsed.data.projectId));
  if (!project) {
    res.status(404).json({ error: "Проект не найден" });
    return;
  }

  const [transaction] = await db
    .insert(transactionsTable)
    .values({
      projectId: parsed.data.projectId,
      type: parsed.data.type,
      category: parsed.data.category,
      amount: parsed.data.amount,
      description: parsed.data.description ?? "",
      transactionDate: parsed.data.transactionDate
        ? parsed.data.transactionDate.toISOString().slice(0, 10)
        : todayString(),
    })
    .returning();
  res.status(201).json(CreateTransactionResponse.parse(transaction));
});

router.get("/transactions", async (req, res): Promise<void> => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const transactions = await getTransactions(parsed.data.projectId);
  res.json(ListTransactionsResponse.parse(transactions.slice(0, parsed.data.limit)));
});

router.delete("/transactions/:transactionId", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const deleted = await db
    .delete(transactionsTable)
    .where(eq(transactionsTable.id, params.data.transactionId))
    .returning({ id: transactionsTable.id });
  if (deleted.length === 0) {
    res.status(404).json({ error: "Операция не найдена" });
    return;
  }
  res.sendStatus(204);
});

router.get("/categories", async (_req, res): Promise<void> => {
  await seedFinanceData();
  const categories = await db
    .select()
    .from(categoriesTable)
    .orderBy(categoriesTable.type, categoriesTable.name);
  res.json(ListCategoriesResponse.parse(categories));
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [category] = await db.insert(categoriesTable).values(parsed.data).returning();
    res.status(201).json(CreateCategoryResponse.parse(category));
  } catch {
    res.status(409).json({ error: "Такая категория уже существует" });
  }
});

router.get("/integrations/bitrix24", async (_req, res): Promise<void> => {
  res.json(
    GetBitrixStatusResponse.parse({
      connected: false,
      message: "Кнопка подключения готова. Авторизация Битрикс24 будет добавлена позже.",
    }),
  );
});

export default router;