import { AlertCircle, Phone } from "lucide-react";

export default function CrisisFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-50 border-t border-red-200 py-2 px-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2 text-red-900">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">Crisis?</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-red-800">
          <a
            href="tel:988"
            className="flex items-center gap-1 hover:underline font-medium"
          >
            <Phone className="w-3 h-3" />
            Call 988
          </a>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Text HOME to 741741</span>
          <span className="hidden sm:inline">|</span>
          <span className="text-xs text-red-700">Not medical advice • Not therapy</span>
        </div>
      </div>
    </div>
  );
}
