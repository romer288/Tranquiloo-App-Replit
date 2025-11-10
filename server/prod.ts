// In production (Vercel), environment variables are automatically injected
// No need for dotenv - it's only needed for local development
import cors from "cors";
// Note: ./routes/chat uses SQLite (better-sqlite3) which doesn't work in serverless
// Chat functionality is handled by ./routes (registerRoutes) with PostgreSQL
import aiChatRoutes from "./routes/ai-chat";
import wellnessRoutes from "./routes/wellness";
import path from "path";
import { fileURLToPath } from "url";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "public");

console.log('[Static Files] __dirname:', __dirname);
console.log('[Static Files] distPath:', distPath);
console.log('[Static Files] Resolved path:', path.resolve(__dirname, "public"));

// Initialize app with async routes
async function createApp() {
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
    console.log(`[Request] ${req.method} ${path}`);

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api") || path.startsWith("/auth")) {
        console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
      }
    });

    next();
  });

  // Register all routes (auth, therapist, etc.) - AWAIT to ensure they're registered
  try {
    await registerRoutes(app);
    console.log('✅ Routes registered successfully');
    // Log registered routes for debugging
    console.log('[Routes] Registered routes:', app._router.stack
      .filter((r: any) => r.route)
      .map((r: any) => `${Object.keys(r.route.methods)} ${r.route.path}`)
      .join(', '));
  } catch (err) {
    console.error('❌ Failed to register routes:', err);
  }

  // Serve static files only for requests with file extensions or specific paths
  // This prevents static middleware from catching API routes like /auth/google
  app.use(express.static(distPath, {
    index: false, // Don't serve index.html automatically
    setHeaders: (res, filepath) => {
      console.log('[Static] Serving:', filepath);
    }
  }));

  // Serve index.html for all non-API routes (SPA fallback)
  // This MUST be last, after all API routes
  app.use("*", (_req, res) => {
    console.log('[SPA Fallback] Serving index.html for:', _req.path);
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Unhandled error:", err);
  });



  return app;
}

// Export the Express app for Vercel serverless
export default await createApp();
