import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-red-900 mb-2">IMPORTANT: This is NOT Medical Advice</h2>
            <p className="text-red-800">
              Tranquiloo is a wellness and self-help tool. It is <strong>NOT</strong> a medical device,
              mental health treatment, or substitute for professional therapy.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. What Tranquiloo Is</h2>
            <p className="mb-2">Tranquiloo is a <strong>personal wellness companion</strong> that provides:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AI-powered conversations based on evidence-based research</li>
              <li>Mood and wellness tracking tools</li>
              <li>Coping strategies from published mental health research</li>
              <li>A supportive space for self-reflection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. What Tranquiloo Is NOT</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
              <p className="flex items-center gap-2">
                <span className="text-2xl">❌</span>
                <strong>NOT</strong> a medical device or diagnostic tool
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">❌</span>
                <strong>NOT</strong> a substitute for professional therapy or treatment
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">❌</span>
                <strong>NOT</strong> for crisis situations or emergencies
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">❌</span>
                <strong>NOT</strong> HIPAA compliant
              </p>
              <p className="flex items-center gap-2">
                <span className="text-2xl">❌</span>
                <strong>NOT</strong> staffed by licensed therapists or medical professionals
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Emergency Resources</h2>
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="font-semibold text-red-900 mb-2">If you are in crisis or need immediate help:</p>
              <ul className="space-y-2">
                <li><strong>Call 988</strong> - Suicide & Crisis Lifeline (US)</li>
                <li><strong>Text HOME to 741741</strong> - Crisis Text Line</li>
                <li><strong>Call 911</strong> - For emergencies</li>
                <li><strong>Visit your nearest emergency room</strong></li>
              </ul>
              <p className="mt-3 text-sm text-red-800">
                <strong>Do not use Tranquiloo for crisis situations.</strong> Our AI cannot provide emergency support.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data & Privacy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your conversations are stored to improve your experience and provide continuity</li>
              <li>We use OpenAI's API with zero data retention (they don't train on your data)</li>
              <li>Your data is encrypted in transit and at rest</li>
              <li><strong>We are NOT HIPAA compliant</strong> - do not share sensitive medical information</li>
              <li>We are NOT a "covered entity" or "business associate" under HIPAA regulations</li>
              <li>Therapists can view your progress only with your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. AI-Generated Content Disclaimer</h2>
            <p className="mb-2">
              Our AI responses are based on 100+ curated research papers from reputable sources like PubMed,
              NIMH, and WHO. However:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI responses are <strong>informational only</strong>, not medical advice</li>
              <li>The AI cannot diagnose mental health conditions</li>
              <li>The AI cannot prescribe treatments or medications</li>
              <li>Research-based suggestions should be discussed with your healthcare provider</li>
              <li>AI responses may contain errors or inaccuracies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Responsibilities</h2>
            <p className="mb-2">By using Tranquiloo, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service at your own risk</li>
              <li>Understand this is NOT therapy or medical treatment</li>
              <li>Not share sensitive medical information (medical records, prescriptions, diagnoses)</li>
              <li>Seek professional help when needed</li>
              <li>Not rely solely on Tranquiloo for mental health support</li>
              <li>Call emergency services (988 or 911) in crisis situations</li>
              <li>Continue working with licensed professionals for mental health treatment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Therapist Portal</h2>
            <p className="mb-2">
              If you're a therapist monitoring patient progress:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You can view patient wellness trends only with explicit patient consent</li>
              <li>This tool is for informational purposes only</li>
              <li>Do not use Tranquiloo data for diagnosis or treatment decisions</li>
              <li>Maintain your professional standards and ethics</li>
              <li>This does not replace your clinical judgment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Liability Disclaimer</h2>
            <p className="mb-2">
              Tranquiloo and its creators are NOT liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any decisions made based on AI responses</li>
              <li>Medical outcomes or mental health deterioration</li>
              <li>Delayed or inadequate emergency response</li>
              <li>Errors or inaccuracies in AI-generated content</li>
              <li>Technical issues or data loss</li>
            </ul>
            <p className="mt-3 font-semibold">
              You use Tranquiloo entirely at your own risk. Always consult licensed professionals for
              mental health treatment and medical decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
            <p>
              We may update these Terms of Service at any time. Continued use of Tranquiloo constitutes
              acceptance of updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
            <p>
              For questions about these terms, contact us at: <strong>support@tranquiloo.com</strong>
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
