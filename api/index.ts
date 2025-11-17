import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const baseUrl = `http://${req.headers.host}`;
    const forwardedUri = req.headers['x-forwarded-uri'] as string | undefined;
    const pathParam = req.query.path;

    if (pathParam) {
      let pathname: string;
      if (Array.isArray(pathParam)) {
        pathname = '/' + pathParam.join('/');
      } else {
        pathname = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
      }
      const url = new URL(pathname, baseUrl);
      url.search = new URL(req.url!, baseUrl).search; // preserve query if any
      req.url = url.pathname + url.search;
    } else if (forwardedUri) {
      const url = new URL(forwardedUri, baseUrl);
      req.url = url.pathname + url.search;
    }

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
