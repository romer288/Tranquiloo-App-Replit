import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

// Configure serverless-http to not wait for empty event loop
// This prevents hanging on database connections or other async operations
const handler = serverless(app, {
  provider: 'aws' // Use AWS Lambda compatibility mode for Vercel
});

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

    // Update all URL-related properties that Express/serverless-http might read
    req.url = rewritten;
    (req as any).originalUrl = rewritten;
    (req as any).path = url.pathname;
    (req as any).query = Object.fromEntries(url.searchParams.entries());

    // Clear any cached URL parsing
    (req as any)._parsedUrl = undefined;
    (req as any)._parsedOriginalUrl = undefined;

    console.log('[Proxy] final state', {
      url: req.url,
      path: (req as any).path,
      query: (req as any).query
    });

    // Pass to Express and wait for response
    const result = await handler(req, res);
    console.log('[Proxy] handler completed, returning result');
    return result;
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
