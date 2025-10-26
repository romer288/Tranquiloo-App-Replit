import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ConsentCheckboxProps {
  onConsent: (consents: ConsentData) => void;
  onCancel?: () => void;
}

export interface ConsentData {
  notMedicalAdvice: boolean;
  notTherapy: boolean;
  crisisAwareness: boolean;
  notHipaa: boolean;
  termsOfService: boolean;
}

export default function ConsentCheckbox({ onConsent, onCancel }: ConsentCheckboxProps) {
  const [consents, setConsents] = useState<ConsentData>({
    notMedicalAdvice: false,
    notTherapy: false,
    crisisAwareness: false,
    notHipaa: false,
    termsOfService: false,
  });

  const allConsented = Object.values(consents).every(Boolean);

  const handleCheckboxChange = (key: keyof ConsentData, checked: boolean) => {
    setConsents(prev => ({ ...prev, [key]: checked }));
  };

  const handleSubmit = () => {
    if (allConsented) {
      onConsent(consents);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-bold text-red-900 mb-2">Required Acknowledgments</h2>
            <p className="text-sm text-red-800">
              Before using Tranquiloo, you must understand and acknowledge the following:
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="notMedicalAdvice"
              checked={consents.notMedicalAdvice}
              onCheckedChange={(checked) => handleCheckboxChange('notMedicalAdvice', checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="notMedicalAdvice" className="cursor-pointer leading-tight">
              <strong className="block mb-1">This is NOT Medical Advice</strong>
              <span className="text-sm text-gray-700">
                I understand that Tranquiloo provides informational content only and does not offer
                medical advice, diagnosis, or treatment.
              </span>
            </Label>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="notTherapy"
              checked={consents.notTherapy}
              onCheckedChange={(checked) => handleCheckboxChange('notTherapy', checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="notTherapy" className="cursor-pointer leading-tight">
              <strong className="block mb-1">This is NOT Therapy</strong>
              <span className="text-sm text-gray-700">
                I understand that Tranquiloo is not a substitute for professional therapy or mental
                health treatment. I will continue to work with licensed professionals.
              </span>
            </Label>
          </div>

          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <Checkbox
              id="crisisAwareness"
              checked={consents.crisisAwareness}
              onCheckedChange={(checked) => handleCheckboxChange('crisisAwareness', checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="crisisAwareness" className="cursor-pointer leading-tight">
              <strong className="block mb-1 text-red-900">Emergency Crisis Awareness</strong>
              <span className="text-sm text-red-800">
                I understand that Tranquiloo is NOT for crisis situations. In an emergency, I will
                call 988 (Suicide & Crisis Lifeline), text HOME to 741741, or call 911.
              </span>
            </Label>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="notHipaa"
              checked={consents.notHipaa}
              onCheckedChange={(checked) => handleCheckboxChange('notHipaa', checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="notHipaa" className="cursor-pointer leading-tight">
              <strong className="block mb-1">Not HIPAA Compliant</strong>
              <span className="text-sm text-gray-700">
                I understand that Tranquiloo is NOT HIPAA compliant. I will not share sensitive
                medical information like diagnoses, prescriptions, or medical records.
              </span>
            </Label>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              id="termsOfService"
              checked={consents.termsOfService}
              onCheckedChange={(checked) => handleCheckboxChange('termsOfService', checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="termsOfService" className="cursor-pointer leading-tight">
              <strong className="block mb-1">Terms of Service</strong>
              <span className="text-sm text-gray-700">
                I have read and agree to the{" "}
                <a
                  href="/terms-of-service"
                  target="_blank"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Terms of Service
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </Label>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!allConsented}
            className="flex-1"
          >
            {allConsented ? "I Understand & Agree" : "Please acknowledge all items"}
          </Button>
        </div>

        {!allConsented && (
          <p className="text-sm text-gray-600 text-center mt-3">
            You must acknowledge all items above to continue
          </p>
        )}
      </Card>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Need help right now?</strong> Call 988 (Suicide & Crisis Lifeline) or text HOME to 741741
        </p>
      </Card>
    </div>
  );
}
