
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, Target, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { useLanguage } from '@/context/LanguageContext';

interface AnalyticsHeaderProps {
  analysesCount: number;
  onDownloadHistory: () => void;
  onShareWithTherapist?: () => void;
  onDownloadSummary: () => void;
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  analysesCount,
  onDownloadHistory,
  onShareWithTherapist,
  onDownloadSummary
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleShareWithTherapist = () => {
    onShareWithTherapist?.();
    navigate(ROUTES.contactTherapist);
  };
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
      <div className="max-w-screen-sm mx-auto w-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 break-words">{t('analytics.header.title')}</h1>
            <p className="text-sm text-gray-600">
              {analysesCount > 0 
                ? t('analytics.header.data').replace('{count}', analysesCount.toString())
                : t('analytics.header.empty')
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <Button onClick={onDownloadHistory} variant="outline" size="sm" disabled={analysesCount === 0} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              {t('analytics.header.downloadHistory')}
            </Button>
            <Button onClick={onDownloadSummary} variant="outline" size="sm" disabled={analysesCount === 0} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              {t('analytics.header.downloadSummary')}
            </Button>
            <Button onClick={handleShareWithTherapist} variant="outline" size="sm" disabled={analysesCount === 0} className="w-full sm:w-auto">
              <Share className="w-4 h-4 mr-2" />
              {t('analytics.header.shareTherapist')}
            </Button>
            <Button 
              onClick={() => window.location.href = '/treatment-resources'} 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              size="sm"
            >
              <Target className="w-4 h-4 mr-2" />
              {t('analytics.header.viewTreatment')}
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500 w-full sm:w-auto justify-start sm:justify-end">
              <Calendar className="w-4 h-4" />
              <span>{t('analytics.header.realtime')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
