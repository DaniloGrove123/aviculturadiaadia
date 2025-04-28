import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { setupAuth } from './auth';
import { registerRoutes } from './routes';

export async function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Setup session and authentication
  setupAuth(app);

  // Register API routes
  await registerRoutes(app);

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
  });

  return app;
}
