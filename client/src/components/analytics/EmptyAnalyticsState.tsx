
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

const EmptyAnalyticsState: React.FC = () => {
  const { t } = useLanguage();
  return (
    <Card className="p-8 text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('analytics.empty.title')}</h3>
      <p className="text-gray-600 mb-4">{t('analytics.empty.desc')}</p>
      <Button onClick={() => window.location.href = '/chat'}>
        {t('analytics.empty.start')}
      </Button>
    </Card>
  );
};

export default EmptyAnalyticsState;
