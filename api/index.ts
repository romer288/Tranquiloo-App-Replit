/// <reference path="./dist-prod.d.ts" />
import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const forwardedPath = (
      req.headers['x-vercel-original-pathname'] ||
      req.headers['x-forwarded-uri'] ||
      req.headers['x-invoke-path']
    ) as string | undefined;
    if (forwardedPath) {
      const queryIndex = req.url?.indexOf('?') ?? -1;
      const queryString = queryIndex >= 0 ? req.url!.slice(queryIndex) : '';
      req.url = `${forwardedPath}${queryString}`;
    }
    return await handler(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
