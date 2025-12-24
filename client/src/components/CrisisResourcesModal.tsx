import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, MessageSquare, Clock, Heart, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface CrisisResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrisisResourcesModal: React.FC<CrisisResourcesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const crisisResources = [
    {
      name: t('crisisModal.resources.988.name'),
      phone: '988',
      description: t('crisisModal.resources.988.description'),
      icon: Phone,
      action: () => window.open('tel:988'),
    },
    {
      name: t('crisisModal.resources.textLine.name'),
      phone: t('crisisModal.resources.textLine.phone', 'Text HOME to 741741'),
      description: t('crisisModal.resources.textLine.description'),
      icon: MessageSquare,
      action: () => window.open('sms:741741?body=HOME'),
    },
    {
      name: t('crisisModal.resources.dvHotline.name'),
      phone: '1-800-799-7233',
      description: t('crisisModal.resources.dvHotline.description'),
      icon: Heart,
      action: () => window.open('tel:18007997233'),
    },
    {
      name: t('crisisModal.resources.samhsa.name'),
      phone: '1-800-662-4357',
      description: t('crisisModal.resources.samhsa.description'),
      icon: Clock,
      action: () => window.open('tel:18006624357'),
    },
  ];

  const immediateCopingStrategies = [
    {
      title: t('crisisModal.strategies.grounding54321.title'),
      description: t('crisisModal.strategies.grounding54321.description'),
    },
    {
      title: t('crisisModal.strategies.breathing446.title'),
      description: t('crisisModal.strategies.breathing446.description'),
    },
    {
      title: t('crisisModal.strategies.coldWater.title'),
      description: t('crisisModal.strategies.coldWater.description'),
    },
    {
      title: t('crisisModal.strategies.movement.title'),
      description: t('crisisModal.strategies.movement.description'),
    },
    {
      title: t('crisisModal.strategies.safePerson.title'),
      description: t('crisisModal.strategies.safePerson.description'),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <span>{t('crisisModal.title')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('crisisModal.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Crisis Hotlines */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('crisisModal.hotlinesTitle')}</h3>
            <div className="grid gap-3">
              {crisisResources.map((resource, index) => {
                const IconComponent = resource.icon;
                return (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={resource.action}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center space-x-3 text-base">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <div>
                          <div>{resource.name}</div>
                          <div className="text-sm font-normal text-muted-foreground">
                            {resource.phone}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Immediate Coping Strategies */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('crisisModal.strategiesTitle')}</h3>
            <div className="grid gap-3">
              {immediateCopingStrategies.map((strategy, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{strategy.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Safety Reminder */}
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <p className="text-sm">
                <strong>{t('crisisModal.rememberLabel')}</strong>{' '}
                {t('crisisModal.rememberText')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button onClick={onClose} variant="outline">
            {t('crisisModal.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};