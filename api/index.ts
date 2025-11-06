import { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app, { ready } from '../server/index';

const handler = serverless(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  // Wait for routes to be registered before handling any requests
  await ready;
  return handler(req, res);
};
