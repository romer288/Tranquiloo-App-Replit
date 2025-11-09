import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // This function receives requests rewritten from non-static paths
    // Vercel preserves the original URL in req.url, so we can pass it directly to Express

    // Special diagnostic endpoint
    if (req.url?.includes('/__debug')) {
      return res.status(200).json({
        originalReqUrl: req.url,
        method: req.method,
        host: req.headers.host,
        note: 'This is the __all__ handler - req.url should already be the original path'
      });
    }

    // Pass the request directly to Express - req.url already contains the original path
    return await handler(req, res);
  } catch (error) {
    console.error('Serverless __all__ handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
