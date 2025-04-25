import { pgTable, text, serial, integer, timestamp, decimal, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  farmName: text("farm_name").notNull(),
  henCount: integer("hen_count").notNull().default(0),
  eggPrice: decimal("egg_price", { precision: 10, scale: 2 }).notNull().default("0"),
  subscriptionStatus: text("subscription_status").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Hen count history
export const henCountHistory = pgTable("hen_count_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  henCount: integer("hen_count").notNull(),
  changeDate: timestamp("change_date").defaultNow().notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Egg collections
export const eggCollections = pgTable("egg_collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  collectionDate: date("collection_date").notNull(),
  period: text("period", { enum: ["morning", "afternoon"] }).notNull(),
  eggCount: integer("egg_count").notNull(),
  posturePercentage: decimal("posture_percentage", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Stock movements
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  movementType: text("movement_type", { enum: ["in", "out"] }).notNull(),
  eggCount: integer("egg_count").notNull(),
  movementDate: date("movement_date").notNull(),
  financialMovementId: integer("financial_movement_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Stock balance
export const stockBalance = pgTable("stock_balance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  eggCount: integer("egg_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Financial movements
export const financialMovements = pgTable("financial_movements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  movementType: text("movement_type", { enum: ["income", "expense"] }).notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  movementDate: date("movement_date").notNull(),
  paymentMethod: text("payment_method"),
  contact: text("contact"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Financial balance
export const financialBalance = pgTable("financial_balance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  henCountHistory: many(henCountHistory),
  eggCollections: many(eggCollections),
  stockMovements: many(stockMovements),
  financialMovements: many(financialMovements),
}));

export const henCountHistoryRelations = relations(henCountHistory, ({ one }) => ({
  user: one(users, { fields: [henCountHistory.userId], references: [users.id] }),
}));

export const eggCollectionsRelations = relations(eggCollections, ({ one }) => ({
  user: one(users, { fields: [eggCollections.userId], references: [users.id] }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  user: one(users, { fields: [stockMovements.userId], references: [users.id] }),
}));

export const stockBalanceRelations = relations(stockBalance, ({ one }) => ({
  user: one(users, { fields: [stockBalance.userId], references: [users.id] }),
}));

export const financialMovementsRelations = relations(financialMovements, ({ one }) => ({
  user: one(users, { fields: [financialMovements.userId], references: [users.id] }),
}));

export const financialBalanceRelations = relations(financialBalance, ({ one }) => ({
  user: one(users, { fields: [financialBalance.userId], references: [users.id] }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: (schema) => schema.min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: (schema) => schema.min(2, "Nome deve ter pelo menos 2 caracteres"),
  farmName: (schema) => schema.min(2, "Nome da granja deve ter pelo menos 2 caracteres"),
  henCount: (schema) => schema.min(0, "Número de galinhas deve ser positivo"),
  eggPrice: (schema) => schema.min(0, "Preço dos ovos deve ser positivo"),
}).omit({ createdAt: true });

export const insertHenCountHistorySchema = createInsertSchema(henCountHistory, {
  henCount: (schema) => schema.min(0, "Número de galinhas deve ser positivo"),
}).omit({ createdAt: true });

export const insertEggCollectionSchema = createInsertSchema(eggCollections, {
  eggCount: (schema) => schema.min(0, "Quantidade de ovos deve ser positiva"),
}).omit({ createdAt: true, posturePercentage: true });

export const insertStockMovementSchema = createInsertSchema(stockMovements, {
  eggCount: (schema) => schema.min(0, "Quantidade de ovos deve ser positiva"),
}).omit({ createdAt: true, financialMovementId: true });

export const insertFinancialMovementSchema = createInsertSchema(financialMovements)
  .extend({
    amount: z.string().or(z.number()).refine(val => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return !isNaN(num) && num >= 0;
    }, "Valor deve ser positivo"),
  })
  .omit({ createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type HenCountHistory = typeof henCountHistory.$inferSelect;
export type InsertHenCountHistory = z.infer<typeof insertHenCountHistorySchema>;

export type EggCollection = typeof eggCollections.$inferSelect;
export type InsertEggCollection = z.infer<typeof insertEggCollectionSchema>;

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

export type StockBalance = typeof stockBalance.$inferSelect;

export type FinancialMovement = typeof financialMovements.$inferSelect;
export type InsertFinancialMovement = z.infer<typeof insertFinancialMovementSchema>;

export type FinancialBalance = typeof financialBalance.$inferSelect;
