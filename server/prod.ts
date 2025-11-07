// In production (Vercel), environment variables are automatically injected
// No need for dotenv - it's only needed for local development
import cors from "cors";
// Note: ./routes/chat uses SQLite (better-sqlite3) which doesn't work in serverless
// Chat functionality is handled by ./routes (registerRoutes) with PostgreSQL
import aiChatRoutes from "./routes/ai-chat";
import wellnessRoutes from "./routes/wellness";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

const app = express();

app.use(cors({
  origin: true, // Allow all origins in production (Vercel handles this)
  credentials: true,
}));

// Trust proxy to get correct protocol/host from Vercel
app.set('trust proxy', true);

app.use(express.json({ limit: '10mb' })); // Increased limit for audio data
app.use(express.urlencoded({ extended: false }));

// Note: /api/chat route removed - uses SQLite which doesn't work in serverless
// Chat functionality is available through registerRoutes() below
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/wellness", wellnessRoutes);

// Simple request logging for production
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Register all routes (auth, therapist, etc.)
registerRoutes(app).then(() => {
  console.log('✅ Routes registered successfully');
}).catch(err => {
  console.error('❌ Failed to register routes:', err);
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  console.error("Unhandled error:", err);
});

// Export the Express app for Vercel serverless
export default app;
