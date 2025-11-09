import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Debug: Log what we're receiving
    console.log('=== Catch-all Handler Debug ===');
    console.log('Original req.url:', req.url);
    console.log('x-forwarded-uri:', req.headers['x-forwarded-uri']);
    console.log('x-vercel-original-pathname:', req.headers['x-vercel-original-pathname']);
    console.log('All headers:', JSON.stringify(req.headers, null, 2));

    // Restore the original URL from Vercel headers before Express sees it
    // x-forwarded-uri contains the full original path + query string
    // x-vercel-original-pathname contains just the pathname (not guaranteed on all accounts)
    const originalPath =
      (req.headers['x-forwarded-uri'] as string) ||
      (req.headers['x-vercel-original-pathname'] as string) ||
      req.url;

    console.log('Restored path:', originalPath);

    if (originalPath) {
      req.url = originalPath;
    }

    console.log('Final req.url before Express:', req.url);
    console.log('================================');

    return await handler(req, res);
  } catch (error) {
    console.error('Serverless catch-all handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
