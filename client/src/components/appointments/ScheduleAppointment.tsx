import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Video, Phone, User } from 'lucide-react';

interface ScheduleAppointmentProps {
  patientId: string;
  therapistEmail?: string;
  onScheduled?: () => void;
}

const ScheduleAppointment: React.FC<ScheduleAppointmentProps> = ({
  patientId,
  therapistEmail,
  onScheduled,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [connectedTherapists, setConnectedTherapists] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    therapistEmail: therapistEmail || '',
    appointmentDate: '',
    appointmentTime: '',
    duration: 60,
    type: 'video' as 'video' | 'audio' | 'in_person',
    notes: '',
  });

  useEffect(() => {
    // Fetch connected therapists
    const fetchTherapists = async () => {
      try {
        const response = await fetch(`/api/therapist-connections?patientId=${patientId}`);
        if (response.ok) {
          const data = await response.json();
          setConnectedTherapists(data);

          // If only one therapist, auto-select
          if (data.length === 1 && !therapistEmail) {
            setFormData(prev => ({ ...prev, therapistEmail: data[0].therapistEmail }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch therapists:', error);
      }
    };

    fetchTherapists();
  }, [patientId, therapistEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.therapistEmail || !formData.appointmentDate || !formData.appointmentTime) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/appointments/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          ...formData,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Appointment Scheduled',
          description: 'Your appointment has been scheduled successfully',
        });

        // Reset form
        setFormData({
          therapistEmail: therapistEmail || '',
          appointmentDate: '',
          appointmentTime: '',
          duration: 60,
          type: 'video',
          notes: '',
        });

        onScheduled?.();
      } else {
        throw new Error('Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
      toast({
        title: 'Scheduling Failed',
        description: 'Unable to schedule appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule Appointment
        </CardTitle>
        <p className="text-sm text-gray-600">
          Book a video or audio session with your therapist
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Therapist Selection */}
          <div className="space-y-2">
            <Label htmlFor="therapist">Therapist *</Label>
            {connectedTherapists.length > 0 ? (
              <select
                id="therapist"
                value={formData.therapistEmail}
                onChange={(e) => setFormData({ ...formData, therapistEmail: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
                disabled={!!therapistEmail}
              >
                <option value="">Select a therapist</option>
                {connectedTherapists.map((therapist) => (
                  <option key={therapist.therapistEmail} value={therapist.therapistEmail}>
                    {therapist.therapistEmail}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md space-y-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ No Connected Therapists
                </p>
                <p className="text-sm text-yellow-700">
                  You need to connect with a therapist before scheduling appointments.
                </p>
                <a
                  href="/contact-therapist"
                  className="inline-block text-sm text-blue-600 hover:text-blue-700 underline font-medium"
                >
                  → Click here to connect with a therapist
                </a>
                <div className="mt-2 pt-2 border-t border-yellow-300">
                  <p className="text-xs text-yellow-700">
                    <strong>How it works:</strong> Go to "Contact Therapist", submit your therapist's email, and wait for them to accept your connection request.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <select
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              className="w-full p-2 border rounded-md"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes (1 hour)</option>
              <option value={90}>90 minutes (1.5 hours)</option>
            </select>
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label>Session Type *</Label>
          <div className="grid grid-cols-2 gap-4">
            <Card
              className={`cursor-pointer transition-all ${
                formData.type === 'video'
                  ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setFormData({ ...formData, type: 'video' })}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Video className={`w-5 h-5 ${formData.type === 'video' ? 'text-blue-600' : 'text-gray-600'}`} />
                  <div>
                    <p className="font-medium text-sm">Video Call</p>
                    <p className="text-xs text-gray-600">Face-to-face session</p>
                  </div>
                </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                formData.type === 'audio'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
                onClick={() => setFormData({ ...formData, type: 'audio' })}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Phone className={`w-5 h-5 ${formData.type === 'audio' ? 'text-green-600' : 'text-gray-600'}`} />
                  <div>
                    <p className="font-medium text-sm">Audio Call</p>
                    <p className="text-xs text-gray-600">Voice only session</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  formData.type === 'in_person'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300'
                }`}
                onClick={() => setFormData({ ...formData, type: 'in_person' })}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <User className={`w-5 h-5 ${formData.type === 'in_person' ? 'text-amber-600' : 'text-gray-600'}`} />
                  <div>
                    <p className="font-medium text-sm">In-Person</p>
                    <p className="text-xs text-gray-600">Meet at the therapy location</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific topics or concerns you'd like to discuss..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Important Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">
              📶 Important Information
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Both you and your therapist need internet connection</li>
              <li>• Sessions may be recorded for quality; we are working toward HIPAA readiness</li>
              <li>• You'll receive a reminder 1 hour before your appointment</li>
              <li>• Please join 5 minutes early to test your connection</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || connectedTherapists.length === 0}
          >
            {loading ? 'Scheduling...' : 'Schedule Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ScheduleAppointment;
