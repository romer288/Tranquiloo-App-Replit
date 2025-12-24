
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, FileText, Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const Privacy = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

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
            {t('termsOfService.backToSettings' ,'Back to Settings')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('privacy.title' ,'Privacy Policy')}</h1>
          <p className="text-gray-600">{t('privacy.lastUpdated' ,'Last updated')}: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                {t('privacy.privacyProtection' ,'Privacy Protection (HIPAA readiness in progress)')}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                {t('privacy.privacyProtectionDescription' ,'Tranquiloo is committed to protecting your privacy and maintaining strong data security. We are working toward HIPAA readiness, but we are not yet covered by BAAs with all vendors; please avoid sharing PHI until that is complete. We still encrypt and protect data, but full HIPAA obligations will apply only after BAAs are in place.')}
                {/* Tranquiloo is committed to protecting your privacy and maintaining strong data security. We are working toward HIPAA readiness, but we are not yet covered by BAAs with all vendors; please avoid sharing PHI until that is complete. */}
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">🏥 {t('privacy.hipaaReadiness' ,'HIPAA Readiness (In Progress)')}</h4>
                <p className="text-blue-800">
                  {t('privacy.hipaaReadinessDescription' ,'We are working toward HIPAA readiness and formal BAAs. Until then, do not share Protected Health Information (PHI). We still encrypt and protect data, but full HIPAA obligations will apply only after BAAs are in place.')}
                  {/* We are working toward HIPAA readiness and formal BAAs. Until then, do not share Protected Health Information (PHI). We still encrypt and protect data, but full HIPAA obligations will apply only after BAAs are in place. */}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
               {t('privacy.informationWeCollect' ,'Information We Collect')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('privacy.personalInformation' ,'Personal Information')}</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>{t('privacy.personalInformationItem1' ,'Email address for account creation and authentication')}</li>
                    <li>{t('privacy.personalInformationItem2' ,'Phone number if provided for two-factor authentication')}</li>
                    <li>{t('privacy.personalInformationItem3' ,'Profile information you choose to share')}</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('privacy.healthRelatedInformation' ,'Health-Related Information')}</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>{t('privacy.healthRelatedInformationItem1' ,'Anxiety levels and mood tracking data')}</li>
                    <li>{t('privacy.healthRelatedInformationItem2' ,'Conversation transcripts with our AI therapist')}</li>
                    <li>{t('privacy.healthRelatedInformationItem3' ,'Goal setting and progress tracking information')}</li>
                    <li>{t('privacy.healthRelatedInformationItem4' ,'Treatment outcomes and intervention summaries')}</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{t('privacy.technicalInformation' ,'Technical Information')}</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>{t('privacy.technicalInformationItem1' ,'Device information and browser type')}</li>
                    <li>{t('privacy.technicalInformationItem2' ,'Usage analytics (only if explicitly consented)')}</li>
                    <li>{t('privacy.technicalInformationItem3' ,'Security logs for fraud prevention')}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                {t('privacy.howWeProtectYourInformation' ,'How We Protect Your Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">🔐 {t('privacy.encryption' ,'Encryption')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('privacy.encryptionDescription' ,'All data is encrypted both in transit (TLS 1.3) and at rest (AES-256) using industry-standard encryption protocols.')}
                      {/* All data is encrypted both in transit (TLS 1.3) and at rest (AES-256) using industry-standard encryption protocols. */}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">🏢 {t('privacy.secureInfrastructure' ,'Secure Infrastructure')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('privacy.secureInfrastructureDescription' ,'Our servers use industry-standard security; we are moving toward BAA-covered infrastructure for HIPAA workloads.')}
                      {/* Our servers use industry-standard security; we are moving toward BAA-covered infrastructure for HIPAA workloads. */}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">👥{ t('privacy.accessControls' ,'Access Controls')}</h4>
                    <p className="text-sm text-gray-700">
                      {t('privacy.accessControlsDescription' ,'Strict access controls ensure only authorized personnel can access your data, and all access is logged.')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                {t('privacy.yourRightsAndChoices' ,'Your Rights and Choices')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">{t('privacy.yourRightsAndChoicesDescription' ,'Under HIPAA and State Privacy Laws, you have the right to:')}</h4>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>{t('privacy.yourRightsAndChoicesItem1' ,'Access:')}</strong> {t('privacy.yourRightsAndChoicesItem2' ,'Request copies of your personal health information')}</li>
                  <li><strong>{t('privacy.yourRightsAndChoicesItem3' ,'Rectification:')}</strong> {t('privacy.yourRightsAndChoicesItem4' ,'Request correction of inaccurate or incomplete data')}</li>
                  <li><strong>{t('privacy.yourRightsAndChoicesItem5' ,'Erasure:')}</strong> {t('privacy.yourRightsAndChoicesItem6' ,'Request deletion of your personal information')}</li>
                  <li><strong>{t('privacy.yourRightsAndChoicesItem7' ,'Portability:')}</strong> {t('privacy.yourRightsAndChoicesItem8' ,'Request your data in a machine-readable format')}</li>
                  <li><strong>{t('privacy.yourRightsAndChoicesItem9' ,'Restriction:')}</strong> {t('privacy.yourRightsAndChoicesItem10' ,'Request limitation of processing of your data')}</li>
                  <li><strong>{t('privacy.yourRightsAndChoicesItem11' ,'Objection:')}</strong> {t('privacy.yourRightsAndChoicesItem12' ,'Object to certain types of data processing')}</li>
                  <li><strong>{t('privacy.yourRightsAndChoicesItem13' ,'Breach Notification:')}</strong> {t('privacy.yourRightsAndChoicesItem14' ,'Be notified of any data breaches within 72 hours')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('privacy.stateSpecificCompliance' ,'State-Specific Compliance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                {t('privacy.stateSpecificComplianceDescription' ,'We comply with all applicable state privacy laws including but not limited to:')}
                {/* We comply with all applicable state privacy laws including but not limited to: */}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>{t('privacy.stateSpecificComplianceItem1' ,'California Consumer Privacy Act (CCPA)')}</li>
                  <li>{t('privacy.stateSpecificComplianceItem2' ,'California Privacy Rights Act (CPRA)')}</li>
                  <li>{t('privacy.stateSpecificComplianceItem3' ,'Virginia Consumer Data Protection Act (VCDPA)')}</li>
                  <li>{t('privacy.stateSpecificComplianceItem4' ,'Colorado Privacy Act (CPA)')}</li>
                </ul>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>{t('privacy.stateSpecificComplianceItem5' ,'Connecticut Data Privacy Act (CTDPA)')}</li>
                  <li>{t('privacy.stateSpecificComplianceItem6' ,'Utah Consumer Privacy Act (UCPA)')}</li>
                  <li>{t('privacy.stateSpecificComplianceItem7' ,'Illinois Genetic Information Privacy Act')}</li>
                  <li>{t('privacy.stateSpecificComplianceItem8' ,'Texas Identity Theft Enforcement and Protection Act')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('privacy.dataSharingAndThirdParties' ,'Data Sharing and Third Parties')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 mb-4">
                <h4 className="font-semibold text-green-900 mb-2">✅ {t('privacy.ourCommitment' ,'Our Commitment')}</h4>
                <p className="text-green-800">
                  {t('privacy.ourCommitmentDescription' ,'We never sell, rent, or share your personal health information with third parties for marketing purposes. Your data is yours and yours alone.')}
                  {/* We never sell, rent, or share your personal health information with third parties for marketing purposes. Your data is yours and yours alone. */}
                </p>
              </div>
              
              <p className="text-gray-700 mb-4">
                {t('privacy.dataSharingAndThirdPartiesDescription' ,'We may only share your information in the following limited circumstances:')}
                {/* We may only share your information in the following limited circumstances: */}
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>{t('privacy.dataSharingAndThirdPartiesItem1' ,'With your explicit written consent')}</li>
                <li>{t('privacy.dataSharingAndThirdPartiesItem2' ,'When required by law or legal process')}</li>
                <li>{t('privacy.dataSharingAndThirdPartiesItem3' ,'To prevent serious harm to you or others')}</li>
                <li>{t('privacy.dataSharingAndFourthPartiesItem4' ,'For emergency medical treatment')}</li>
                <li>{t('privacy.dataSharingAndThirdPartiesItem5' ,'With HIPAA-compliant service providers who assist in providing our services')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('privacy.contactInformation' ,'Contact Information')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                {t('privacy.contactInformationDescription' ,'If you have any questions about this Privacy Policy or wish to exercise your rights, please contact our Privacy Officer:')}
                {/* If you have any questions about this Privacy Policy or wish to exercise your rights, please contact our Privacy Officer: */}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">{t('privacy.privacyOfficer' ,'Privacy Officer')}</p>
                <p className="text-gray-700">{t('privacy.privacyOfficerEmail' ,'Email: privacy@tranquiloo-app.com')}</p>
                  <p className="text-gray-700">{t('privacy.privacyOfficerPhone' ,'Phone: +1-385-867-8804')}</p>
                  <p className="text-gray-700">{t('privacy.privacyOfficerResponseTime' ,'Response Time: Within 30 days as required by law')}</p>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('privacy.changesToThisPolicy' ,'Changes to This Policy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                {t('privacy.changesToThisPolicyDescription' ,'We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by email and by posting the updated policy on our website. Your continued use of our services after such modifications constitutes acceptance of the updated Privacy Policy.')}
                {/* We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by email and by posting the updated policy on our website. Your continued use of our services after such modifications constitutes acceptance of the updated Privacy Policy. */}
                or applicable laws. We will notify you of any material changes by email and by posting 
                the updated policy on our website. Your continued use of our services after such 
                modifications constitutes acceptance of the updated Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
