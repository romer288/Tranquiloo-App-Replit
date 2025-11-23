import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

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
      // Always preserve the /api prefix so Express routes like /api/auth/signin are matched
      let pathname: string;
      if (Array.isArray(pathParam)) {
        pathname = '/api/' + pathParam.join('/');
      } else {
        const cleaned = pathParam.startsWith('/') ? pathParam.substring(1) : pathParam;
        pathname = '/api/' + cleaned;
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

    return handler(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
