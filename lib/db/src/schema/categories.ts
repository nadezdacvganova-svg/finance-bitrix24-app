import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, unique } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const categoriesTable = pgTable(
  "finance_categories",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(),
    name: text("name").notNull(),
  },
  (table) => ({
    typeNameUnique: unique("finance_categories_type_name_unique").on(
      table.type,
      table.name,
    ),
  }),
);

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;