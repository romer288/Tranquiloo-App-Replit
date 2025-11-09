import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Parse the URL to extract query parameters
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const catchAllParam = url.searchParams.get('...all');

    // Special diagnostic endpoint to see what we're receiving
    if (req.url?.includes('/__debug')) {
      return res.status(200).json({
        originalReqUrl: req.url,
        catchAllParam: catchAllParam,
        allSearchParams: Array.from(url.searchParams.entries()),
        pathname: url.pathname,
        method: req.method,
      });
    }

    // Reconstruct the original path from the catch-all parameter
    if (catchAllParam) {
      // The catch-all param contains the original path
      const originalPath = '/' + catchAllParam;

      // Remove the internal ...all query param
      url.searchParams.delete('...all');
      const queryString = url.search;

      req.url = originalPath + queryString;
    }

    return await handler(req, res);
  } catch (error) {
    console.error('Serverless catch-all handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
