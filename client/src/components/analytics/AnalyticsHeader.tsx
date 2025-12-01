
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
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('analytics.header.title')}</h1>
          <p className="text-sm text-gray-600">
            {analysesCount > 0 
              ? t('analytics.header.data').replace('{count}', analysesCount.toString())
              : t('analytics.header.empty')
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={onDownloadHistory} variant="outline" size="sm" disabled={analysesCount === 0}>
            <Download className="w-4 h-4 mr-2" />
            {t('analytics.header.downloadHistory')}
          </Button>
          <Button onClick={onDownloadSummary} variant="outline" size="sm" disabled={analysesCount === 0}>
            <Download className="w-4 h-4 mr-2" />
            {t('analytics.header.downloadSummary')}
          </Button>
          <Button onClick={handleShareWithTherapist} variant="outline" size="sm" disabled={analysesCount === 0}>
            <Share className="w-4 h-4 mr-2" />
            {t('analytics.header.shareTherapist')}
          </Button>
          <Button 
            onClick={() => window.location.href = '/treatment-resources'} 
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            {t('analytics.header.viewTreatment')}
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{t('analytics.header.realtime')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
