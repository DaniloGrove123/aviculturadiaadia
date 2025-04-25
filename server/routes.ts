import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertEggCollectionSchema, insertFinancialMovementSchema, insertHenCountHistorySchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes (from blueprint)
  setupAuth(app);

  // API routes
  const apiPrefix = "/api";

  // Egg Collection routes
  app.post(`${apiPrefix}/collections`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const data = insertEggCollectionSchema.parse({ ...req.body, userId });
      
      const collection = await storage.createEggCollection(data);
      res.status(201).json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get(`${apiPrefix}/collections`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const collections = await storage.getEggCollectionsByUserId(userId, limit);
      res.json(collections);
    } catch (error) {
      console.error("Error getting collections:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get(`${apiPrefix}/collections/today`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const today = new Date();
      
      const collections = await storage.getEggCollectionsByDate(userId, today);
      
      // Calculate total and period-specific counts
      const morningCollection = collections.find(c => c.period === "morning");
      const afternoonCollection = collections.find(c => c.period === "afternoon");
      
      const morningCount = morningCollection?.eggCount || 0;
      const afternoonCount = afternoonCollection?.eggCount || 0;
      const totalCount = morningCount + afternoonCount;
      
      // Get posture percentage
      const user = await storage.getUser(userId);
      const posturePercentage = user?.henCount ? ((totalCount / user.henCount) * 100).toFixed(2) : "0";
      
      res.json({
        collections,
        summary: {
          date: format(today, "yyyy-MM-dd"),
          total: totalCount,
          morning: morningCount,
          afternoon: afternoonCount,
          posturePercentage
        }
      });
    } catch (error) {
      console.error("Error getting today's collections:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put(`${apiPrefix}/collections/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const collectionId = parseInt(req.params.id);
      const data = req.body;
      
      const updatedCollection = await storage.updateEggCollection(collectionId, data);
      
      if (!updatedCollection) {
        return res.status(404).json({ message: "Coleta não encontrada" });
      }
      
      res.json(updatedCollection);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete(`${apiPrefix}/collections/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const collectionId = parseInt(req.params.id);
      const success = await storage.deleteEggCollection(collectionId);
      
      if (!success) {
        return res.status(404).json({ message: "Coleta não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Stock routes
  app.get(`${apiPrefix}/stock/balance`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const balance = await storage.getStockBalanceByUserId(userId);
      
      res.json(balance || { userId, eggCount: 0 });
    } catch (error) {
      console.error("Error getting stock balance:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get(`${apiPrefix}/stock/movements`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const movements = await storage.getStockMovementsByUserId(userId, limit);
      res.json(movements);
    } catch (error) {
      console.error("Error getting stock movements:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post(`${apiPrefix}/stock/movements`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const data = { ...req.body, userId };
      
      // If this is a "sell" movement, create a financial movement too
      if (data.movementType === "out" && data.createFinancialRecord) {
        const price = parseFloat((req.user!.eggPrice as unknown as string) || "0");
        const amount = (data.eggCount / 12) * price; // price per dozen
        
        const financialData = {
          userId,
          movementType: "income",
          category: "Venda de ovos",
          amount: amount.toFixed(2),
          movementDate: data.movementDate,
          paymentMethod: data.paymentMethod || "Dinheiro",
          contact: data.contact || "",
          notes: data.eggCount.toString() // storing egg count in notes
        };
        
        const financialMovement = await storage.createFinancialMovement(financialData);
        data.financialMovementId = financialMovement.id;
      }
      
      delete data.createFinancialRecord;
      delete data.paymentMethod;
      delete data.contact;
      
      const movement = await storage.createStockMovement(data);
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating stock movement:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Financial routes
  app.get(`${apiPrefix}/financial/balance`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const balance = await storage.getFinancialBalanceByUserId(userId);
      
      res.json(balance || { userId, balance: "0" });
    } catch (error) {
      console.error("Error getting financial balance:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get(`${apiPrefix}/financial/movements`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const movements = await storage.getFinancialMovementsByUserId(userId, limit);
      res.json(movements);
    } catch (error) {
      console.error("Error getting financial movements:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post(`${apiPrefix}/financial/movements`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const data = insertFinancialMovementSchema.parse({ ...req.body, userId });
      
      const movement = await storage.createFinancialMovement(data);
      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating financial movement:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get(`${apiPrefix}/financial/summary`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const summary = await storage.getFinancialSummaryByUserIdAndMonth(userId, year, month);
      res.json(summary);
    } catch (error) {
      console.error("Error getting financial summary:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Farm settings routes
  app.get(`${apiPrefix}/farm`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({
        name: user.farmName,
        henCount: user.henCount,
        eggPrice: user.eggPrice,
        subscriptionStatus: user.subscriptionStatus
      });
    } catch (error) {
      console.error("Error getting farm info:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put(`${apiPrefix}/farm/hen-count`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const { henCount, reason } = req.body;
      
      if (typeof henCount !== 'number' || henCount < 0) {
        return res.status(400).json({ message: "Número de galinhas inválido" });
      }
      
      const data = insertHenCountHistorySchema.parse({
        userId,
        henCount,
        reason: reason || "Atualização manual"
      });
      
      const history = await storage.createHenCountHistory(data);
      
      const updatedUser = await storage.getUser(userId);
      
      res.json({
        history,
        currentHenCount: updatedUser?.henCount
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating hen count:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put(`${apiPrefix}/farm/egg-price`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const { eggPrice } = req.body;
      
      if (typeof eggPrice !== 'number' && typeof eggPrice !== 'string' || parseFloat(eggPrice) < 0) {
        return res.status(400).json({ message: "Preço inválido" });
      }
      
      const updatedUser = await storage.updateUser(userId, { 
        eggPrice: typeof eggPrice === 'string' ? eggPrice : eggPrice.toFixed(2) 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json({ eggPrice: updatedUser.eggPrice });
    } catch (error) {
      console.error("Error updating egg price:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get(`${apiPrefix}/hen-count-history`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const history = await storage.getHenCountHistoryByUserId(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error getting hen count history:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Dashboard stats
  app.get(`${apiPrefix}/dashboard/stats`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autorizado" });
      
      const userId = req.user!.id;
      
      // Get today's collections
      const today = new Date();
      const collections = await storage.getEggCollectionsByDate(userId, today);
      
      const morningCollection = collections.find(c => c.period === "morning");
      const afternoonCollection = collections.find(c => c.period === "afternoon");
      
      const morningCount = morningCollection?.eggCount || 0;
      const afternoonCount = afternoonCollection?.eggCount || 0;
      const todayCollection = morningCount + afternoonCount;
      
      // Get user info for hen count and posture calculation
      const user = await storage.getUser(userId);
      const henCount = user?.henCount || 0;
      const posturePercentage = henCount ? ((todayCollection / henCount) * 100).toFixed(2) : "0";
      
      // Get stock balance
      const stock = await storage.getStockBalanceByUserId(userId);
      
      // Get financial balance
      const finance = await storage.getFinancialBalanceByUserId(userId);
      
      // Get today's stock movements
      const todayMovements = await storage.getStockMovementsByUserId(userId);
      const todayStockIn = todayMovements
        .filter(m => m.movementType === "in" && format(m.movementDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
        .reduce((sum, m) => sum + m.eggCount, 0);
      
      const todayStockOut = todayMovements
        .filter(m => m.movementType === "out" && format(m.movementDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
        .reduce((sum, m) => sum + m.eggCount, 0);
      
      // Get monthly financial summary
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const monthlySummary = await storage.getFinancialSummaryByUserIdAndMonth(userId, currentYear, currentMonth);
      
      res.json({
        todayCollection: {
          total: todayCollection,
          morning: morningCount,
          afternoon: afternoonCount,
          posturePercentage
        },
        stock: {
          currentStock: stock?.eggCount || 0,
          todayIn: todayStockIn,
          todayOut: todayStockOut
        },
        financial: {
          balance: finance?.balance || "0",
          monthlyIncome: monthlySummary.incomes,
          monthlyExpenses: monthlySummary.expenses
        },
        farm: {
          name: user?.farmName,
          henCount,
          eggPrice: user?.eggPrice,
          subscriptionStatus: user?.subscriptionStatus
        }
      });
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
