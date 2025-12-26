
import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, Target } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface TriggerData {
  trigger: string;
  count: number;
  avgSeverity: number;
  color: string;
}

interface AnalyticsMetricsProps {
  totalEntries: number;
  averageAnxiety: number;
  mostCommonTrigger: TriggerData | { trigger: string; count: number };
}

const AnalyticsMetrics: React.FC<AnalyticsMetricsProps> = ({
  totalEntries,
  averageAnxiety,
  mostCommonTrigger
}) => {
  const { t } = useLanguage();

  // Helper function to translate trigger category names
  const translateTriggerCategory = (triggerName: string): string => {
    if (!triggerName) return triggerName;

    const categoryMap: Record<string, string> = {
      'Social Anxiety': t('analytics.triggers.category.socialAnxiety', 'Social Anxiety'),
      'General Anxiety': t('analytics.triggers.category.generalAnxiety', 'General Anxiety'),
      'Health Concerns': t('analytics.triggers.category.healthConcerns', 'Health Concerns'),
      'Work/Academic Stress': t('analytics.triggers.category.workStress', 'Work/Academic Stress'),
      'Financial Stress': t('analytics.triggers.category.financialStress', 'Financial Stress'),
      'Relationships': t('analytics.triggers.category.relationships', 'Relationships'),
      'Future/Uncertainty': t('analytics.triggers.category.futureUncertainty', 'Future/Uncertainty'),
    };

    return categoryMap[triggerName] || triggerName;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('analytics.metrics.totalSessions')}</p>
            <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('analytics.metrics.averageAnxiety')}</p>
            <p className="text-2xl font-bold text-gray-900">{(averageAnxiety !== null && averageAnxiety !== undefined && !isNaN(Number(averageAnxiety)) ? Number(averageAnxiety).toFixed(1) : '0.0')}/10</p>
          </div>
          <div className="p-3 bg-orange-100 rounded-full">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('analytics.metrics.mostCommonTrigger')}</p>
            <p className="text-lg font-bold text-gray-900">{translateTriggerCategory(mostCommonTrigger?.trigger || '') || t('analytics.metrics.noTriggers')}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <Target className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('analytics.metrics.treatmentProgress')}</p>
            <p className="text-lg font-bold text-green-700">{t('analytics.metrics.progressImproving')}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingDown className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsMetrics;
