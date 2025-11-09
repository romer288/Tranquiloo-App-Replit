import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../dist/prod.js';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const segmentsParam = req.query.all;
    const segmentsArray = Array.isArray(segmentsParam)
      ? segmentsParam
      : typeof segmentsParam === 'string'
        ? [segmentsParam]
        : [];

    const reconstructedPath =
      segmentsArray.length > 0 ? `/${segmentsArray.join('/')}` : '/';

    const queryStart = req.url?.indexOf('?') ?? -1;
    const queryString = queryStart >= 0 ? req.url!.slice(queryStart) : '';

    req.url = `${reconstructedPath}${queryString}`;

    return await handler(req, res);
  } catch (error) {
    console.error('Serverless catch-all handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
