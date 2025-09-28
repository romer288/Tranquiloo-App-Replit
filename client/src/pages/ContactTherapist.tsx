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

const ContactTherapist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [choice, setChoice] = useState<'yes' | 'no' | ''>('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleChoice = (value: 'yes' | 'no') => {
    setChoice(value);
  };

  const handleDownloadAnxietyData = async () => {
    try {
      const { downloadPDFReport } = await import('@/services/analyticsExportService');
      const { downloadSummaryReport } = await import('@/services/summaryReportService');

      toast({
        title: 'Download Started',
        description: 'Downloading your anxiety data and conversation summary...'
      });

      downloadPDFReport('current-user-id');
      downloadSummaryReport([], [], []);
    } catch (error) {
      toast({
        title: 'Download Error',
        description: 'Failed to download anxiety data',
        variant: 'destructive'
      });
    }
  };

  const handleConnectToTherapist = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: "Please enter your therapist's email address",
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

      const therapistDisplayName = email.split('@')[0] || 'Therapist';
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/therapist-connections` : '/api/therapist-connections';

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
          patientEmail: currentUserEmail
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to send connection request';
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
        title: 'Connection Request Sent',
        description: 'Your therapist will receive a notification to approve the connection'
      });

      setEmail('');
      setMessage('');
      setChoice('');
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to connect with therapist. Please try again.',
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
            Contact Therapist
          </h1>
          <p className="text-slate-600" data-testid="text-page-description">
            Connect with your therapist or download your anxiety data for professional consultation
          </p>
        </div>

        <Card className="mb-10 border border-blue-100 bg-white">
          <CardContent className="px-6 py-8 md:px-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-3 max-w-2xl">
                <h2 className="text-3xl font-semibold text-slate-900">Do you currently have a therapist?</h2>
                <p className="text-slate-600">
                  If you have a therapist, we can connect your account so they can track your progress and provide better support.
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
                    label: "Yes, I have a therapist I'd like to connect",
                    description: 'Send them a secure request to review your progress.'
                  },
                  {
                    value: 'no' as const,
                    label: "No, I don't have a therapist",
                    description: 'Download your data or explore professional options.'
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
                Connect with Your Therapist
              </CardTitle>
              <p className="text-gray-600">
                Enter your therapist's email to send them a connection request
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="therapist-email">Therapist Email</Label>
                <Input
                  id="therapist-email"
                  type="email"
                  placeholder="therapist@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="connection-message">Message (Optional)</Label>
                <Textarea
                  id="connection-message"
                  placeholder="Let your therapist know about your current concerns..."
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
                  {isConnecting ? 'Connecting...' : 'Send Connection Request'}
                </Button>
                <Button variant="outline" className="sm:flex-1" onClick={resetChoice}>
                  Back
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
                    <h3 className="font-semibold text-blue-900">You're in self-guided mode</h3>
                    <p className="text-blue-700 text-sm">
                      Continue using the app for anxiety management. Consider connecting with a therapist for professional support.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Download Your Anxiety Data
                </CardTitle>
                <p className="text-gray-600">
                  Get your complete anxiety tracking data and conversation summaries to share with a mental health professional
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold mb-2">Your data package includes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Complete anxiety tracking history and trends</li>
                    <li>• Conversation summaries with AI companion</li>
                    <li>• Trigger analysis and patterns</li>
                    <li>• Goal progress and intervention outcomes</li>
                    <li>• Clinical assessment results</li>
                  </ul>
                </div>
                <Button onClick={handleDownloadAnxietyData} className="w-full" data-testid="button-download-data">
                  <Download className="w-4 h-4 mr-2" />
                  Download My Anxiety Data
                </Button>
                <div className="mt-4">
                  <Button variant="outline" onClick={resetChoice} className="w-full" data-testid="button-back-choice">
                    Back to Options
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Ready to Find a Therapist?
                </CardTitle>
                <p className="text-gray-600">
                  Professional therapy can significantly improve your anxiety management journey
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Benefits of Professional Therapy:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Personalized treatment plans based on your specific needs</li>
                      <li>• Evidence-based therapeutic approaches (CBT, DBT, etc.)</li>
                      <li>• Professional crisis support and intervention</li>
                      <li>• Medication management when appropriate</li>
                      <li>• Long-term recovery and coping strategies</li>
                    </ul>
                  </div>
                  <Button onClick={() => window.location.href = '/find-therapist'} className="w-full" data-testid="button-find-therapist">
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Therapists Near Me
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
              Emergency Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-semibold">National Suicide Prevention Lifeline</p>
                  <p className="text-sm text-gray-600">24/7 crisis support</p>
                </div>
                <Badge variant="secondary">988</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-semibold">Crisis Text Line</p>
                  <p className="text-sm text-gray-600">Text support available 24/7</p>
                </div>
                <Badge variant="secondary">Text HOME to 741741</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-semibold">SAMHSA National Helpline</p>
                  <p className="text-sm text-gray-600">Treatment referral and information</p>
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
