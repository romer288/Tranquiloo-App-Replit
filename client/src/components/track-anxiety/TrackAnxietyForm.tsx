
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthService } from '@/services/authService';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useChatLanguageContext } from '@/hooks/useChatLanguageContext';

import AnxietyLevelSlider from './AnxietyLevelSlider';
import TriggerSelector from './TriggerSelector';
import DescriptionInput from './DescriptionInput';
import NotesInput from './NotesInput';

const TrackAnxietyForm: React.FC = () => {
  const [anxietyLevel, setAnxietyLevel] = useState([5]);
  const [trigger, setTrigger] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Use shared speech recognition hook
  const { isListening, speechSupported, startListening } = useSpeechRecognition();
  const { languageContext } = useChatLanguageContext();
  const conversationLanguage = languageContext.conversationLanguage;

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser');
      return;
    }

    const language = conversationLanguage.startsWith('es') ? 'es' : 'en';

    startListening((transcript) => {
      if (transcript) {
        setDescription(prev => prev + transcript + ' ');
      }
    }, language);
  };

  const handleSubmit = async () => {
    console.log('🔍 Handle submit called');
    
    try {
      const user = await AuthService.getCurrentUser();
      console.log('👤 User check:', user ? 'User found' : 'No user');
      
      if (!user) {
        alert('Please sign in to track your anxiety');
        return;
      }

      console.log('📝 Preparing to save data:', {
        user_id: user.id,
        anxiety_level: anxietyLevel[0],
        anxiety_triggers: trigger ? [trigger] : [],
        coping_strategies: description ? [description] : [],
        personalized_response: notes,
        analysis_source: 'manual_entry'
      });

      const response = await fetch('/api/anxiety-analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          anxietyLevel: anxietyLevel[0],
          anxietyTriggers: trigger ? [trigger] : [],
          copingStrategies: description ? [description] : [],
          personalizedResponse: notes,
          analysisSource: 'manual_entry'
        })
      });

      if (!response.ok) {
        console.error('❌ Error saving anxiety entry:', response.statusText);
        alert('Failed to save entry. Please try again.');
        return;
      }

      console.log('✅ Anxiety level recorded successfully!');
      alert('Anxiety level recorded successfully!');
      
      // Reset form
      setAnxietyLevel([5]);
      setTrigger('');
      setDescription('');
      setNotes('');
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <Card className="p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Track Your Anxiety</h2>
      <p className="text-gray-600 mb-8">Record your current anxiety level and what might be triggering it</p>

      <div className="space-y-8">
        <AnxietyLevelSlider
          anxietyLevel={anxietyLevel}
          onAnxietyLevelChange={setAnxietyLevel}
        />

        <TriggerSelector
          trigger={trigger}
          onTriggerChange={setTrigger}
        />

        <DescriptionInput
          description={description}
          onDescriptionChange={setDescription}
          isListening={isListening}
          onToggleListening={toggleListening}
        />

        <NotesInput
          notes={notes}
          onNotesChange={setNotes}
        />

        <Button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg"
        >
          Record Anxiety Level
        </Button>
      </div>
    </Card>
  );
};

export default TrackAnxietyForm;
