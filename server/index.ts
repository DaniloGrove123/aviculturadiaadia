import { createApp } from './app';
import { setupVite, serveStatic, log } from './vite';
import { createServer } from 'http';
import type { Request, Response, NextFunction } from 'express';

(async () => {
  const app = await createApp();

  // Logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    let capturedJsonResponse: any;
    const originalJson = res.json;
    res.json = function (bodyJson: any, ...args: any[]) {
      capturedJsonResponse = bodyJson;
      return originalJson.apply(this, [bodyJson, ...args]);
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api')) {
        let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + '…';
        }
        log(logLine);
      }
    });

    next();
  });

  // Create HTTP server
  const server = createServer(app);

  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({ port, host: '0.0.0.0', reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
