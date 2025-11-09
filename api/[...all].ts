import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Special diagnostic endpoint to see what we're receiving
    if (req.url?.includes('/__debug')) {
      return res.status(200).json({
        originalReqUrl: req.url,
        headers: {
          'x-forwarded-uri': req.headers['x-forwarded-uri'],
          'x-vercel-original-pathname': req.headers['x-vercel-original-pathname'],
          'x-forwarded-host': req.headers['x-forwarded-host'],
          'x-forwarded-proto': req.headers['x-forwarded-proto'],
          'x-vercel-deployment-url': req.headers['x-vercel-deployment-url'],
        },
        method: req.method,
        allHeaders: req.headers
      });
    }

    // Restore the original URL from Vercel headers before Express sees it
    // x-forwarded-uri contains the full original path + query string
    // x-vercel-original-pathname contains just the pathname (not guaranteed on all accounts)
    const originalPath =
      (req.headers['x-forwarded-uri'] as string) ||
      (req.headers['x-vercel-original-pathname'] as string) ||
      req.url;

    if (originalPath) {
      req.url = originalPath;
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
