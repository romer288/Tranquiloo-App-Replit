import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

// Lazily load the Express app, preferring the built file (dist/prod.js).
// If the build artifact is missing (e.g., during dev), fall back to source.
let cachedApp: any;
const getApp = async () => {
  if (cachedApp) return cachedApp;

  const distPath = path.join(process.cwd(), 'dist', 'prod.js');
  try {
    if (fs.existsSync(distPath)) {
      console.log('[Serverless] Loading app from dist/prod.js');
      const { default: app } = await import('../dist/prod.js');
      cachedApp = app;
      return cachedApp;
    }
    throw new Error('dist/prod.js not found');
  } catch (err) {
    console.warn('[Serverless] Falling back to server/prod.ts', err instanceof Error ? err.message : err);
    const { default: app } = await import('../server/prod');
    cachedApp = app;
    return cachedApp;
  }
};

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const baseUrl = `http://${req.headers.host}`;
    const forwardedUri = req.headers['x-forwarded-uri'] as string | undefined;
    const pathParam = req.query.path;

    // Trace request rewrite so we can see what reaches Express in Vercel logs
    const originalUrl = req.url;
    console.log('[Serverless] Incoming request', {
      method: req.method,
      originalUrl,
      forwardedUri,
      pathParam
    });

    if (pathParam) {
      // Normalize to the correct Express route:
      // - static assets (js/css/png/ico/json/map/etc.) should NOT keep /api prefix
      // - /auth/* should stay at /auth/*
      // - everything else stays under /api/*
      const normalize = (raw: string) => {
        const cleaned = raw.startsWith('/') ? raw.substring(1) : raw;
        const isAsset = /\.[a-zA-Z0-9]+$/.test(cleaned) &&
          cleaned.match(/\.(js|css|png|jpe?g|gif|svg|webp|ico|json|map|txt|woff2?)$/i);

        // Keep OAuth browser flows under /auth/*, but send everything else (including /auth/signin) to /api/*
        const isOAuthFlow =
          cleaned.startsWith('auth/google') ||
          cleaned.startsWith('auth/facebook');

        if (isAsset || isOAuthFlow) {
          return '/' + cleaned;
        }
        return '/api/' + cleaned;
      };

      let pathname: string;
      if (Array.isArray(pathParam)) {
        const joined = pathParam.join('/');
        pathname = normalize(joined);
      } else {
        pathname = normalize(pathParam);
      }
      const url = new URL(pathname, baseUrl);
      url.search = new URL(req.url!, baseUrl).search; // preserve query if any
      req.url = url.pathname + url.search;
    } else if (forwardedUri) {
      const url = new URL(forwardedUri, baseUrl);
      req.url = url.pathname + url.search;
    }

    console.log('[Serverless] Normalized URL for Express:', req.url);

    (req as any).originalUrl = req.url;
    (req as any)._parsedUrl = undefined;

    // Hand off directly to the Express app (no serverless-http) to preserve req.url
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
