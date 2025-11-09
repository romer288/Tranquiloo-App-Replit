/// <reference path="./dist-prod.d.ts" />
import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const originalPath =
      (req.headers['x-forwarded-uri'] as string | undefined) ||
      (req.headers['x-vercel-original-pathname'] as string | undefined) ||
      (req.headers['x-invoke-path'] as string | undefined) ||
      req.url;

    if (originalPath) {
      req.url = originalPath;
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
