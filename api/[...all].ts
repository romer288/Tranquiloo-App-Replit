import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../dist/prod.js';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Parse the URL - Vercel preserves the pathname correctly
    const url = new URL(req.url!, `http://${req.headers.host}`);

    console.log('[Direct] incoming', {
      originalUrl: req.url,
      pathname: url.pathname,
      method: req.method
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

    // Reconstruct clean URL
    req.url = url.pathname + url.search;

    console.log('[Direct] calling Express with url:', req.url);

    // Call Express directly without serverless-http wrapper
    // This avoids the event loop hanging issue
    return app(req as any, res as any);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
