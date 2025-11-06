import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * POST /api/wellness/track
 * Submit wellness tracking entry
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      moodScore,
      energyLevel,
      heartRateFeeling,
      sleepQuality,
      stressLevel,
      notes
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabase
      .from('wellness_tracking')
      .insert({
        user_id: userId,
        mood_score: moodScore,
        energy_level: energyLevel,
        heart_rate_feeling: heartRateFeeling,
        sleep_quality: sleepQuality,
        stress_level: stressLevel,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ entry: data });

  } catch (error: any) {
    console.error('Error tracking wellness:', error);
    res.status(500).json({
      error: 'Failed to save wellness entry',
      details: error.message
    });
  }
});

/**
 * GET /api/wellness/history/:userId
 * Get wellness tracking history for a user
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30, limit = 100 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const { data, error} = await supabase
      .from('wellness_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', daysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ entries: data || [] });

  } catch (error: any) {
    console.error('Error fetching wellness history:', error);
    res.status(500).json({ error: 'Failed to fetch wellness history' });
  }
});

/**
 * GET /api/wellness/trends/:userId
 * Get wellness trends (averages over time)
 */
router.get('/trends/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const { data, error } = await supabase
      .rpc('get_wellness_trends', {
        p_user_id: userId,
        days_back: Number(days),
      });

    if (error) throw error;

    res.json({ trends: data || [] });

  } catch (error: any) {
    console.error('Error fetching wellness trends:', error);
    res.status(500).json({ error: 'Failed to fetch wellness trends' });
  }
});

/**
 * GET /api/wellness/summary/:userId
 * Get wellness summary stats
 */
router.get('/summary/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const { data, error } = await supabase
      .from('wellness_tracking')
      .select('mood_score, energy_level, stress_level, sleep_quality, created_at')
      .eq('user_id', userId)
      .gte('created_at', daysAgo.toISOString());

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({
        summary: {
          avgMood: null,
          avgStress: null,
          avgSleep: null,
          entryCount: 0,
          daysTracked: 0,
        }
      });
    }

    // Calculate averages
    const avgMood = data.reduce((sum, e) => sum + (e.mood_score || 0), 0) / data.length;
    const avgStress = data.reduce((sum, e) => sum + (e.stress_level || 0), 0) / data.length;
    const avgSleep = data.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) / data.length;

    // Count unique days
    const uniqueDays = new Set(data.map(e => e.created_at?.split('T')[0])).size;

    res.json({
      summary: {
        avgMood: avgMood.toFixed(1),
        avgStress: avgStress.toFixed(1),
        avgSleep: avgSleep.toFixed(1),
        entryCount: data.length,
        daysTracked: uniqueDays,
      }
    });

  } catch (error: any) {
    console.error('Error fetching wellness summary:', error);
    res.status(500).json({ error: 'Failed to fetch wellness summary' });
  }
});

/**
 * DELETE /api/wellness/:entryId
 * Delete a wellness entry
 */
router.delete('/:entryId', async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;

    const { error } = await supabase
      .from('wellness_tracking')
      .delete()
      .eq('id', entryId);

    if (error) throw error;

    res.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting wellness entry:', error);
    res.status(500).json({ error: 'Failed to delete wellness entry' });
  }
});

export default router;
