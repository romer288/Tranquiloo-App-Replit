// Therapist report service - migrated from Supabase to new API endpoints
// This service handles sharing analytics with therapists

export const therapistReportService = {
  async shareAnalyticsWithTherapist(): Promise<{ success: boolean; message: string }> {
    try {
      const { AuthService } = await import('@/services/authService');
      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser?.id) {
        return {
          success: false,
          message: 'Please sign in again before sharing your analytics.'
        };
      }

      const response = await fetch('/api/therapist/share-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id })
      });

      const parseResponse = async () => {
        try {
          return await response.json();
        } catch (error) {
          console.warn('Share analytics response was not JSON:', error);
          return null;
        }
      };

      const data = await parseResponse();

      if (!response.ok) {
        const message = data?.message || 'We could not send your report right now. Please try again later.';
        return {
          success: false,
          message,
        };
      }

      return {
        success: Boolean(data?.success),
        message: data?.message || 'Your analytics were shared successfully.'
      };
    } catch (error) {
      console.error('Error sharing analytics with therapist:', error);
      return {
        success: false,
        message: 'Failed to share analytics with therapist. Please try again later.'
      };
    }
  },

  async generateAnalyticsHTML(): Promise<string> {
    // Placeholder implementation
    return `
      <div>
        <h2>Patient Analytics Report</h2>
        <p>This feature is being migrated to the new API system.</p>
      </div>
    `;
  },

  async generateDownloadHistoryHTML(): Promise<string> {
    // Placeholder implementation
    return `
      <div>
        <h2>Download History</h2>
        <p>Download history tracking is being migrated.</p>
      </div>
    `;
  }
};
