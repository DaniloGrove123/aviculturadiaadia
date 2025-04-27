import { db } from "./index";
import { 
  users, 
  henCountHistory, 
  eggCollections, 
  stockBalance,
  financialBalance,
  stockMovements,
  financialMovements
} from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seed...");

    // Check if there are existing users to avoid duplicate data
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      console.log("Database already has users, skipping seed.");
      return;
    }

    // Create demo user
    console.log("Creating demo user...");
    const hashedPassword = await hashPassword("123456");

    const [demoUser] = await db.insert(users).values({
      username: "demo",
      password: hashedPassword,
      name: "João da Silva",
      farmName: "Granja Feliz",
      henCount: 120,
      eggPrice: "10.00",
      subscriptionStatus: "free"
    }).returning();

    console.log(`Created demo user with ID: ${demoUser.id}`);

    // Create initial hen count history
    await db.insert(henCountHistory).values({
      userId: demoUser.id,
      henCount: 150,
      reason: "Configuração inicial",
      changeDate: new Date(),
    });

    // Create initial stock balance
    await db.insert(stockBalance).values({
      userId: demoUser.id,
      eggCount: 546,
      updatedAt: new Date()
    });

    // Create initial financial balance
    await db.insert(financialBalance).values({
      userId: demoUser.id,
      balance: "2450.00",
      updatedAt: new Date()
    });

    // Create some egg collections for the past few days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const collections = [
      {
        userId: demoUser.id,
        collectionDate: today,
        period: "morning",
        eggCount: 72,
        posturePercentage: "48.00",
        notes: "Coleta normal"
      },
      {
        userId: demoUser.id,
        collectionDate: today,
        period: "afternoon",
        eggCount: 48,
        posturePercentage: "32.00",
        notes: "Coleta normal"
      },
      {
        userId: demoUser.id,
        collectionDate: yesterday,
        period: "morning",
        eggCount: 75,
        posturePercentage: "50.00",
        notes: "Coleta normal"
      },
      {
        userId: demoUser.id,
        collectionDate: yesterday,
        period: "afternoon",
        eggCount: 45,
        posturePercentage: "30.00",
        notes: "Coleta normal"
      }
    ];

    console.log("Creating egg collections...");
    for (const collection of collections) {
      await db.insert(eggCollections).values({ ...collection, collectionDate: typeof collection.collectionDate === "string" ? collection.collectionDate : collection.collectionDate.toISOString().slice(0, 10) });
    }

    // Create stock movements
    const stockMovementsData = [
      {
        userId: demoUser.id,
        movementType: "in",
        eggCount: 72,
        movementDate: today,
        notes: "Coleta de manhã"
      },
      {
        userId: demoUser.id,
        movementType: "in",
        eggCount: 48,
        movementDate: today,
        notes: "Coleta de tarde"
      },
      {
        userId: demoUser.id,
        movementType: "in",
        eggCount: 75,
        movementDate: yesterday,
        notes: "Coleta de manhã"
      },
      {
        userId: demoUser.id,
        movementType: "in",
        eggCount: 45,
        movementDate: yesterday,
        notes: "Coleta de tarde"
      },
      {
        userId: demoUser.id,
        movementType: "out",
        eggCount: 120,
        movementDate: yesterday,
        notes: "Venda para cliente local"
      }
    ];

    console.log("Creating stock movements...");
    for (const movement of stockMovementsData) {
      await db.insert(stockMovements).values({ ...movement, movementDate: typeof movement.movementDate === "string" ? movement.movementDate : movement.movementDate.toISOString().slice(0, 10), financialMovementId: null });
    }

    // Create financial movements
    const financialMovementsData = [
      {
        userId: demoUser.id,
        movementType: "income",
        category: "Venda de ovos",
        amount: "100.00",
        movementDate: yesterday,
        paymentMethod: "Dinheiro",
        contact: "Cliente Local",
        notes: "120"
      },
      {
        userId: demoUser.id,
        movementType: "expense",
        category: "Ração",
        amount: "250.00",
        movementDate: new Date(yesterday.setDate(yesterday.getDate() - 5)).toISOString().slice(0, 10),
        paymentMethod: "Transferência",
        contact: "Fornecedor de Ração",
        notes: "Compra mensal de ração"
      },
      {
        userId: demoUser.id,
        movementType: "income",
        category: "Venda de ovos",
        amount: "300.00",
        movementDate: new Date(yesterday.setDate(yesterday.getDate() - 3)).toISOString().slice(0, 10),
        paymentMethod: "Pix",
        contact: "Mercearia Central",
        notes: "360"
      }
    ];

    console.log("Creating financial movements...");
    for (const movement of financialMovementsData) {
      await db.insert(financialMovements).values({ ...movement, movementType: movement.movementType as "income" | "expense", movementDate: typeof movement.movementDate === "string" ? movement.movementDate : movement.movementDate.toISOString().slice(0, 10) });
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
