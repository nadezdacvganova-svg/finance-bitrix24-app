import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const transactionsTable = pgTable("finance_transactions", {
  id: serial("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  description: text("description").notNull().default(""),
  transactionDate: date("transaction_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;