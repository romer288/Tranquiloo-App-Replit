import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Parse URL to get the pathname and clean query params
    const url = new URL(req.url!, `http://${req.headers.host}`);

    // Special diagnostic endpoint
    if (url.pathname.includes('/__debug')) {
      return res.status(200).json({
        originalReqUrl: req.url,
        pathname: url.pathname,
        cleanedSearchParams: Array.from(url.searchParams.entries()).filter(
          ([key]) => !key.startsWith('...') && key !== 'path'
        ),
        method: req.method,
        host: req.headers.host,
        note: 'This is the __all__ handler'
      });
    }

    // Remove Vercel's internal query params (...all, path)
    url.searchParams.delete('...all');
    url.searchParams.delete('path');

    // Reconstruct the clean URL with original pathname and cleaned query string
    req.url = url.pathname + url.search;

    // Pass the cleaned request to Express
    return await handler(req, res);
  } catch (error) {
    console.error('Serverless __all__ handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
