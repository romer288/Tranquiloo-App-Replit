
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/context/LanguageContext';

const Help = () => {
  const { t } = useLanguage();
  const faqs = [
    { question: t('help.q1'), answer: t('help.a1') },
    { question: t('help.q2'), answer: t('help.a2') },
    { question: t('help.q3'), answer: t('help.a3') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className=" max-w-[340px] md:max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('help.title')}</h1>
        </div>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('help.faqTitle')}</h2>
              <p className="text-gray-600">{t('help.faqDesc')}</p>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-medium text-gray-900 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support Section */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('help.contactTitle')}</h2>
              <p className="text-gray-600 mb-4">{t('help.contactDesc')}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 mb-4">
                {t('help.contactBody')}
              </p>
              <div className="flex items-center">
                <span className="font-medium text-gray-700">{t('help.contactEmailLabel')}: </span>
                <a href={`mailto:${t('help.contactEmail')}`} className="text-blue-600 hover:text-blue-800 ml-1">
                  {t('help.contactEmail')}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Help;
