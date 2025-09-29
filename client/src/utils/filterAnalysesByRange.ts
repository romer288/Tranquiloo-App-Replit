import { DateRange } from 'react-day-picker';
import { ClaudeAnxietyAnalysisWithDate } from '@/services/analyticsService';

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

export const filterAnalysesByRange = (
  analyses: ClaudeAnxietyAnalysisWithDate[],
  range?: DateRange
): ClaudeAnxietyAnalysisWithDate[] => {
  if (!range?.from && !range?.to) {
    return analyses;
  }

  const from = range?.from ? startOfDay(range.from) : undefined;
  const to = range?.to ? endOfDay(range.to) : undefined;

  return analyses.filter((analysis) => {
    const createdAt = analysis?.created_at ? new Date(analysis.created_at) : undefined;
    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      return false;
    }

    if (from && createdAt < from) {
      return false;
    }

    if (to && createdAt > to) {
      return false;
    }

    return true;
  });
};

export const getAnalysisDateBounds = (
  analyses: ClaudeAnxietyAnalysisWithDate[]
): { min?: Date; max?: Date } => {
  if (!analyses.length) {
    return {};
  }

  const timestamps = analyses
    .map((analysis) => (analysis?.created_at ? new Date(analysis.created_at).getTime() : NaN))
    .filter((value) => !Number.isNaN(value));

  if (!timestamps.length) {
    return {};
  }

  return {
    min: new Date(Math.min(...timestamps)),
    max: new Date(Math.max(...timestamps)),
  };
};
