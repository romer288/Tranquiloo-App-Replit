import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const invokePath = req.headers['x-invoke-path'] as string | undefined;
    if (invokePath) {
      const queryIndex = req.url?.indexOf('?') ?? -1;
      const queryString = queryIndex >= 0 ? req.url!.slice(queryIndex) : '';
      req.url = `${invokePath}${queryString}`;
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
