
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full min-w-0 overflow-hidden">
      <Card className="p-4 sm:p-6 w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('analytics.metrics.totalSessions')}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalEntries}</p>
          </div>
          <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('analytics.metrics.averageAnxiety')}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{(averageAnxiety !== null && averageAnxiety !== undefined && !isNaN(Number(averageAnxiety)) ? Number(averageAnxiety).toFixed(1) : '0.0')}/10</p>
          </div>
          <div className="p-2 sm:p-3 bg-orange-100 rounded-full flex-shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('analytics.metrics.mostCommonTrigger')}</p>
            <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{mostCommonTrigger?.trigger || t('analytics.metrics.noTriggers')}</p>
          </div>
          <div className="p-2 sm:p-3 bg-red-100 rounded-full flex-shrink-0">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{t('analytics.metrics.treatmentProgress')}</p>
            <p className="text-sm sm:text-lg font-bold text-green-700 truncate">{t('analytics.metrics.progressImproving')}</p>
          </div>
          <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
            <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsMetrics;
