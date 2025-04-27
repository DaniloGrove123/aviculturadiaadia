import { db } from "../db";
import { 
  users, 
  henCountHistory, 
  eggCollections, 
  stockMovements, 
  stockBalance, 
  financialMovements, 
  financialBalance,
  type User,
  type HenCountHistory,
  type EggCollection,
  type StockMovement,
  type StockBalance,
  type FinancialMovement,
  type FinancialBalance,
} from "../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "../db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: Omit<User, "id" | "createdAt">): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;

  // Hen count history operations
  createHenCountHistory(data: Omit<HenCountHistory, "id" | "createdAt">): Promise<HenCountHistory>;
  getHenCountHistoryByUserId(userId: number, limit?: number): Promise<HenCountHistory[]>;

  // Egg collection operations
  createEggCollection(data: Omit<EggCollection, "id" | "createdAt">): Promise<EggCollection>;
  getEggCollectionsByUserId(userId: number, limit?: number): Promise<EggCollection[]>;
  getEggCollectionsByDate(userId: number, date: Date): Promise<EggCollection[]>;
  updateEggCollection(id: number, data: Partial<EggCollection>): Promise<EggCollection | undefined>;
  deleteEggCollection(id: number): Promise<boolean>;

  // Stock operations
  getStockBalanceByUserId(userId: number): Promise<StockBalance | undefined>;
  createStockMovement(data: Omit<StockMovement, "id" | "createdAt">): Promise<StockMovement>;
  getStockMovementsByUserId(userId: number, limit?: number): Promise<StockMovement[]>;
  
  // Financial operations
  getFinancialBalanceByUserId(userId: number): Promise<FinancialBalance | undefined>;
  createFinancialMovement(data: Omit<FinancialMovement, "id" | "createdAt">): Promise<FinancialMovement>;
  getFinancialMovementsByUserId(userId: number, limit?: number): Promise<FinancialMovement[]>;
  getFinancialSummaryByUserIdAndMonth(userId: number, year: number, month: number): Promise<any>;

  // Session store
  sessionStore: session.SessionStore;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(userData: Omit<User, "id" | "createdAt">): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    
    // Create initial stock and financial balances
    await db.insert(stockBalance).values({
      userId: result[0].id,
      eggCount: 0
    });
    
    await db.insert(financialBalance).values({
      userId: result[0].id,
      balance: "0"
    });
    
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Hen count history operations
  async createHenCountHistory(data: Omit<HenCountHistory, "id" | "createdAt">): Promise<HenCountHistory> {
    // Update user's hen count
    await db.update(users)
      .set({ henCount: data.henCount })
      .where(eq(users.id, data.userId));
    
    // Create history record
    const result = await db.insert(henCountHistory).values(data).returning();
    return result[0];
  }

  async getHenCountHistoryByUserId(userId: number, limit = 10): Promise<HenCountHistory[]> {
    return await db.select()
      .from(henCountHistory)
      .where(eq(henCountHistory.userId, userId))
      .orderBy(desc(henCountHistory.changeDate))
      .limit(limit);
  }

  // Egg collection operations
  async createEggCollection(data: Omit<EggCollection, "id" | "createdAt">): Promise<EggCollection> {
    // Get user's hen count to calculate posture percentage
    const userResult = await db.select({ henCount: users.henCount })
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);
    
    const henCount = userResult[0]?.henCount || 0;
    const posturePercentage = henCount > 0 ? (data.eggCount / henCount) * 100 : 0;
    
    // Create collection record
    const collectionResult = await db.insert(eggCollections)
      .values({
        ...data,
        posturePercentage: posturePercentage.toFixed(2)
      })
      .returning();
    
    // Update stock balance
    await this.createStockMovement({
      userId: data.userId,
      movementType: "in",
      eggCount: data.eggCount,
      movementDate: data.collectionDate,
      notes: `Coleta de ${data.period === "morning" ? "manhã" : "tarde"}`
    });
    
    return collectionResult[0];
  }

  async getEggCollectionsByUserId(userId: number, limit = 10): Promise<EggCollection[]> {
    return await db.select()
      .from(eggCollections)
      .where(eq(eggCollections.userId, userId))
      .orderBy(desc(eggCollections.collectionDate), desc(eggCollections.period))
      .limit(limit);
  }

  async getEggCollectionsByDate(userId: number, date: Date): Promise<EggCollection[]> {
    return await db.select()
      .from(eggCollections)
      .where(
        and(
          eq(eggCollections.userId, userId),
          eq(eggCollections.collectionDate, date)
        )
      )
      .orderBy(desc(eggCollections.period));
  }

  async updateEggCollection(id: number, data: Partial<EggCollection>): Promise<EggCollection | undefined> {
    // Get old egg count and user ID
    const oldCollection = await db.select()
      .from(eggCollections)
      .where(eq(eggCollections.id, id))
      .limit(1);
    
    if (!oldCollection.length) return undefined;
    
    const oldEggCount = oldCollection[0].eggCount;
    const userId = oldCollection[0].userId;
    const collectionDate = oldCollection[0].collectionDate;
    
    // If egg count is changing, update stock
    if (data.eggCount !== undefined && data.eggCount !== oldEggCount) {
      // Calculate difference
      const difference = data.eggCount - oldEggCount;
      
      // Update stock balance
      await this.createStockMovement({
        userId,
        movementType: difference > 0 ? "in" : "out",
        eggCount: Math.abs(difference),
        movementDate: collectionDate,
        notes: `Ajuste de coleta ${oldCollection[0].period === "morning" ? "manhã" : "tarde"}`
      });
    }
    
    // If henCount has changed, recalculate posture percentage
    if (data.eggCount !== undefined) {
      const userResult = await db.select({ henCount: users.henCount })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      const henCount = userResult[0]?.henCount || 0;
      const newEggCount = data.eggCount;
      data.posturePercentage = henCount > 0 ? ((newEggCount / henCount) * 100).toFixed(2) : "0";
    }
    
    // Update collection
    const result = await db.update(eggCollections)
      .set(data)
      .where(eq(eggCollections.id, id))
      .returning();
    
    return result[0];
  }

  async deleteEggCollection(id: number): Promise<boolean> {
    // Get collection details
    const collection = await db.select()
      .from(eggCollections)
      .where(eq(eggCollections.id, id))
      .limit(1);
    
    if (!collection.length) return false;
    
    // Create a negative stock movement to offset the collection
    await this.createStockMovement({
      userId: collection[0].userId,
      movementType: "out",
      eggCount: collection[0].eggCount,
      movementDate: collection[0].collectionDate,
      notes: `Exclusão de coleta ${collection[0].period === "morning" ? "manhã" : "tarde"}`
    });
    
    // Delete the collection
    const result = await db.delete(eggCollections)
      .where(eq(eggCollections.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Stock operations
  async getStockBalanceByUserId(userId: number): Promise<StockBalance | undefined> {
    const result = await db.select()
      .from(stockBalance)
      .where(eq(stockBalance.userId, userId))
      .limit(1);
    return result[0];
  }

  async createStockMovement(data: Omit<StockMovement, "id" | "createdAt">): Promise<StockMovement> {
    const result = await db.insert(stockMovements).values(data).returning();
    
    // Update stock balance
    const stockResult = await db.select()
      .from(stockBalance)
      .where(eq(stockBalance.userId, data.userId))
      .limit(1);
    
    let currentBalance = stockResult[0]?.eggCount || 0;
    
    if (data.movementType === "in") {
      currentBalance += data.eggCount;
    } else {
      currentBalance = Math.max(0, currentBalance - data.eggCount);
    }
    
    if (stockResult.length) {
      await db.update(stockBalance)
        .set({ 
          eggCount: currentBalance,
          updatedAt: new Date()
        })
        .where(eq(stockBalance.userId, data.userId));
    } else {
      await db.insert(stockBalance)
        .values({
          userId: data.userId,
          eggCount: currentBalance
        });
    }
    
    return result[0];
  }

  async getStockMovementsByUserId(userId: number, limit = 10): Promise<StockMovement[]> {
    return await db.select()
      .from(stockMovements)
      .where(eq(stockMovements.userId, userId))
      .orderBy(desc(stockMovements.movementDate), desc(stockMovements.createdAt))
      .limit(limit);
  }

  // Financial operations
  async getFinancialBalanceByUserId(userId: number): Promise<FinancialBalance | undefined> {
    const result = await db.select()
      .from(financialBalance)
      .where(eq(financialBalance.userId, userId))
      .limit(1);
    return result[0];
  }

  async createFinancialMovement(data: Omit<FinancialMovement, "id" | "createdAt">): Promise<FinancialMovement> {
    const result = await db.insert(financialMovements).values(data).returning();
    
    // Update financial balance
    const financeResult = await db.select()
      .from(financialBalance)
      .where(eq(financialBalance.userId, data.userId))
      .limit(1);
    
    let currentBalance = parseFloat(financeResult[0]?.balance as unknown as string) || 0;
    
    if (data.movementType === "income") {
      currentBalance += parseFloat(data.amount as unknown as string);
    } else {
      currentBalance -= parseFloat(data.amount as unknown as string);
    }
    
    if (financeResult.length) {
      await db.update(financialBalance)
        .set({ 
          balance: currentBalance.toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(financialBalance.userId, data.userId));
    } else {
      await db.insert(financialBalance)
        .values({
          userId: data.userId,
          balance: currentBalance.toFixed(2)
        });
    }
    
    return result[0];
  }

  async getFinancialMovementsByUserId(userId: number, limit = 10): Promise<FinancialMovement[]> {
    return await db.select()
      .from(financialMovements)
      .where(eq(financialMovements.userId, userId))
      .orderBy(desc(financialMovements.movementDate), desc(financialMovements.createdAt))
      .limit(limit);
  }

  async getFinancialSummaryByUserIdAndMonth(userId: number, year: number, month: number): Promise<any> {
    // Extract month and year from movement_date using SQL functions
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const incomesResult = await db.select({
      total: sql<string>`SUM(${financialMovements.amount})`
    })
    .from(financialMovements)
    .where(
      and(
        eq(financialMovements.userId, userId),
        eq(financialMovements.movementType, "income"),
        sql`${financialMovements.movementDate} >= ${startDate}`,
        sql`${financialMovements.movementDate} <= ${endDate}`
      )
    );
    
    const expensesResult = await db.select({
      total: sql<string>`SUM(${financialMovements.amount})`
    })
    .from(financialMovements)
    .where(
      and(
        eq(financialMovements.userId, userId),
        eq(financialMovements.movementType, "expense"),
        sql`${financialMovements.movementDate} >= ${startDate}`,
        sql`${financialMovements.movementDate} <= ${endDate}`
      )
    );
    
    const eggSalesResult = await db.select({
      total: sql<string>`SUM(${financialMovements.amount})`,
      eggCount: sql<number>`SUM(CAST(${financialMovements.notes} AS INTEGER))`
    })
    .from(financialMovements)
    .where(
      and(
        eq(financialMovements.userId, userId),
        eq(financialMovements.movementType, "income"),
        eq(financialMovements.category, "Venda de ovos"),
        sql`${financialMovements.movementDate} >= ${startDate}`,
        sql`${financialMovements.movementDate} <= ${endDate}`
      )
    );
    
    return {
      incomes: parseFloat(incomesResult[0].total || "0"),
      expenses: parseFloat(expensesResult[0].total || "0"),
      eggSales: {
        total: parseFloat(eggSalesResult[0].total || "0"),
        eggCount: eggSalesResult[0].eggCount || 0
      }
    };
  }
}

export const storage = new DatabaseStorage();
