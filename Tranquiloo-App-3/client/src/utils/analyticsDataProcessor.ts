import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';

export interface TriggerData {
  trigger: string;
  count: number;
  avgSeverity: number;
  color: string;
  category: string;
  description: string;
  whyExplanation: string;
  relatedTriggers?: string[];
  // New patient narrative fields
  memoryContext?: string;
  aggravators?: string[];
  impact?: string;
  lastEpisodeDate?: string;
  trend?: string;
  patientNarrative?: string;
  evidenceLine?: string;
}

export interface SeverityDistribution {
  range: string;
  count: number;
  color: string;
}

// Helper to ensure triggers is always an array
const ensureTriggersArray = (triggers: any): string[] => {
  if (!triggers) return [];
  if (Array.isArray(triggers)) return triggers;
  if (typeof triggers === 'string') {
    try {
      const parsed = JSON.parse(triggers);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Try splitting by comma if not valid JSON
      return triggers.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

// Helper to get the most recent episode date from analyses
const getLastEpisodeDate = (analyses: ClaudeAnxietyAnalysis[], trigger: string): string => {
  const relevantAnalysis = analyses
    .filter(a => {
      const triggers = ensureTriggersArray(a.triggers);
      return triggers.some((t: string) => t.toLowerCase().includes(trigger.toLowerCase().split(' ')[0]));
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    })[0];
  
  const createdDate = relevantAnalysis?.createdAt || relevantAnalysis?.created_at;
  if (createdDate) {
    const date = new Date(createdDate);
    const today = new Date();
    const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'today';
    if (daysAgo === 1) return 'yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return 'recently';
};

// Helper to calculate trend
const calculateTrend = (analyses: ClaudeAnxietyAnalysis[], trigger: string): string => {
  const relevantAnalyses = analyses.filter(a => {
    const triggers = ensureTriggersArray(a.triggers);
    return triggers.some((t: string) => t.toLowerCase().includes(trigger.toLowerCase().split(' ')[0]));
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
    const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
    return dateB - dateA;
  });
  
  if (relevantAnalyses.length < 2) return 'stable';
  
  // Compare recent vs older average severity
  const midpoint = Math.floor(relevantAnalyses.length / 2);
  const recent = relevantAnalyses.slice(0, midpoint);
  const older = relevantAnalyses.slice(midpoint);
  
  const recentAvg = recent.reduce((sum, a) => sum + (a.anxietyLevel || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, a) => sum + (a.anxietyLevel || 0), 0) / older.length;
  
  if (recentAvg > olderAvg + 1) return 'increasing';
  if (recentAvg < olderAvg - 1) return 'decreasing';
  return 'stable';
};

// Trigger categorization and descriptions
const getTriggerMetadata = (trigger: string, analyses: ClaudeAnxietyAnalysis[], categoryData: any) => {
  const lowerTrigger = trigger.toLowerCase();
  const { count, avgSeverity, relatedTriggers = [] } = categoryData;
  
  // Analyze patterns in the client's responses for deeper insights
  const getClientPatterns = () => {
    const relevantAnalyses = analyses.filter(analysis => {
      const triggers = ensureTriggersArray(analysis.triggers);
      return triggers.some((t: string) => t.toLowerCase().includes(lowerTrigger.split(' ')[0]));
    });
    
    const cognitiveDistortions = relevantAnalyses.flatMap(a => a.cognitiveDistortions || []);
    const escalationPattern = relevantAnalyses.filter(a => a.escalationDetected).length;
    const crisisLevels = relevantAnalyses.map(a => a.crisisRiskLevel).filter(Boolean);
    const sentiments = relevantAnalyses.map(a => a.sentiment).filter(Boolean);
    
    return { cognitiveDistortions, escalationPattern, crisisLevels, sentiments, relevantAnalyses };
  };
  
  const patterns = getClientPatterns();
  
  if (lowerTrigger.includes('social') || lowerTrigger.includes('people') || lowerTrigger.includes('attractive') || lowerTrigger.includes('judgment') || lowerTrigger.includes('interaction')) {
    const lastEpisode = getLastEpisodeDate(analyses, trigger);
    const trend = calculateTrend(analyses, trigger);
    const timeWindow = count > 10 ? 'past month' : 'past two weeks';
    
    // Build narrative components
    const memories = [];
    const aggravators = [];
    const impacts = [];
    
    if (relatedTriggers.some((t: string) => t.includes('attractive'))) {
      memories.push('encounters with attractive individuals');
      aggravators.push('eye contact', 'unexpected encounters');
      impacts.push('avoidance of social venues');
    }
    if (relatedTriggers.some((t: string) => t.includes('judgment'))) {
      memories.push('past experiences of criticism');
      aggravators.push('being observed', 'performance situations');
      impacts.push('social withdrawal');
    }
    if (relatedTriggers.some((t: string) => t.includes('interaction'))) {
      memories.push('difficult past conversations');
      aggravators.push('group settings', 'unfamiliar people');
      impacts.push('limiting social interactions');
    }
    
    const memoryContext = memories.length > 0 ? memories[0] : 'social situations';
    const primaryAggravators = aggravators.length > 0 ? aggravators.slice(0, 2) : ['crowded spaces', 'unexpected attention'];
    const primaryImpact = impacts.length > 0 ? impacts[0] : 'social avoidance';
    
    // Generate patient narrative
    const patientNarrative = memories.length > 0 
      ? `Patient reports anxiety with social situations, recalling ${memoryContext}. Symptoms intensify with ${primaryAggravators.join(' and ')}, leading to ${primaryImpact}.`
      : `Pattern noted for social anxiety; limited details recorded. Encourage logging when/where/body cues to refine the plan.`;
    
    const evidenceLine = `Evidence: Last episode ${lastEpisode} (${avgSeverity.toFixed(0)}/10); ${count} episodes in ${timeWindow}; ${trend} vs prior.`;
    
    return {
      category: 'Social Anxiety',
      description: patientNarrative,
      whyExplanation: '', // Remove old clinical insight
      memoryContext,
      aggravators: primaryAggravators,
      impact: primaryImpact,
      lastEpisodeDate: lastEpisode,
      trend,
      patientNarrative,
      evidenceLine,
      relatedTriggers
    };
  }
  
  if (lowerTrigger.includes('work') || lowerTrigger.includes('job') || lowerTrigger.includes('career') || lowerTrigger.includes('academic') || lowerTrigger.includes('employment')) {
    const lastEpisode = getLastEpisodeDate(analyses, trigger);
    const trend = calculateTrend(analyses, trigger);
    const timeWindow = count > 10 ? 'past month' : 'past two weeks';
    
    const memories = [];
    const aggravators = [];
    const impacts = [];
    
    if (relatedTriggers.some((t: string) => t.includes('performance'))) {
      memories.push('past performance reviews');
      aggravators.push('deadlines', 'evaluations');
      impacts.push('procrastination');
    }
    if (relatedTriggers.some((t: string) => t.includes('failure'))) {
      memories.push('previous setbacks');
      aggravators.push('high-stakes tasks', 'competition');
      impacts.push('self-doubt');
    }
    if (relatedTriggers.some((t: string) => t.includes('immigration'))) {
      memories.push('visa concerns');
      aggravators.push('legal deadlines', 'documentation');
      impacts.push('career limitations');
    }
    
    const memoryContext = memories.length > 0 ? memories[0] : 'workplace challenges';
    const primaryAggravators = aggravators.length > 0 ? aggravators.slice(0, 2) : ['time pressure', 'performance expectations'];
    const primaryImpact = impacts.length > 0 ? impacts[0] : 'work avoidance';
    
    const patientNarrative = memories.length > 0
      ? `Patient reports anxiety with work/academic situations, recalling ${memoryContext}. Symptoms intensify with ${primaryAggravators.join(' and ')}, leading to ${primaryImpact}.`
      : `Pattern noted for work/academic stress; limited details recorded. Encourage logging when/where/body cues to refine the plan.`;
    
    const evidenceLine = `Evidence: Last episode ${lastEpisode} (${avgSeverity.toFixed(0)}/10); ${count} episodes in ${timeWindow}; ${trend} vs prior.`;
    
    return {
      category: 'Work/Academic Stress',
      description: patientNarrative,
      whyExplanation: '',
      memoryContext,
      aggravators: primaryAggravators,
      impact: primaryImpact,
      lastEpisodeDate: lastEpisode,
      trend,
      patientNarrative,
      evidenceLine,
      relatedTriggers
    };
  }
  
  if (lowerTrigger.includes('health') || lowerTrigger.includes('medical') || lowerTrigger.includes('sick') || lowerTrigger.includes('physical')) {
    const lastEpisode = getLastEpisodeDate(analyses, trigger);
    const trend = calculateTrend(analyses, trigger);
    const timeWindow = count > 10 ? 'past month' : 'past two weeks';
    
    const memories = ['physical symptoms', 'past health scares'];
    const aggravators = ['body sensations', 'medical news'];
    const primaryImpact = 'health monitoring';
    
    const patientNarrative = `Patient reports anxiety with health concerns, recalling ${memories[0]}. Symptoms intensify with ${aggravators.join(' and ')}, leading to ${primaryImpact}.`;
    const evidenceLine = `Evidence: Last episode ${lastEpisode} (${avgSeverity.toFixed(0)}/10); ${count} episodes in ${timeWindow}; ${trend} vs prior.`;
    
    return {
      category: 'Health Concerns',
      description: patientNarrative,
      whyExplanation: '',
      memoryContext: memories[0],
      aggravators,
      impact: primaryImpact,
      lastEpisodeDate: lastEpisode,
      trend,
      patientNarrative,
      evidenceLine,
      relatedTriggers
    };
  }
  
  if (lowerTrigger.includes('financial') || lowerTrigger.includes('money') || lowerTrigger.includes('bills') || lowerTrigger.includes('unemployment')) {
    const lastEpisode = getLastEpisodeDate(analyses, trigger);
    const trend = calculateTrend(analyses, trigger);
    const timeWindow = count > 10 ? 'past month' : 'past two weeks';
    
    const memories = relatedTriggers.includes('unemployment') ? ['job loss'] : ['past financial struggles'];
    const aggravators = ['bills arriving', 'budget discussions'];
    const primaryImpact = 'spending restrictions';
    
    const patientNarrative = `Patient reports anxiety with financial matters, recalling ${memories[0]}. Symptoms intensify with ${aggravators.join(' and ')}, leading to ${primaryImpact}.`;
    const evidenceLine = `Evidence: Last episode ${lastEpisode} (${avgSeverity.toFixed(0)}/10); ${count} episodes in ${timeWindow}; ${trend} vs prior.`;
    
    return {
      category: 'Financial Stress',
      description: patientNarrative,
      whyExplanation: '',
      memoryContext: memories[0],
      aggravators,
      impact: primaryImpact,
      lastEpisodeDate: lastEpisode,
      trend,
      patientNarrative,
      evidenceLine,
      relatedTriggers
    };
  }
  
  if (lowerTrigger.includes('family') || lowerTrigger.includes('relationship') || lowerTrigger.includes('parent') || lowerTrigger.includes('partner')) {
    const lastEpisode = getLastEpisodeDate(analyses, trigger);
    const trend = calculateTrend(analyses, trigger);
    const timeWindow = count > 10 ? 'past month' : 'past two weeks';
    
    const memories = relatedTriggers.some((t: string) => t.includes('family')) 
      ? ['family conflicts'] 
      : ['relationship challenges'];
    const aggravators = ['arguments', 'emotional distance'];
    const primaryImpact = 'relationship strain';
    
    const patientNarrative = `Patient reports anxiety with relationships, recalling ${memories[0]}. Symptoms intensify with ${aggravators.join(' and ')}, leading to ${primaryImpact}.`;
    const evidenceLine = `Evidence: Last episode ${lastEpisode} (${avgSeverity.toFixed(0)}/10); ${count} episodes in ${timeWindow}; ${trend} vs prior.`;
    
    return {
      category: 'Relationships',
      description: patientNarrative,
      whyExplanation: '',
      memoryContext: memories[0],
      aggravators,
      impact: primaryImpact,
      lastEpisodeDate: lastEpisode,
      trend,
      patientNarrative,
      evidenceLine,
      relatedTriggers
    };
  }
  
  if (lowerTrigger.includes('future') || lowerTrigger.includes('uncertainty') || lowerTrigger.includes('unknown') || lowerTrigger.includes('fear of')) {
    const lastEpisode = getLastEpisodeDate(analyses, trigger);
    const trend = calculateTrend(analyses, trigger);
    const timeWindow = count > 10 ? 'past month' : 'past two weeks';
    
    const memories = ['uncertain outcomes'];
    const aggravators = ['lack of control', 'unpredictable changes'];
    const primaryImpact = 'decision paralysis';
    
    const patientNarrative = `Patient reports anxiety with uncertainty, recalling ${memories[0]}. Symptoms intensify with ${aggravators.join(' and ')}, leading to ${primaryImpact}.`;
    const evidenceLine = `Evidence: Last episode ${lastEpisode} (${avgSeverity.toFixed(0)}/10); ${count} episodes in ${timeWindow}; ${trend} vs prior.`;
    
    return {
      category: 'Future/Uncertainty',
      description: patientNarrative,
      whyExplanation: '',
      memoryContext: memories[0],
      aggravators,
      impact: primaryImpact,
      lastEpisodeDate: lastEpisode,
      trend,
      patientNarrative,
      evidenceLine,
      relatedTriggers
    };
  }
  
  const lastEpisode = getLastEpisodeDate(analyses, trigger);
  const trend = calculateTrend(analyses, trigger);
  const timeWindow = count > 10 ? 'past month' : 'past two weeks';
  
  // General fallback
  const patientNarrative = `Pattern noted for general anxiety; limited details recorded. Encourage logging when/where/body cues to refine the plan.`;
  const evidenceLine = `Evidence: Last episode ${lastEpisode} (${avgSeverity.toFixed(0)}/10); ${count} episodes in ${timeWindow}; ${trend} vs prior.`;
  
  return {
    category: 'General Anxiety',
    description: patientNarrative,
    whyExplanation: '',
    memoryContext: 'various situations',
    aggravators: ['stress', 'unexpected events'],
    impact: 'daily functioning',
    lastEpisodeDate: lastEpisode,
    trend,
    patientNarrative,
    evidenceLine,
    relatedTriggers
  };
};

export const processTriggerData = (analyses: ClaudeAnxietyAnalysis[]): TriggerData[] => {
  if (!analyses || analyses.length === 0) return [];
  
  const triggerCounts: Record<string, { count: number; severitySum: number; relatedTriggers: Set<string> }> = {};
  const colors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4'];

  // First pass: collect all triggers and group by category
  analyses.forEach(analysis => {
    if (analysis) {
      const triggersArray = ensureTriggersArray(analysis.triggers);
      
      triggersArray.forEach(trigger => {
        // Get basic metadata for categorization
        const basicMetadata = getTriggerMetadata(trigger, [], { count: 0, avgSeverity: 0, relatedTriggers: [] });
        const category = basicMetadata.category;
        
        if (!triggerCounts[category]) {
          triggerCounts[category] = { 
            count: 0, 
            severitySum: 0, 
            relatedTriggers: new Set()
          };
        }
        triggerCounts[category].count++;
        triggerCounts[category].severitySum += analysis.anxietyLevel;
        triggerCounts[category].relatedTriggers.add(trigger);
      });
    }
  });

  // Process and sort triggers
  const allTriggers = Object.entries(triggerCounts).map(([category, data], index) => {
    const categoryData = { count: data.count, avgSeverity: data.count > 0 ? data.severitySum / data.count : 0, relatedTriggers: Array.from(data.relatedTriggers) };
    const metadata = getTriggerMetadata(category, analyses, categoryData);
    return {
      trigger: category,
      count: data.count,
      avgSeverity: categoryData.avgSeverity,
      color: colors[index % colors.length],
      category: metadata.category,
      description: metadata.description,
      whyExplanation: metadata.whyExplanation,
      memoryContext: metadata.memoryContext,
      aggravators: metadata.aggravators,
      impact: metadata.impact,
      lastEpisodeDate: metadata.lastEpisodeDate,
      trend: metadata.trend,
      patientNarrative: metadata.patientNarrative,
      evidenceLine: metadata.evidenceLine,
      relatedTriggers: categoryData.relatedTriggers
    };
  });
  
  // Sort by count (most important triggers first) and limit to top 10
  return allTriggers
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

export const processSeverityDistribution = (analyses: ClaudeAnxietyAnalysis[]): SeverityDistribution[] => {
  if (!analyses || analyses.length === 0) return [];
  
  const distribution = { low: 0, moderate: 0, high: 0, severe: 0 };
  
  analyses.forEach(analysis => {
    if (!analysis || typeof analysis.anxietyLevel !== 'number') return;
    if (analysis.anxietyLevel <= 3) distribution.low++;
    else if (analysis.anxietyLevel <= 6) distribution.moderate++;
    else if (analysis.anxietyLevel <= 8) distribution.high++;
    else distribution.severe++;
  });

  return [
    { range: '1-3 (Low)', count: distribution.low, color: '#10B981' },
    { range: '4-6 (Moderate)', count: distribution.moderate, color: '#F59E0B' },
    { range: '7-8 (High)', count: distribution.high, color: '#EF4444' },
    { range: '9-10 (Severe)', count: distribution.severe, color: '#DC2626' }
  ];
};

export const getAnalyticsMetrics = (analyses: ClaudeAnxietyAnalysis[], triggerData: TriggerData[], goalProgress?: any[]) => {
  const totalEntries = analyses ? analyses.length : 0;
  const averageAnxiety = analyses && analyses.length > 0 
    ? analyses.reduce((sum, analysis) => sum + (analysis?.anxietyLevel || 0), 0) / analyses.length
    : 0;
  const mostCommonTrigger = triggerData.length > 0 
    ? triggerData.reduce((prev, current) => (prev.count > current.count) ? prev : current)
    : { trigger: 'No data yet', count: 0 };

  // Calculate goal progress metrics
  const goalMetrics = goalProgress && goalProgress.length > 0 ? {
    totalGoals: goalProgress.length,
    averageProgress: goalProgress.reduce((sum, goal) => sum + (goal.average_score || 0), 0) / goalProgress.length,
    completedGoals: goalProgress.filter(goal => (goal.completion_rate || 0) >= 80).length
  } : {
    totalGoals: 0,
    averageProgress: 0,
    completedGoals: 0
  };

  return {
    totalEntries,
    averageAnxiety,
    mostCommonTrigger,
    goalMetrics
  };
};