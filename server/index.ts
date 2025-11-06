import dotenv from "dotenv";
dotenv.config(); // MUST be first before any other imports that use process.env

import cors from "cors";
import chatRoutes from "./routes/chat";
import aiChatRoutes from "./routes/ai-chat";
import wellnessRoutes from "./routes/wellness";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from "ws";
import { videoCallSignaling } from "./routes/video-call";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173"],
  credentials: true,
}));

// Trust proxy to get correct protocol/host from Replit's HTTPS proxy
app.set('trust proxy', true);

app.use(express.json({ limit: '10mb' })); // Increased limit for audio data
app.use(express.urlencoded({ extended: false }));

app.use("/api/chat", chatRoutes);
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/wellness", wellnessRoutes);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Only log minimal metadata to avoid leaking sensitive data
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

// Register routes immediately for serverless (synchronously for Vercel)
let routesRegistered = false;
const initPromise = (async () => {
  const server = await registerRoutes(app);
  routesRegistered = true;

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // Don't rethrow; just log to avoid crashing the process
    console.error("Unhandled error:", err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Setup WebSocket server for video calls (only after vite setup to avoid conflicts)
  const wss = new WebSocketServer({
    noServer: true  // Don't attach automatically, we'll handle upgrades manually
  });

  // Handle WebSocket upgrades manually for video calls only
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', 'http://localhost').pathname;

    // Only handle video call WebSocket, let Vite handle its own
    if (pathname === '/ws/video-call') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, req) => {
    videoCallSignaling.handleConnection(ws, req);
  });

  console.log('📹 Video call WebSocket server initialized on /ws/video-call');

  // Only listen when running locally (not on Vercel)
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.RUNNING_LOCALLY === 'true'
  ) {
    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);

      // Start email service after server is running
      import('./emailService').then(({ emailService }) => {
        emailService.startEmailProcessor();
        console.log('✉️ Email service started - processing queue every 30 seconds');
      }).catch(err => {
        console.error('Failed to start email service:', err);
      });
    });
  }
})();

// Export app initialization promise for Vercel serverless
// This ensures routes are registered before handling requests
export const ready = initPromise;

// Export the Express app for Vercel serverless
export default app;
