declare module '../dist/prod.js' {
  import type express from 'express';
  const app: express.Express;
  export default app;
}
