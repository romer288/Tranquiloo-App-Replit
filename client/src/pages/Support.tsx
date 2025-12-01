import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MessageCircle, HelpCircle, Clock, Shield } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const Support = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/settings')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('support.backSettings')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('support.title')}</h1>
          <p className="text-gray-600">{t('support.subtitle')}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                {t('support.contactTeam')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                {t('support.contactBody')}
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">{t('support.emailSupport')}</h3>
                  </div>
                  <p className="text-blue-800 mb-3">
                    {t('support.emailDesc')}
                  </p>
                  <div className="bg-white p-3 rounded">
                    <p className="font-semibold text-gray-900">support@tranquiloo-app.com</p>
                    <p className="text-sm text-gray-600">{t('support.emailDesc')}</p>
                  </div>
                  <Button 
                    className="mt-3 w-full" 
                    onClick={() => window.location.href = 'mailto:support@tranquiloo-app.com'}
                  >
                    {t('support.emailCta')}
                  </Button>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-green-900">{t('support.phoneSupport')}</h3>
                  </div>
                  <p className="text-green-800 mb-3">
                    {t('support.phoneDesc')}
                  </p>
                  <div className="bg-white p-3 rounded">
                    <p className="font-semibold text-gray-900">+1-385-867-8804</p>
                    <p className="text-sm text-gray-600">Mon-Fri: 9AM-6PM MST</p>
                  </div>
                  <Button 
                    className="mt-3 w-full bg-green-600 hover:bg-green-700" 
                    onClick={() => window.location.href = 'tel:+13858678804'}
                  >
                    {t('support.callNow')}
                  </Button>
                </div>
              </div>

              <div className="mt-6 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">{t('support.textSupport')}</h4>
                </div>
                <p className="text-purple-800 mb-2">
                  {t('support.textDesc')}
                </p>
                <p className="font-semibold text-gray-900">+1-385-867-8804</p>
                <p className="text-sm text-gray-600">{t('support.textAvailability')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                {t('support.crisisTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 mb-4">
                <h4 className="font-semibold text-red-900 mb-2">🚨 {t('support.crisisLead')}</h4>
                <div className="text-red-800 space-y-1">
                  <p><strong>Call 911</strong> - Emergency Services</p>
                  <p><strong>Call 988</strong> - Suicide & Crisis Lifeline (24/7)</p>
                  <p><strong>Text "HELLO" to 741741</strong> - Crisis Text Line (24/7)</p>
                  <p><strong>Call 1-800-366-8288</strong> - Self-Injury Outreach & Support</p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                {t('support.contactBody')}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{t('support.nationalResources')}</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• SAMHSA National Helpline: 1-800-662-4357</li>
                    <li>• National Alliance on Mental Illness: 1-800-950-6264</li>
                    <li>• Crisis Text Line: Text HOME to 741741</li>
                    <li>• Veterans Crisis Line: 1-800-273-8255</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{t('support.onlineResources')}</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• suicidepreventionlifeline.org</li>
                    <li>• crisistextline.org</li>
                    <li>• nami.org (Support groups & resources)</li>
                    <li>• mentalhealth.gov</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-600" />
                {t('support.faqTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('support.faq1.q')}</h4>
                  <p className="text-gray-700">{t('support.faq1.a')}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('support.faq2.q')}</h4>
                  <p className="text-gray-700">{t('support.faq2.a')}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('support.faq3.q')}</h4>
                  <p className="text-gray-700">{t('support.faq3.a')}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('support.faq4.q')}</h4>
                  <p className="text-gray-700">{t('support.faq4.a')}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('support.faq5.q')}</h4>
                  <p className="text-gray-700">{t('support.faq5.a')}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('support.faq6.q')}</h4>
                  <p className="text-gray-700 mb-3">{t('support.faq6.a')}</p>
                  <div className="bg-blue-50 p-4 rounded-lg mb-3">
                    <p className="font-semibold text-blue-900 mb-2">For Therapists:</p>
                    <div className="space-y-2">
                      <div>
                        <a 
                          href="/therapist-info" 
                          className="text-blue-600 hover:text-blue-800 font-medium block"
                        >
                          📋 Learn about the Therapist Portal →
                        </a>
                      </div>
                      <div>
                        <a 
                          href="/therapist-portal" 
                          className="text-blue-600 hover:text-blue-800 font-medium block"
                        >
                          🔐 Access Patient Dashboard →
                        </a>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Therapists log in with their email address to see connected patients' analytics and receive weekly reports automatically.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Is there a cost to use Tranquiloo?</h4>
                  <p className="text-gray-700">
                    Tranquiloo offers both free and premium features. Basic anxiety tracking and 
                    conversations are free. Premium features include advanced analytics and 
                    therapist connection services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Support Hours & Response Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Business Hours</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM MST</p>
                    <p><strong>Saturday:</strong> 10:00 AM - 4:00 PM MST</p>
                    <p><strong>Sunday:</strong> Closed</p>
                    <p className="text-sm text-gray-600 mt-2">
                      *Emergency resources are available 24/7 through the crisis hotlines listed above
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Response Times</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Phone:</strong> Immediate during business hours</p>
                    <p><strong>Email:</strong> Within 24 hours</p>
                    <p><strong>Text:</strong> Within 4 hours</p>
                    <p><strong>Critical Issues:</strong> Within 2 hours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback & Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We're constantly working to improve Tranquiloo based on user feedback. If you have 
                suggestions for new features, improvements, or general feedback about your experience, 
                we'd love to hear from you.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Share Your Ideas</h4>
                <p className="text-blue-800 mb-3">
                  Send your feedback to: <strong>feedback@tranquiloo-app.com</strong>
                </p>
                <p className="text-sm text-blue-700">
                  We review all feedback and prioritize features based on user needs and clinical value.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;
