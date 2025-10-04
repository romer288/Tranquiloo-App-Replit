import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useChatLanguageContext } from '@/hooks/useChatLanguageContext';
import {
  Target, Plus, Save, Edit3, Trash2, Send,
  FileText, Copy, Mic, Square, Trash
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  milestones: Milestone[];
  therapistNotes?: string;
  status: 'active' | 'completed' | 'paused';
}

interface Milestone {
  id: string;
  description: string;
  completed: boolean;
  completedDate?: string;
}

interface SessionNote {
  id: string;
  meetingTitle: string;
  meetingDate?: string;
  linkedGoalId?: string;
  linkedGoalTitle?: string;
  notes: string;
  createdAt: string;
  audioUrl?: string;
  transcript?: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description: string;
  goals: Goal[];
  interventions: string[];
  exercises: string[];
  notes: string;
  sessionNotes: SessionNote[];
  createdAt: string;
  updatedAt: string;
}

interface TreatmentCreationProps {
  patientId: string;
  patientName: string;
  onPlanUpdate?: (plan: TreatmentPlan | null) => void;
  onOpenAssistant?: () => void;
}

const TreatmentCreation: React.FC<TreatmentCreationProps> = ({
  patientId,
  patientName,
  onPlanUpdate,
  onOpenAssistant
}) => {
  const { toast } = useToast();
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [recordingText, setRecordingText] = useState('');

  // Use shared speech recognition hook
  const { isListening: isRecording, speechSupported, startListening } = useSpeechRecognition();
  const { languageContext } = useChatLanguageContext();
  const conversationLanguage = languageContext.conversationLanguage;
  
  // Form states
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    category: 'anxiety-management',
    priority: 'medium',
    milestones: []
  });
  const [newMilestone, setNewMilestone] = useState('');
  const [newSessionNote, setNewSessionNote] = useState<{
    meetingTitle: string;
    meetingDate: string;
    linkedGoalId: string;
    notes: string;
  }>({ meetingTitle: '', meetingDate: '', linkedGoalId: '', notes: '' });
  const [isRecordingAudioNote, setIsRecordingAudioNote] = useState(false);
  const [sessionAudioPreview, setSessionAudioPreview] = useState<{ url: string; dataUrl: string; mimeType: string } | null>(null);
  const [audioTranscript, setAudioTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<'en' | 'es'>('en');

  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRecognitionRef = useRef<any>(null);

  const applyPlanDefaults = (incomingPlan: any): TreatmentPlan => {
    const base: TreatmentPlan = {
      id: incomingPlan.id ?? Date.now().toString(),
      title: incomingPlan.title ?? `Treatment Plan for ${patientName}`,
      description:
        incomingPlan.description ??
        'Comprehensive anxiety management treatment plan derived from therapy goals and progress notes.',
      goals: Array.isArray(incomingPlan.goals) ? incomingPlan.goals : [],
      interventions: Array.isArray(incomingPlan.interventions) ? incomingPlan.interventions : [],
      exercises: Array.isArray(incomingPlan.exercises) ? incomingPlan.exercises : [],
      notes: incomingPlan.notes ?? '',
      sessionNotes: Array.isArray(incomingPlan.sessionNotes) ? incomingPlan.sessionNotes : [],
      createdAt: incomingPlan.createdAt ?? new Date().toISOString(),
      updatedAt: incomingPlan.updatedAt ?? new Date().toISOString(),
    };

    // Ensure each goal has milestones array
    base.goals = base.goals.map((goal: Goal) => ({
      ...goal,
      milestones: Array.isArray(goal.milestones) ? goal.milestones : [],
    }));

    return base;
  };

  const loadTreatmentPlan = async () => {
    try {
      const response = await fetch(`/api/therapist/patient/${patientId}/treatment-plan`);
      if (response.ok) {
        const plan = await response.json();
        if (plan) {
          setTreatmentPlan(applyPlanDefaults(plan));
        } else {
          setTreatmentPlan(null);
        }
      }
    } catch (error) {
      console.error('Failed to load treatment plan:', error);
    }
  };

  useEffect(() => {
    loadTreatmentPlan();
  }, [patientId]);

  useEffect(() => {
    if (onPlanUpdate) {
      onPlanUpdate(treatmentPlan ?? null);
    }
  }, [treatmentPlan, onPlanUpdate]);

  const saveTreatmentPlan = async () => {
    if (!treatmentPlan) return;

    try {
      const updatedPlan: TreatmentPlan = {
        ...treatmentPlan,
        updatedAt: new Date().toISOString(),
      };

      setTreatmentPlan(updatedPlan);
      const response = await fetch(`/api/therapist/patient/${patientId}/treatment-plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan)
      });

      if (response.ok) {
        toast({
          title: "Treatment Plan Saved",
          description: "The treatment plan has been updated successfully"
        });
        setIsEditing(false);
        loadTreatmentPlan();
      }
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to save treatment plan",
        variant: "destructive"
      });
    }
  };

  const addGoal = () => {
    if (!newGoal.title || !newGoal.description) {
      toast({
        title: "Missing Information",
        description: "Please provide goal title and description",
        variant: "destructive"
      });
      return;
    }

      const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title || '',
      description: newGoal.description || '',
      category: newGoal.category || 'anxiety-management',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: newGoal.priority || 'medium',
      milestones: newGoal.milestones || [],
      status: 'active'
    };

    setTreatmentPlan((prev) => {
      if (prev) {
        return {
          ...prev,
          goals: [...prev.goals, goal],
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        id: Date.now().toString(),
        title: `Treatment Plan for ${patientName}`,
        description: 'Comprehensive anxiety management treatment plan',
        goals: [goal],
        interventions: [],
        exercises: [],
        notes: '',
        sessionNotes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Reset form
    setNewGoal({
      title: '',
      description: '',
      category: 'anxiety-management',
      priority: 'medium',
      milestones: []
    });

    toast({
      title: "Goal Added",
      description: "New goal has been added to the treatment plan"
    });
  };

  const addSessionNote = () => {
    if (isRecordingAudioNote) {
      toast({
        title: 'Recording in progress',
        description: 'Please stop the audio recording before saving this session note.',
        variant: 'destructive',
      });
      return;
    }

    if (!newSessionNote.notes.trim()) {
      toast({
        title: 'Missing Notes',
        description: 'Please enter session notes before saving.',
        variant: 'destructive',
      });
      return;
    }

    const note: SessionNote = {
      id: Date.now().toString(),
      meetingTitle: newSessionNote.meetingTitle || 'Therapy Session',
      meetingDate: newSessionNote.meetingDate || undefined,
      linkedGoalId: newSessionNote.linkedGoalId || undefined,
      linkedGoalTitle:
        (newSessionNote.linkedGoalId &&
          treatmentPlan?.goals.find((goal) => goal.id === newSessionNote.linkedGoalId)?.title) ||
        undefined,
      notes: newSessionNote.notes.trim(),
      createdAt: new Date().toISOString(),
      audioUrl: sessionAudioPreview?.dataUrl,
      transcript: audioTranscript.trim() || undefined,
    };

    setTreatmentPlan((prev) => {
      if (prev) {
        return {
          ...prev,
          sessionNotes: [...(prev.sessionNotes ?? []), note],
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        id: Date.now().toString(),
        title: `Treatment Plan for ${patientName}`,
        description: 'Comprehensive anxiety management treatment plan',
        goals: [],
        interventions: [],
        exercises: [],
        notes: '',
        sessionNotes: [note],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    setNewSessionNote({ meetingTitle: '', meetingDate: '', linkedGoalId: '', notes: '' });
    if (sessionAudioPreview?.url) {
      URL.revokeObjectURL(sessionAudioPreview.url);
    }
    setSessionAudioPreview(null);
    setAudioTranscript('');

    toast({
      title: 'Session Note Added',
      description: 'Therapist session notes have been added to the treatment plan.',
    });
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;

    const milestone: Milestone = {
      id: Date.now().toString(),
      description: newMilestone,
      completed: false
    };

    setNewGoal((prev) => ({
      ...prev,
      milestones: [...(prev.milestones || []), milestone]
    }));
    setNewMilestone('');
  };

  const sendTreatmentToPatient = async () => {
    if (!treatmentPlan) return;

    try {
      // Save treatment plan which also sends notification
      const response = await fetch(`/api/therapist/patient/${patientId}/treatment-plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(treatmentPlan)
      });

      if (response.ok) {
        toast({
          title: "Treatment Plan Sent",
          description: "Treatment plan has been emailed to the patient"
        });
      }
    } catch (error) {
      toast({
        title: "Send Error",
        description: "Failed to send treatment plan to patient",
        variant: "destructive"
      });
    }
  };

  const startRecording = () => {
    if (!speechSupported) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    const language = conversationLanguage.startsWith('es') ? 'es' : 'en';

    startListening((transcript) => {
      setRecordingText(transcript);
    }, language);
  };

  const startAudioRecording = async () => {
    if (isRecordingAudioNote) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        setSessionAudioPreview({ url, dataUrl, mimeType: blob.type });
      };
      recorder.start();
      audioRecorderRef.current = recorder;
      setSessionAudioPreview(null);
      setIsRecordingAudioNote(true);

      // Start speech recognition for transcription (bilingual support)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          // Use selected transcription language (English or Spanish)
          recognition.lang = transcriptionLanguage === 'es' ? 'es-ES' : 'en-US';
          console.log('Starting transcription in:', recognition.lang);

          let transcript = '';
          recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcriptPiece = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                transcript += transcriptPiece + ' ';
              } else {
                interimTranscript += transcriptPiece;
              }
            }
            setAudioTranscript(transcript + interimTranscript);
          };

          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
          };

          recognition.start();
          audioRecognitionRef.current = recognition;
          setIsTranscribing(true);
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
        }
      }
    } catch (error) {
      console.error('Failed to start audio recording', error);
      toast({
        title: 'Microphone Error',
        description: 'Unable to access microphone. Please check browser permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopAudioRecording = () => {
    if (!isRecordingAudioNote) return;
    try {
      const recorder = audioRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch (error) {
      console.error('Error stopping recorder', error);
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    // Stop speech recognition
    if (audioRecognitionRef.current) {
      try {
        audioRecognitionRef.current.stop();
        audioRecognitionRef.current = null;
      } catch (error) {
        console.error('Error stopping speech recognition', error);
      }
    }

    setIsRecordingAudioNote(false);
    setIsTranscribing(false);
  };

  const resetAudioRecording = () => {
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      audioRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioRecognitionRef.current) {
      try {
        audioRecognitionRef.current.stop();
        audioRecognitionRef.current = null;
      } catch (error) {
        console.error('Error stopping speech recognition', error);
      }
    }
    if (sessionAudioPreview?.url) {
      URL.revokeObjectURL(sessionAudioPreview.url);
    }
    setSessionAudioPreview(null);
    setAudioTranscript('');
    setIsRecordingAudioNote(false);
    setIsTranscribing(false);
  };

  useEffect(() => {
    return () => {
      if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
        audioRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      if (sessionAudioPreview?.url) {
        URL.revokeObjectURL(sessionAudioPreview.url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Patient Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900">Treatment Creation</h3>
        <p className="text-green-700">Creating treatment plan for: {patientName}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Goal Creation Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Create New Goal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="goal-title">Goal Title *</Label>
                <Input
                  id="goal-title"
                  value={newGoal.title || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Reduce driving anxiety"
                  data-testid="input-goal-title"
                />
              </div>

              <div>
                <Label htmlFor="goal-description">Description *</Label>
                <Textarea
                  id="goal-description"
                  value={newGoal.description || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed goal description and context"
                  rows={3}
                  data-testid="textarea-goal-description"
                />
              </div>

              <div>
                <Label htmlFor="goal-category">Category</Label>
                <select
                  id="goal-category"
                  className="w-full p-2 border rounded-md"
                  value={newGoal.category || 'anxiety-management'}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                  data-testid="select-goal-category"
                >
                  <option value="anxiety-management">Anxiety Management</option>
                  <option value="coping-skills">Coping Skills</option>
                  <option value="exposure-therapy">Exposure Therapy</option>
                  <option value="social-skills">Social Skills</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="behavioral">Behavioral Changes</option>
                </select>
              </div>

              <div>
                <Label htmlFor="goal-priority">Priority</Label>
                <select
                  id="goal-priority"
                  className="w-full p-2 border rounded-md"
                  value={newGoal.priority || 'medium'}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                  data-testid="select-goal-priority"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              {/* Milestones */}
              <div>
                <Label>Milestones</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    placeholder="Add milestone..."
                    data-testid="input-milestone"
                  />
                  <Button
                    size="sm"
                    onClick={addMilestone}
                    data-testid="button-add-milestone"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {newGoal.milestones?.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span>{milestone.description}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNewGoal(prev => ({
                            ...prev,
                            milestones: prev.milestones?.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voice Recording */}
              <div className="border-t pt-4">
                <Label>Voice Notes</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startRecording}
                    data-testid={isRecording ? "button-stop-recording" : "button-start-recording"}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 mr-1" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-1" />
                        Record
                      </>
                    )}
                  </Button>
                  {recordingText && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setNewSessionNote((prev) => ({
                          ...prev,
                          notes: [prev.notes, recordingText].filter(Boolean).join('\n')
                        }))
                      }
                      data-testid="button-add-recording"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add to Notes
                    </Button>
                  )}
                </div>
                
                {recordingText && (
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {recordingText}
                  </div>
                )}
              </div>

              <Button
                onClick={addGoal}
                className="w-full"
                data-testid="button-add-goal"
              >
                <Target className="w-4 h-4 mr-2" />
                Add Goal to Treatment Plan
              </Button>

              {/* Vanessa AI Treatment Assistant */}
              <Card className="border-blue-200 bg-blue-50 mt-4">
                <CardHeader>
                  <CardTitle className="text-blue-900 text-base">
                    Vanessa – AI Treatment Assistant
                  </CardTitle>
                  <p className="text-sm text-blue-700">
                    Ask Vanessa for treatment ideas, homework suggestions,
                    or quick summaries while you build the plan.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={onOpenAssistant}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Ask Vanessa
                  </Button>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>
                      • Generate exposure hierarchies tailored to current
                      goals
                    </li>
                    <li>
                      • Draft follow-up homework or journaling prompts
                    </li>
                    <li>
                      • Ask for patient-friendly explanations of session
                      topics
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Treatment Plan Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Current Treatment Plan
                </span>
                <div className="flex gap-2">
                  {treatmentPlan && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={sendTreatmentToPatient}
                        data-testid="button-send-treatment"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send to Patient
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveTreatmentPlan}
                        data-testid="button-save-treatment"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save Plan
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treatmentPlan ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">{treatmentPlan.title}</h3>
                    <p className="text-gray-600">{treatmentPlan.description}</p>
                  </div>

                  {/* Goals List */}
                  <div>
                    <h4 className="font-medium mb-4">Treatment Goals ({treatmentPlan.goals.length})</h4>
                    <div className="space-y-4">
                      {(treatmentPlan?.goals ?? []).map((goal) => (
                        <div key={goal.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium">{goal.title}</h5>
                                <Badge variant={
                                  goal.priority === 'high' ? 'destructive' :
                                  goal.priority === 'medium' ? 'default' : 'secondary'
                                }>
                                  {goal.priority}
                                </Badge>
                                <Badge variant="outline">{goal.category}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                              {goal.therapistNotes && (
                                <p className="text-sm text-blue-600 mb-2">
                                  <strong>Notes:</strong> {goal.therapistNotes}
                                </p>
                              )}
                            </div>
                          </div>

                          {goal.milestones.length > 0 && (
                            <div>
                              <h6 className="font-medium mb-2">Milestones</h6>
                              <div className="space-y-1">
                                {(goal.milestones ?? []).map((milestone) => (
                                  <div key={milestone.id} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={milestone.completed}
                                      readOnly
                                      className="rounded"
                                    />
                                    <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                                      {milestone.description}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {treatmentPlan.sessionNotes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-4">Therapist Session Notes</h4>
                      <div className="space-y-4">
                        {treatmentPlan.sessionNotes.map((note) => (
                          <div key={note.id} className="border rounded-lg p-4 bg-slate-50">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-slate-900">{note.meetingTitle}</h5>
                                {note.meetingDate && (
                                  <p className="text-xs text-slate-500">{new Date(note.meetingDate).toLocaleDateString()}</p>
                                )}
                              </div>
                              <Badge variant="outline">Session Note</Badge>
                            </div>
                  {note.linkedGoalTitle && (
                    <p className="text-xs text-blue-600 mb-2">
                      Linked goal: <span className="font-medium">{note.linkedGoalTitle}</span>
                    </p>
                  )}
                  <p className="text-sm text-slate-700 whitespace-pre-line">{note.notes}</p>
                  {note.audioUrl && (
                    <div className="mt-3">
                      <audio controls className="w-full">
                        <source src={note.audioUrl} />
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-slate-400">
                    Added {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No treatment plan created yet</p>
                  <p className="text-sm">Add goals using the form on the left</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Therapist session notes entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" /> Therapist Session Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="meeting-title">Session / Meeting</Label>
              <Input
                id="meeting-title"
                placeholder="e.g., Week 4 CBT session"
                value={newSessionNote.meetingTitle}
                onChange={(e) => setNewSessionNote((prev) => ({ ...prev, meetingTitle: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="meeting-date">Date</Label>
              <Input
                id="meeting-date"
                type="date"
                value={newSessionNote.meetingDate}
                onChange={(e) => setNewSessionNote((prev) => ({ ...prev, meetingDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="linked-goal">Link to Goal (optional)</Label>
              <select
                id="linked-goal"
                className="w-full p-2 border rounded-md"
                value={newSessionNote.linkedGoalId}
                onChange={(e) => setNewSessionNote((prev) => ({ ...prev, linkedGoalId: e.target.value }))}
              >
                <option value="">No linked goal</option>
                {(treatmentPlan?.goals ?? []).map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="session-notes">Session Notes</Label>
            <Textarea
              id="session-notes"
              placeholder="Key observations, interventions, follow-up homework..."
              rows={4}
              value={newSessionNote.notes}
              onChange={(e) => setNewSessionNote((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="font-medium">Session Audio Recording</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">Language:</Label>
                  <select
                    value={transcriptionLanguage}
                    onChange={(e) => setTranscriptionLanguage(e.target.value as 'en' | 'es')}
                    disabled={isRecordingAudioNote}
                    className="text-xs p-1 border rounded bg-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isRecordingAudioNote ? (
                  <Button type="button" size="sm" variant="outline" onClick={startAudioRecording}>
                    <Mic className="w-4 h-4 mr-2" /> Record Audio
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="destructive" onClick={stopAudioRecording}>
                    <Square className="w-4 h-4 mr-2" /> Stop
                  </Button>
                )}
                {sessionAudioPreview && !isRecordingAudioNote && (
                  <Button type="button" size="sm" variant="ghost" onClick={resetAudioRecording}>
                    <Trash className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {isRecordingAudioNote && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-red-600">Recording in progress... click Stop when finished.</p>
                  <Badge variant="outline" className="text-xs">
                    {transcriptionLanguage === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
                  </Badge>
                </div>
                {isTranscribing && audioTranscript && (
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs font-medium text-slate-700 mb-1">
                      Live Transcript ({transcriptionLanguage === 'es' ? 'Español' : 'English'}):
                    </p>
                    <p className="text-sm text-slate-600">{audioTranscript}</p>
                  </div>
                )}
              </div>
            )}
            {sessionAudioPreview && (
              <div className="space-y-3">
                <div className="rounded-md bg-white p-3 border">
                  <p className="text-sm font-medium text-slate-700 mb-2">Recorded Audio</p>
                  <audio controls className="w-full">
                    <source src={sessionAudioPreview.url} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
                {audioTranscript && (
                  <div className="rounded-md bg-white p-3 border">
                    <p className="text-sm font-medium text-slate-700 mb-2">Transcript</p>
                    <p className="text-sm text-slate-600 whitespace-pre-line">{audioTranscript}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={addSessionNote} data-testid="button-add-session-note">
              <Plus className="w-4 h-4 mr-2" /> Save Session Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setNewGoal({
                  title: 'Reduce driving anxiety',
                  description: 'Gradual exposure therapy to reduce fear while driving, focusing on blind intersections and turning',
                  category: 'exposure-therapy',
                  priority: 'high',
                  milestones: [
                    { id: '1', description: 'Sit in parked car for 10 minutes', completed: false },
                    { id: '2', description: 'Drive in empty parking lot', completed: false },
                    { id: '3', description: 'Drive on quiet residential streets', completed: false }
                  ]
                });
              }}
              data-testid="button-template-driving"
            >
              <Copy className="w-4 h-4 mr-2" />
              Driving Anxiety Template
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setNewGoal({
                  title: 'Improve social interaction skills',
                  description: 'Develop confidence in social situations and communication with new people',
                  category: 'social-skills',
                  priority: 'medium',
                  milestones: [
                    { id: '1', description: 'Make eye contact during conversations', completed: false },
                    { id: '2', description: 'Initiate conversation with one new person weekly', completed: false }
                  ]
                });
              }}
              data-testid="button-template-social"
            >
              <Copy className="w-4 h-4 mr-2" />
              Social Skills Template
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setNewGoal({
                  title: 'Daily mindfulness practice',
                  description: 'Establish regular mindfulness and breathing exercises to manage anxiety',
                  category: 'mindfulness',
                  priority: 'medium',
                  milestones: [
                    { id: '1', description: 'Complete 5-minute breathing exercise daily', completed: false },
                    { id: '2', description: 'Use mindfulness app 3 times per week', completed: false }
                  ]
                });
              }}
              data-testid="button-template-mindfulness"
            >
              <Copy className="w-4 h-4 mr-2" />
              Mindfulness Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TreatmentCreation;
