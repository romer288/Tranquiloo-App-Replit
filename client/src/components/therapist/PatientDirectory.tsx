import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, User, Mail, Phone, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  connectionId: string;
  patientId: string;
  patientEmail: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  connectedAt: number;
  shareAnalytics: boolean;
  shareReports: boolean;
}

interface PatientDirectoryProps {
  therapistEmail: string;
}

const PatientDirectory: React.FC<PatientDirectoryProps> = ({ therapistEmail }) => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [therapistEmail]);

  useEffect(() => {
    // Filter patients based on search query
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(
        (patient) =>
          patient.firstName?.toLowerCase().includes(query) ||
          patient.lastName?.toLowerCase().includes(query) ||
          patient.patientEmail?.toLowerCase().includes(query) ||
          patient.patientCode?.toLowerCase().includes(query)
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const loadPatients = async () => {
    try {
      const response = await fetch(`/api/therapist/${encodeURIComponent(therapistEmail)}/patients`);
      if (response.ok) {
        const data = await response.json();
        // Deduplicate by patientId (keep first)
        const seen = new Set<string>();
        const deduped = data.filter((p: Patient) => {
          if (seen.has(p.patientId)) return false;
          seen.add(p.patientId);
          return true;
        });
        setPatients(deduped);
        setFilteredPatients(deduped);
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load patient directory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Loading patient directory...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Patient Directory
          </CardTitle>
          <p className="text-sm text-gray-500">
            All your accepted patients ({patients.length} total)
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name, email, or patient code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No patients found matching your search' : 'No patients yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <Card key={patient.connectionId} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">
                            {patient.firstName} {patient.lastName}
                          </h3>
                          <Badge variant="secondary">Active</Badge>
                          {patient.shareReports && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Sharing Reports
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium">{patient.patientEmail}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Patient Code:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                              {patient.patientCode}
                            </code>
                          </div>

                          {patient.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Phone:</span>
                              <span className="font-medium">{patient.phoneNumber}</span>
                            </div>
                          )}

                          {patient.gender && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Gender:</span>
                              <span className="font-medium">{patient.gender}</span>
                            </div>
                          )}

                          {patient.dateOfBirth && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">Age:</span>
                              <span className="font-medium">{calculateAge(patient.dateOfBirth)} years</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Connected:</span>
                            <span className="font-medium">{formatDate(patient.connectedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDirectory;
