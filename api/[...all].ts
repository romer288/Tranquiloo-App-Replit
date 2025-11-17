import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../dist/prod.js';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const baseUrl = `http://${req.headers.host}`;
    const forwardedUri = req.headers['x-forwarded-uri'] as string | undefined;
    const forwardedPath = req.headers['x-vercel-original-pathname'] as string | undefined;

    let url: URL;
    if (forwardedUri) {
      url = new URL(forwardedUri, baseUrl);
    } else if (forwardedPath) {
      url = new URL(forwardedPath, baseUrl);
    } else {
      url = new URL(req.url!, baseUrl);
    }

    console.log('[Proxy] incoming', {
      originalUrl: req.url,
      forwardedUri,
      pathname: url.pathname,
      rawSearch: url.search,
      queryEntries: Array.from(url.searchParams.entries()),
      method: req.method,
      host: req.headers.host,
      queryPathParam: req.query.path
    });

    if (url.pathname.includes('/__debug')) {
      return res.status(200).json({
        originalReqUrl: req.url,
        pathname: url.pathname,
        searchParams: Array.from(url.searchParams.entries()),
        method: req.method,
        host: req.headers.host
      });
    }

    const pathParam = req.query.path;
    let pathname = url.pathname;
    if (pathParam) {
      if (Array.isArray(pathParam)) {
        pathname = '/' + pathParam.join('/');
      } else {
        pathname = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
      }
    }

    url.searchParams.delete('...all');
    url.searchParams.delete('path');

    const rewritten = pathname + url.search;
    req.url = rewritten;
    (req as any).originalUrl = rewritten;
    (req as any)._parsedUrl = undefined;

    console.log('[Proxy] final req.url', req.url);

    return app(req as any, res as any);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
