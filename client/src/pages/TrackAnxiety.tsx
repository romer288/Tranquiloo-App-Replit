
import React from 'react';
import TrackAnxietyForm from '@/components/track-anxiety/TrackAnxietyForm';
import RecentEntriesCard from '@/components/track-anxiety/RecentEntriesCard';

const TrackAnxiety = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">Track Anxiety</h1>
            <p className="text-sm text-gray-600">Record your current anxiety level and identify triggers</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <TrackAnxietyForm />
        <RecentEntriesCard />
      </div>
    </div>
  );
};

export default TrackAnxiety;
