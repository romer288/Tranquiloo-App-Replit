import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Phone, MapPin, User, FileText, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { useLanguage } from '@/context/LanguageContext';

const ContactTherapist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [choice, setChoice] = useState<'yes' | 'no' | ''>('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleChoice = (value: 'yes' | 'no') => {
    setChoice(value);
  };

  const handleDownloadAnxietyData = async () => {
    try {
      const { downloadSummaryReport } = await import('@/services/summaryReportService');

      toast({
        title: t('contact.downloadStarted'),
        description: t('contact.downloadStartedDesc')
      });

      downloadSummaryReport([], [], [], {
        fileName: 'anxiety-data-package',
        title: t('reports.anxietyDataTitle', 'Anxiety Data & Intervention Summary'),
        language,
        t,
      });
    } catch (error) {
      toast({
        title: t('contact.downloadError'),
        description: t('contact.downloadErrorDesc'),
        variant: 'destructive'
      });
    }
  };

  const handleConnectToTherapist = async () => {
    if (!email.trim()) {
      toast({
        title: t('contact.emailRequired'),
        description: t('contact.emailRequiredDesc'),
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);

    try {
      const authUser = await AuthService.getCurrentUser();
      const currentUserEmail =
        localStorage.getItem('userEmail') ||
        authUser?.email ||
        import.meta.env.VITE_FALLBACK_USER_EMAIL ||
        '';

      const therapistDisplayName = email.split('@')[0] || t('auth.therapistRole');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const shouldUseBase =
        apiBaseUrl &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const apiUrl = shouldUseBase ? `${apiBaseUrl}/api/therapist-connections` : '/api/therapist-connections';

      console.log('ContactTherapist fetch', {
        apiBaseUrl,
        apiUrl,
        envValue: import.meta.env.VITE_API_BASE_URL,
        locationOrigin: window.location.origin,
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          userId: user?.id || `user_${Date.now()}`,
          therapistName: therapistDisplayName,
          contactValue: email,
          shareReport: 'yes',
          notes: message || '',
          patientEmail: currentUserEmail,
          language
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = t('contact.requestErrorDesc');
        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed?.error || parsed?.message || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      toast({
        title: t('contact.requestSent'),
        description: t('contact.requestSentDesc')
      });

      setEmail('');
      setMessage('');
      setChoice('');
    } catch (error) {
      toast({
        title: t('contact.requestError'),
        description: error instanceof Error ? error.message : t('contact.requestErrorDesc'),
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const resetChoice = () => {
    setChoice('');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10" data-testid="contact-therapist-container">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-900 mb-2" data-testid="text-page-title">
            {t('contact.title')}
          </h1>
          <p className="text-slate-600" data-testid="text-page-description">
            {t('contact.subtitle')}
          </p>
        </div>

        <Card className="mb-10 border border-blue-100 bg-white">
          <CardContent className="px-6 py-8 md:px-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-3 max-w-2xl">
                <h2 className="text-3xl font-semibold text-slate-900">{t('contact.question')}</h2>
                <p className="text-slate-600">
                  {t('contact.questionDesc')}
                </p>
              </div>
              <RadioGroup
                value={choice}
                onValueChange={(value) => handleChoice(value as 'yes' | 'no')}
                className="w-full max-w-2xl space-y-3"
              >
                {[
                  {
                    value: 'yes' as const,
                    label: t('contact.optionYes'),
                    description: t('contact.optionYesDesc')
                  },
                  {
                    value: 'no' as const,
                    label: t('contact.optionNo'),
                    description: t('contact.optionNoDesc')
                  }
                ].map((option) => {
                  const isSelected = choice === option.value;
                  return (
                    <label
                      key={option.value}
                      htmlFor={`contact-choice-${option.value}`}
                      className={`flex cursor-pointer items-start gap-4 rounded-xl border bg-white px-5 py-4 transition-colors ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'
                      }`}
                      data-testid={
                        option.value === 'yes' ? 'button-has-therapist' : 'button-no-therapist'
                      }
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`contact-choice-${option.value}`}
                        className="mt-1 h-5 w-5 text-blue-600"
                      />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">{option.label}</p>
                        <p className="text-sm text-slate-600">{option.description}</p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {choice === 'yes' && (
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t('contact.connectTitle')}
              </CardTitle>
              <p className="text-gray-600">
                {t('contact.connectDesc')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="therapist-email">{t('contact.emailLabel')}</Label>
                <Input
                  id="therapist-email"
                  type="email"
                  placeholder={t('contact.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="connection-message">{t('contact.messageLabel')}</Label>
                <Textarea
                  id="connection-message"
                  placeholder={t('contact.messagePlaceholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleConnectToTherapist}
                  className="sm:flex-1"
                  disabled={isConnecting}
                  data-testid="button-connect-therapist"
                >
                  {isConnecting ? t('contact.connecting') : t('contact.sendRequest')}
                </Button>
                <Button variant="outline" className="sm:flex-1" onClick={resetChoice}>
                  {t('contact.back')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {choice === 'no' && (
          <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">{t('contact.selfGuidedTitle')}</h3>
                    <p className="text-blue-700 text-sm">
                      {t('contact.selfGuidedDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  {t('contact.downloadTitle')}
                </CardTitle>
                <p className="text-gray-600">
                  {t('contact.downloadDesc')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-2">{t('contact.packageTitle')}</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {t('contact.packageItem1')}</li>
                    <li>• {t('contact.packageItem2')}</li>
                    <li>• {t('contact.packageItem3')}</li>
                    <li>• {t('contact.packageItem4')}</li>
                    <li>• {t('contact.packageItem5')}</li>
                  </ul>
                </div>
                <Button onClick={handleDownloadAnxietyData} className="w-full" data-testid="button-download-data">
                  <Download className="w-4 h-4 mr-2" />
                  {t('contact.downloadCta')}
                </Button>
                <div className="mt-4">
                  <Button variant="outline" onClick={resetChoice} className="w-full" data-testid="button-back-choice">
                    {t('contact.backOptions')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  {t('contact.readyTitle')}
                </CardTitle>
                <p className="text-gray-600">
                  {t('contact.readyDesc')}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">{t('contact.benefitsTitle')}</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• {t('contact.benefit1')}</li>
                      <li>• {t('contact.benefit2')}</li>
                      <li>• {t('contact.benefit3')}</li>
                      <li>• {t('contact.benefit4')}</li>
                      <li>• {t('contact.benefit5')}</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => window.open('https://www.psychologytoday.com/us', '_blank', 'noopener,noreferrer')}
                    className="w-full"
                    data-testid="button-find-therapist"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {t('contact.findTherapist')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="mt-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              {t('contact.emergencyTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-semibold">{t('contact.emergency1')}</p>
                  <p className="text-sm text-gray-600">{t('contact.emergency1Desc')}</p>
                </div>
                <Badge variant="secondary">988</Badge>
              </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-semibold">{t('contact.emergency2')}</p>
                    <p className="text-sm text-gray-600">{t('contact.emergency2Desc')}</p>
                  </div>
                  <Badge variant="secondary">{t('crisisFooter.text', 'Text HOME to 741741')}</Badge>
                </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-semibold">{t('contact.emergency3')}</p>
                  <p className="text-sm text-gray-600">{t('contact.emergency3Desc')}</p>
                </div>
                <Badge variant="secondary">1-800-662-4357</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactTherapist;