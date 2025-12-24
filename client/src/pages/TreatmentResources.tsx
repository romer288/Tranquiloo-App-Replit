
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  Target, 
  Brain, 
  Heart,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import TreatmentOutcomes from '@/components/TreatmentOutcomes';
import { GoalTracker } from '@/components/goals/GoalTracker';
import InterventionSummariesSection from '@/components/analytics/InterventionSummariesSection';
import { interventionSummaryService } from '@/services/interventionSummaryService';
import { useGoalsData } from '@/hooks/useGoalsData';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { filterAnalysesByRange, getAnalysisDateBounds } from '@/utils/filterAnalysesByRange';
import { useLanguage } from '@/context/LanguageContext';

const TreatmentResources = () => {
  const { t, language } = useLanguage();
  const { data, getAllAnalyses } = useAnalyticsData();
  const summariesData = useGoalsData();
  const { summaries } = summariesData;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summariesGenerated, setSummariesGenerated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const allAnalyses = getAllAnalyses();
  const analysisBounds = useMemo(
    () => getAnalysisDateBounds(allAnalyses),
    [allAnalyses]
  );
  const [treatmentRange, setTreatmentRange] = useState<DateRange>();
  const filteredAnalyses = useMemo(
    () => filterAnalysesByRange(allAnalyses, treatmentRange),
    [allAnalyses, treatmentRange]
  );

  // Auto-generate summaries when component mounts and we have analyses
  useEffect(() => {
    const generateSummariesOnLoad = async () => {
      if (allAnalyses.length > 0 && !summariesGenerated) {
        try {
          console.log('🚀 Auto-generating intervention summaries...');
          // Generate summaries placeholder - implement actual service method
          console.log('Generating intervention summaries...');
          await summariesData.refetch();
          setSummariesGenerated(true);
          console.log('✅ Summaries generated and refetched');
        } catch (error) {
          console.error('❌ Error auto-generating summaries:', error);
        }
      }
    };

    generateSummariesOnLoad();
  }, [allAnalyses.length, summariesGenerated, summariesData]);

  const treatmentOptions = useMemo(() => [
    {
      id: 'cbt',
      title: t('treatmentResources.treatment.cbt.title', 'Cognitive Behavioral Therapy (CBT)'),
      description: t('treatmentResources.treatment.cbt.description', 'Evidence-based therapy focusing on changing thought patterns and behaviors'),
      category: 'therapy',
      effectiveness: 'high',
      duration: t('treatmentResources.treatment.cbt.duration', '12-20 sessions'),
      icon: Brain,
      recommended: true
    },
    {
      id: 'dbt',
      title: t('treatmentResources.treatment.dbt.title', 'Dialectical Behavior Therapy (DBT)'),
      description: t('treatmentResources.treatment.dbt.description', 'Skills-based therapy for emotional regulation and distress tolerance'),
      category: 'therapy',
      effectiveness: 'high',
      duration: t('treatmentResources.treatment.dbt.duration', '6 months - 1 year'),
      icon: Heart,
      recommended: false
    },
    {
      id: 'mindfulness',
      title: t('treatmentResources.treatment.mindfulness.title', 'Mindfulness-Based Stress Reduction'),
      description: t('treatmentResources.treatment.mindfulness.description', 'Meditation and mindfulness practices to reduce anxiety and stress'),
      category: 'self-help',
      effectiveness: 'moderate',
      duration: t('treatmentResources.treatment.mindfulness.duration', '8-12 weeks'),
      icon: Target,
      recommended: true
    },
    {
      id: 'support-group',
      title: t('treatmentResources.treatment.supportGroup.title', 'Anxiety Support Groups'),
      description: t('treatmentResources.treatment.supportGroup.description', 'Peer support and shared experiences with anxiety management'),
      category: 'support',
      effectiveness: 'moderate',
      duration: t('treatmentResources.treatment.supportGroup.duration', 'Ongoing'),
      icon: Users,
      recommended: false
    }
  ], [t, language]);

  const resources = [
    {
      title: 'Anxiety and Depression Workbook',
      type: 'book',
      description: 'Self-help workbook with practical exercises',
      url: '#'
    },
    {
      title: 'Headspace: Meditation App',
      type: 'app',
      description: 'Guided meditation and mindfulness exercises',
      url: '#'
    },
    {
      title: 'Crisis Text Line',
      type: 'helpline',
      description: '24/7 support via text message',
      phone: '741741'
    }
  ];

  const categories = useMemo(() => [
    { id: 'all', label: t('treatmentResources.category.all', 'All Resources') },
    { id: 'therapy', label: t('treatmentResources.category.therapy', 'Professional Therapy') },
    { id: 'self-help', label: t('treatmentResources.category.selfHelp', 'Self-Help') },
    { id: 'support', label: t('treatmentResources.category.support', 'Support Groups') }
  ], [t, language]);

  const filteredTreatments = selectedCategory === 'all' 
    ? treatmentOptions 
    : treatmentOptions.filter(t => t.category === selectedCategory);

  const connectToTherapist = () => {
    // Navigate to Contact Therapist tab as requested
    navigate('/contact-therapist');
  };

  const hasActiveTreatment = false; // This would come from user data

  const handleDownloadSummary = async () => {
    try {
      console.log('🔄 Starting download summary...');
      console.log('📊 Current analyses count:', allAnalyses.length);
      console.log('📋 Current summaries count:', summaries.length);
      
      // Use the summary report service to download as PDF-like format
      const { downloadSummaryReport } = await import('@/services/summaryReportService');
      downloadSummaryReport(summaries, summariesData.goals || [], allAnalyses, {
        fileName: 'conversation-summary',
        title: t('reports.conversationSummaryTitle', 'Conversation Summary & Intervention Report'),
        language,
        t,
      });
      
      toast({
        title: t('treatmentResources.toast.success', 'Success'),
        description: t('treatmentResources.toast.downloadSuccess', 'Conversation summary downloaded successfully'),
      });
    } catch (error) {
      console.error('Error downloading summary:', error);
      toast({
        title: t('treatmentResources.toast.error', 'Error'), 
        description: t('treatmentResources.toast.downloadError', 'Failed to download conversation summary'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 pt-3 md:pb-0 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-screen-sm sm:max-w-screen-md mx-auto w-full">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900">{t('treatmentResources.title')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('treatmentResources.subtitle')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Button onClick={handleDownloadSummary} variant="outline" size="sm" disabled={allAnalyses.length === 0} className="w-full text-sm whitespace-normal">
                <Download className="w-4 h-4 mr-2" />
                {t('treatmentResources.download')}
              </Button>
              <Button onClick={connectToTherapist} className="bg-blue-600 hover:bg-blue-700 w-full text-sm whitespace-normal">
                <Users className="w-4 h-4 mr-2" />
                {t('treatmentResources.connect')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[390px] sm:max-w-screen-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-hidden">
        {/* Treatment Status */}
        <Card className="p-6 mb-8 w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            {hasActiveTreatment ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">{t('treatmentResources.title')}</h3>
                  <p className="text-gray-600">{t('treatmentResources.subtitle')}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-orange-600" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">{t('treatmentResources.noActiveTitle')}</h3>
                  <p className="text-gray-600">{t('treatmentResources.noActiveDesc')}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => navigate('/assessment')} className="w-full sm:w-auto text-sm whitespace-normal">
                    {t('treatmentResources.takeAssessment')}
                  </Button>
                  <Button onClick={connectToTherapist} className="w-full sm:w-auto text-sm whitespace-normal">
                    {t('treatmentResources.findTherapist')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Goal Tracker - Track Outcome Measures */}
        <div className="mb-8 ">
          <GoalTracker />
        </div>

        {/* Treatment Outcomes */}
        <div className="mb-8">
          <TreatmentOutcomes 
            analyses={filteredAnalyses}
            dateRange={treatmentRange}
            onDateRangeChange={setTreatmentRange}
            minDate={analysisBounds.min}
            maxDate={analysisBounds.max}
          />
        </div>

        {/* Weekly Intervention Summaries Section */}
        <div className="mb-8 w-full border">
          <InterventionSummariesSection summaries={summaries} analyses={allAnalyses} />
        </div>

        {/* Treatment Options */}
        <Card className="p-6 mb-8">
           <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{t('treatmentResources.recommendedOptions', 'Recommended Treatment Options')}</h3>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Treatment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTreatments.map(treatment => {
              const IconComponent = treatment.icon;
              return (
                <Card key={treatment.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{treatment.title}</h4>
                        {treatment.recommended && (
                           <Badge variant="secondary" className="text-xs">{t('treatmentResources.recommended', 'Recommended')}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{treatment.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                         <span>{t('treatmentResources.duration', 'Duration')}: {treatment.duration}</span>
                        <span className={`px-2 py-1 text-center rounded-full ${
                          treatment.effectiveness === 'high' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                                                   {treatment.effectiveness === 'high' 
                            ? t('treatmentResources.effectiveness.high', 'high')
                            : t('treatmentResources.effectiveness.moderate', 'moderate')} {t('treatmentResources.effectiveness', 'effectiveness')}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 w-full"
                        onClick={() => navigate('/chat', { 
                          state: { 
                            initialMessage: `Tell me more about ${treatment.title} and how it can help with my anxiety. I'd like to understand the process, what to expect, and if it's right for me.` 
                          } 
                        })}
                      >
                         {t('treatmentResources.learnMore', 'Learn More')}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default TreatmentResources;
