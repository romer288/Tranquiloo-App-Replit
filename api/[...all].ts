import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Parse the URL - Vercel preserves the pathname correctly
    const url = new URL(req.url!, `http://${req.headers.host}`);

    console.log('[Proxy] incoming', {
      originalUrl: req.url,
      pathname: url.pathname,
      rawSearch: url.search,
      queryEntries: Array.from(url.searchParams.entries()),
      method: req.method,
      host: req.headers.host,
      queryAll: req.query.all
    });

    // Special diagnostic endpoint
    if (url.pathname.includes('/__debug')) {
      return res.status(200).json({
        originalReqUrl: req.url,
        pathname: url.pathname,
        searchParams: Array.from(url.searchParams.entries()),
        method: req.method,
        host: req.headers.host
      });
    }

    // Clean up Vercel's internal query params
    url.searchParams.delete('...all');
    url.searchParams.delete('path');

    // Reconstruct clean URL: pathname is already correct (e.g., /auth/google)
    // Just need to append the cleaned query string
    const rewritten = url.pathname + url.search;
    console.log('[Proxy] rewrote URL', { rewritten });
    req.url = rewritten;
    (req as any).originalUrl = rewritten;
    (req as any)._parsedUrl = undefined;

    // Pass to Express
    return await handler(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
