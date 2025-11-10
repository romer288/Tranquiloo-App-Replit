import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default async (req: VercelRequest, res: VercelResponse) => {
  const debug: any = {
    request: {
      method: req.method,
      url: req.url,
      path: req.url,
      headers: Object.keys(req.headers).reduce((acc, key) => {
        acc[key] = req.headers[key];
        return acc;
      }, {} as Record<string, any>)
    },
    environment: {
      cwd: process.cwd(),
      vercelRegion: process.env.VERCEL_REGION,
      nodeEnv: process.env.NODE_ENV,
    },
    filesystem: {
      cwdContents: [] as string[],
      distExists: false,
      distContents: [] as string[],
      distPublicExists: false,
      distPublicContents: [] as string[],
      manifestExists: false,
      manifestPath: '',
      manifestContent: null as any
    }
  };

  try {
    // Check current working directory
    debug.filesystem.cwdContents = fs.readdirSync(process.cwd());

    // Check api directory
    const apiPath = path.join(process.cwd(), 'api');
    debug.filesystem.apiExists = fs.existsSync(apiPath);
    if (debug.filesystem.apiExists) {
      debug.filesystem.apiContents = fs.readdirSync(apiPath);
    }

    // Check if dist exists
    const distPath = path.join(process.cwd(), 'dist');
    debug.filesystem.distExists = fs.existsSync(distPath);
    if (debug.filesystem.distExists) {
      debug.filesystem.distContents = fs.readdirSync(distPath);
    }

    // Check if dist/public exists
    const publicPath = path.join(process.cwd(), 'dist', 'public');
    debug.filesystem.distPublicExists = fs.existsSync(publicPath);
    if (debug.filesystem.distPublicExists) {
      debug.filesystem.distPublicContents = fs.readdirSync(publicPath);
    }

    // Check if manifest.json exists
    const manifestPath = path.join(process.cwd(), 'dist', 'public', 'manifest.json');
    debug.filesystem.manifestPath = manifestPath;
    debug.filesystem.manifestExists = fs.existsSync(manifestPath);

    if (debug.filesystem.manifestExists) {
      debug.filesystem.manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }

  } catch (error) {
    debug.error = error instanceof Error ? error.message : String(error);
  }

  res.status(200).json(debug);
};
