import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Vercel passes the catch-all segments in req.query.all
    // For example, /auth/google becomes req.query.all = ['auth', 'google']
    const catchAllParam = req.query?.all;

    // Special diagnostic endpoint to see what we're receiving
    if (req.url?.includes('/__debug')) {
      return res.status(200).json({
        originalReqUrl: req.url,
        catchAllParam: catchAllParam,
        queryObject: req.query,
        method: req.method,
      });
    }

    // Reconstruct the original path from the catch-all parameter
    if (catchAllParam) {
      const segments = Array.isArray(catchAllParam) ? catchAllParam : [catchAllParam];
      const originalPath = '/' + segments.join('/');

      // Preserve query string if present (remove the ...all query param)
      const url = new URL(req.url!, `http://${req.headers.host}`);
      url.searchParams.delete('all');
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
