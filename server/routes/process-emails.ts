import express, { Request, Response } from 'express';
import { emailService } from '../emailService';

const router = express.Router();

/**
 * POST /api/process-emails
 * Manually trigger email queue processing
 * Can be called by Vercel Cron or manually for testing
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('[Process Emails] Starting email queue processing...');

    // Process all pending emails in the queue
    await emailService.processEmailQueue();

    console.log('[Process Emails] Email queue processing completed');

    res.json({
      success: true,
      message: 'Email queue processed successfully'
    });
  } catch (error: any) {
    console.error('[Process Emails] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process email queue',
      details: error.message
    });
  }
});

/**
 * GET /api/process-emails
 * Same as POST but for easier manual testing in browser
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('[Process Emails] Starting email queue processing (GET)...');

    await emailService.processEmailQueue();

    console.log('[Process Emails] Email queue processing completed');

    res.json({
      success: true,
      message: 'Email queue processed successfully'
    });
  } catch (error: any) {
    console.error('[Process Emails] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process email queue',
      details: error.message
    });
  }
});

export default router;
