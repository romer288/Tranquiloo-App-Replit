// Goals service - migrated from Supabase to new API endpoints
import { Goal, GoalProgress, GoalWithProgress } from '@/types/goals';

const mapGoalPayload = (
  goal: any,
  userId?: string
) => {
  const payload: Record<string, unknown> = {
    title: goal.title,
    category: goal.category,
    frequency: goal.frequency,
    startDate: goal.start_date,
    isActive: goal.is_active ?? goal.isActive ?? true,
  };

  if (goal.description) {
    payload.description = goal.description;
  }

  if (goal.target_value !== undefined && goal.target_value !== '') {
    const numericTarget = Number(goal.target_value);
    if (!Number.isNaN(numericTarget)) {
      // API expects this as a string since the column is stored as TEXT in SQLite
      payload.targetValue = numericTarget.toString();
    }
  }

  if (goal.unit) {
    payload.unit = goal.unit;
  }

  if (goal.end_date) {
    payload.endDate = goal.end_date;
  }

  if (userId) {
    payload.userId = userId;
  }

  return payload;
};

const calculateCompletionRate = (goal: any): number => {
  if (!goal.goal_progress || goal.goal_progress.length === 0) return 0;
  
  const today = new Date();
  const startDate = new Date(goal.start_date);
  const daysSinceStart = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let expectedEntries: number;
  switch (goal.frequency) {
    case 'daily':
      expectedEntries = Math.max(1, daysSinceStart);
      break;
    case 'weekly':
      expectedEntries = Math.max(1, Math.ceil(daysSinceStart / 7));
      break;
    case 'monthly':
      expectedEntries = Math.max(1, Math.ceil(daysSinceStart / 30));
      break;
    default:
      expectedEntries = 1;
  }
  
  const actualEntries = goal.goal_progress.length;
  return Math.min(100, (actualEntries / expectedEntries) * 100);
};

const normalizeGoalCategory = (category: string | undefined): Goal['category'] => {
  switch ((category || '').toLowerCase()) {
    case 'self-care':
    case 'coping-skills':
      return 'self-care';
    case 'therapy':
    case 'anxiety-management':
    case 'behavioral':
    case 'exposure-therapy':
      return 'therapy';
    case 'mindfulness':
      return 'mindfulness';
    case 'exercise':
      return 'exercise';
    case 'social':
    case 'social-skills':
      return 'social';
    case 'work':
      return 'work';
    case 'sleep':
      return 'sleep';
    case 'nutrition':
      return 'nutrition';
    default:
      return 'treatment';
  }
};

export const goalsService = {
  async getUserGoals(): Promise<GoalWithProgress[]> {
    try {
      // Get current user from auth service
      const authUser = localStorage.getItem('auth_user');
      if (!authUser) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(authUser);
      
      const response = await fetch(`/api/users/${user.id}/goals`);
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }

      const goals = await response.json();
      
      return goals.map((goal: any) => ({
        ...goal,
        category: normalizeGoalCategory(goal.category),
        frequency: (goal.frequency as Goal['frequency']) ?? 'weekly',
        source: goal.source,
        latest_progress: goal.goal_progress?.[0] || null,
        progress_history: goal.goal_progress || [],
        average_score: goal.goal_progress?.length > 0 
          ? goal.goal_progress.reduce((sum: number, p: any) => sum + p.score, 0) / goal.goal_progress.length
          : 0,
        completion_rate: calculateCompletionRate(goal)
      }));
    } catch (error) {
      console.error('Error fetching user goals:', error);
      throw error;
    }
  },

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (!authUser) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(authUser);

      const payload = mapGoalPayload(goal, user.id);
      console.log('createGoal payload', payload);

      const response = await fetch('/api/user-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const authUser = localStorage.getItem('auth_user');
      const user = authUser ? JSON.parse(authUser) : null;

      const updatePayload = mapGoalPayload(updates, updates.user_id || updates.userId || user?.id);
      const response = await fetch(`/api/user-goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  async addGoalProgress(goalId: string, progress: { userId: string; score: number; recordedAt: string; notes?: string }): Promise<GoalProgress> {
    try {
      const payload: Record<string, unknown> = {
        userId: progress.userId,
        goalId,
        score: progress.score,
        recordedAt: progress.recordedAt,
      };

      if (progress.notes && progress.notes.trim().length > 0) {
        payload.notes = progress.notes;
      }
      const response = await fetch('/api/goal-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to add goal progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding goal progress:', error);
      throw error;
    }
  },

  async recordProgress(goalId: string, score: number, notes?: string) {
    const authUser = localStorage.getItem('auth_user');
    if (!authUser) {
      throw new Error('User not authenticated');
    }
    const user = JSON.parse(authUser);
    return this.addGoalProgress(goalId, {
      userId: user.id,
      goalId,
      score,
      notes,
      recordedAt: new Date().toISOString().split('T')[0],
    } as any);
  },

  async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/user-goals/${goalId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }
};
