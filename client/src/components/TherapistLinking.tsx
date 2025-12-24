import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, User, CheckCircle } from 'lucide-react';
import { TherapistInfo } from '@/types/registration';
import { AuthService } from '@/services/authService';
import { useLanguage } from '@/context/LanguageContext';


interface TherapistLinkingProps {
  onComplete: (hasTherapist: boolean, therapistInfo?: TherapistInfo) => void;
}

const TherapistLinking: React.FC<TherapistLinkingProps> = ({ onComplete }) => {
  const [hasTherapist, setHasTherapist] = useState<string>('');
  const [therapistInfo, setTherapistInfo] = useState<TherapistInfo>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    contactMethod: 'email'
  });
  const [step, setStep] = useState<'question' | 'details' | 'confirmation'>('question');
  const [shareReport, setShareReport] = useState<string>('');
  const { toast } = useToast();
  const { language, t } = useLanguage();

  const handleTherapistResponse = (value: string) => {
    setHasTherapist(value);
    if (value === 'yes') {
      setStep('details');
    } else {
      onComplete(false);
    }
  };

  const handleSubmitTherapistInfo = () => {
    if (!therapistInfo.name.trim()) {
      toast({
        title: t('therapistLinking.toast.nameRequired'),
        description: t('therapistLinking.toast.nameRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    if (!therapistInfo.email.trim()) {
      toast({
        title: t('therapistLinking.toast.emailRequired'),
        description: t('therapistLinking.toast.emailRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    if (!shareReport) {
      toast({
        title: t('therapistLinking.toast.reportSharingRequired'),
        description: t('therapistLinking.toast.reportSharingRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    setStep('confirmation');
  };

  const handleConfirm = async () => {
    console.log('🔵 Starting connection request process...');
    
    try {
      const contactValue = therapistInfo.contactMethod === 'email' ? therapistInfo.email : therapistInfo.phone;
      console.log('📧 Contact method:', therapistInfo.contactMethod, 'Value:', contactValue);

      // Get current user email, preferring auth context with an environment-configured fallback
      const user = await AuthService.getCurrentUser();
      const currentUserEmail =
        localStorage.getItem('userEmail') ||
        user?.email ||
        import.meta.env.VITE_FALLBACK_USER_EMAIL ||
        '';
      
      console.log('👤 Current user email:', currentUserEmail || 'Not available');

      // Build API URL - if no base URL, use relative path for same-origin requests
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const shouldUseBase =
        apiBaseUrl &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const apiUrl = shouldUseBase ? `${apiBaseUrl}/api/therapist-connections` : '/api/therapist-connections';
      
      console.log('🌐 API URL being used:', apiUrl);
      console.log('📦 Request payload:', {
        therapistName: therapistInfo.name,
        contactValue: contactValue,
        shareReport: shareReport,
        notes: therapistInfo.notes,
        patientEmail: currentUserEmail,
        language
      });

      // Send connection request to our backend API with patient email
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin', // Include cookies for same-origin requests
        body: JSON.stringify({
          therapistName: therapistInfo.name,
          contactValue: contactValue,
          shareReport: shareReport,
          notes: therapistInfo.notes,
          patientEmail: currentUserEmail,
          language
        })
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK. Status:', response.status, 'Body:', errorText);
        
        // Try to parse as JSON if possible, otherwise use text
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Response JSON:', result);

      if (result.success) {
        console.log('🎉 Connection request sent successfully');
        toast({
          title: t('therapistLinking.toast.connectionRequestSent'),
          description: t('therapistLinking.toast.connectionRequestSentDesc', `A connection request has been sent to ${therapistInfo.name}. They will be able to receive your progress reports.`).replace('{name}', therapistInfo.name),
        });
        onComplete(true, therapistInfo);
      } else {
        console.error('❌ Server returned success: false', result);
        throw new Error(result.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('❌ Error sending connection request:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof(error)
      });
      
      // Show more detailed error message to help debug
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: t('therapistLinking.toast.error'),
        description: t('therapistLinking.toast.errorDesc', `Failed to send connection request: ${errorMessage}`).replace('{error}', errorMessage),
        variant: "destructive",
      });
    }
  };

  if (step === 'question') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('contact.question')}
          </h2>
          <p className="text-gray-600">
            {t('contact.questionDesc')}
          </p>
        </div>

        <RadioGroup value={hasTherapist} onValueChange={handleTherapistResponse} className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes" className="text-gray-900 cursor-pointer font-medium">
              {t('contact.optionYes')}
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no" className="text-gray-900 cursor-pointer font-medium">
              {t('contact.optionNo')}
            </Label>
          </div>
        </RadioGroup>
      </Card>
    );
  }

  if (step === 'details') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('therapistLinking.connectYourTherapist')}
          </h2>
          <p className="text-gray-600">
            {t('therapistLinking.provideTherapistInfo')}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="therapist-name">{t('therapistLinking.therapistName')}</Label>
            <Input
              id="therapist-name"
              value={therapistInfo.name}
              onChange={(e) => setTherapistInfo({ ...therapistInfo, name: e.target.value })}
              placeholder={t('therapistLinking.namePlaceholder')}
            />
          </div>

          <div>
            <Label>{t('therapistLinking.preferredContactMethod')}</Label>
            <RadioGroup 
              value={therapistInfo.contactMethod} 
              onValueChange={(value: 'email' | 'phone') => 
                setTherapistInfo({ ...therapistInfo, contactMethod: value })
              }
              className="flex space-x-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center cursor-pointer">
                  <Mail className="w-4 h-4 mr-2" />
                  {t('therapistLinking.email')}
                </Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-gray-500 mt-1">{t('therapistLinking.emailOnlySupported')}</p>
          </div>

          <div>
            <Label htmlFor="therapist-email">{t('therapistLinking.emailAddress')}</Label>
            <Input
              id="therapist-email"
              type="email"
              value={therapistInfo.email}
              onChange={(e) => setTherapistInfo({ ...therapistInfo, email: e.target.value })}
              placeholder={t('therapistLinking.emailPlaceholder')}
            />
          </div>

          <div>
            <Label>{t('therapistLinking.shareReportQuestion')}</Label>
            <RadioGroup 
              value={shareReport} 
              onValueChange={setShareReport}
              className="mt-2"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="yes" id="share-yes" />
                <Label htmlFor="share-yes" className="cursor-pointer">
                  <div>
                    <div className="font-medium">{t('therapistLinking.shareReportYes')}</div>
                    <div className="text-sm text-gray-500">{t('therapistLinking.shareReportYesDesc')}</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="no" id="share-no" />
                <Label htmlFor="share-no" className="cursor-pointer">
                  <div>
                    <div className="font-medium">{t('therapistLinking.shareReportNo')}</div>
                    <div className="text-sm text-gray-500">{t('therapistLinking.shareReportNoDesc')}</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="therapist-notes">{t('therapistLinking.additionalNotes')}</Label>
            <Textarea
              id="therapist-notes"
              value={therapistInfo.notes}
              onChange={(e) => setTherapistInfo({ ...therapistInfo, notes: e.target.value })}
              placeholder={t('therapistLinking.notesPlaceholder')}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => setStep('question')}>
            {t('contact.back')}
          </Button>
          <Button onClick={handleSubmitTherapistInfo} className="bg-blue-600 hover:bg-blue-700">
            {t('therapistLinking.continue')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {t('therapistLinking.therapistInfoSaved')}
      </h2>
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
        <h3 className="font-semibold text-gray-900 mb-2">{t('therapistLinking.reviewInformation')}</h3>
        <p><strong>{t('therapistLinking.name')}</strong> {therapistInfo.name}</p>
        <p><strong>{t('therapistLinking.emailLabel')}</strong> {therapistInfo.email}</p>
        <p><strong>{t('therapistLinking.shareReport')}</strong> {shareReport === 'yes' ? t('therapistLinking.shareReportYesValue') : t('therapistLinking.shareReportNoValue')}</p>
        {therapistInfo.notes && <p><strong>{t('therapistLinking.notes')}</strong> {therapistInfo.notes}</p>}
      </div>
      <p className="text-gray-600 mb-6">
        {t('therapistLinking.clickToSend')} 
        {shareReport === 'yes' 
          ? t('therapistLinking.emailWithReport')
          : t('therapistLinking.emailWithoutReport')
        }
      </p>
      <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
        {t('contact.sendRequest')}
      </Button>
    </Card>
  );
};

export default TherapistLinking;