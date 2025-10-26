import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Tts from 'react-native-tts';
import {useAuth} from '../contexts/AuthContext';
import {
  AIMessage as ServiceMessage,
  detectCrisisKeywords,
  sendAIMessage,
} from '../../../shared/services/aiChatService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  citations?: string[];
  isCrisis?: boolean;
}

const CRISIS_RESPONSE = `I'm very concerned about what you're sharing. Please reach out for immediate help:\n\n🆘 Call 988 - Suicide & Crisis Lifeline (US)\n📱 Text HOME to 741741 - Crisis Text Line\n🚨 Call 911 for emergencies`;

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const ChatScreen: React.FC = () => {
  const {user} = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      text: "Hi there! I'm Vanessa, your AI companion. I'm here to listen and support you. How are you feeling today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const conversationIdRef = useRef<string>(`mobile-${generateId()}`);

  const historyForService = useMemo<ServiceMessage[]>(
    () =>
      messages.map(message => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
        timestamp: message.timestamp.toISOString(),
      })),
    [messages],
  );

  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDucking(true);
    speak(messages[0].text);
  }, []);

  const speak = (text: string) => {
    if (!text) {
      return;
    }

    const isSpanish = /[\u00C0-\u017F]/i.test(text);
    const locale = isSpanish ? 'es-MX' : 'en-US';
    Tts.setDefaultLanguage(locale);

    if (Platform.OS === 'android') {
      // Slow down TTS a bit on Android for clarity
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
    }

    Tts.speak(text);
  };

  const handleCrisis = (text: string) => {
    console.warn('Crisis keywords detected in mobile message:', text);
    const crisisMessage: Message = {
      id: generateId(),
      text: CRISIS_RESPONSE,
      sender: 'ai',
      timestamp: new Date(),
      isCrisis: true,
    };

    setMessages(prev => [...prev, crisisMessage]);
    speak(crisisMessage.text);
    Alert.alert('Immediate Help Recommended', CRISIS_RESPONSE.replace(/\n/g, '\n'));
  };

  const sendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (detectCrisisKeywords(trimmed)) {
        handleCrisis(trimmed);
        setIsLoading(false);
        return;
      }

      const response = await sendAIMessage(
        trimmed,
        conversationIdRef.current,
        user?.id ?? 'guest-user',
        [...historyForService, {role: 'user', content: trimmed}],
      );

      const aiMessage: Message = {
        id: generateId(),
        text: response.response,
        sender: 'ai',
        timestamp: new Date(),
        citations: response.researchUsed,
        isCrisis: response.shouldAlert,
      };

      setMessages(prev => [...prev, aiMessage]);
      speak(aiMessage.text);

      if (response.shouldAlert) {
        Alert.alert(
          'Important',
          'This conversation may need therapist attention. A support contact will be notified.',
        );
      }
    } catch (error) {
      console.error('AI chat error', error);
      const fallback = 'Unable to contact the AI companion. Please try again.';
      setErrorMessage(fallback);
      Alert.alert('Connection Issue', fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.sender === 'user' ? styles.userMessage : styles.aiMessage,
        message.isCrisis && styles.crisisMessage,
      ]}>
      <Text style={styles.messageText}>{message.text}</Text>

      {message.citations && message.citations.length > 0 && (
        <View style={styles.citationContainer}>
          <Text style={styles.citationTitle}>Research cited:</Text>
          {message.citations.map((citation, index) => (
            <Text key={`${message.id}-citation-${index}`} style={styles.citationText}>
              • {citation}
            </Text>
          ))}
        </View>
      )}

      {message.isCrisis && (
        <Text style={styles.crisisNotice}>
          If you're in immediate danger, call local emergency services right away.
        </Text>
      )}

      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}>
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Vanessa is reviewing the latest research...</Text>
          </View>
        )}
      </ScrollView>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Share what's on your mind..."
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          Tranquiloo is a wellness companion and does not provide medical advice. If you're in
          crisis, contact 988 or your local emergency services immediately.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  crisisMessage: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
  },
  citationContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  citationTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
    color: '#1d4ed8',
  },
  citationText: {
    fontSize: 13,
    color: '#1f2937',
    marginBottom: 2,
  },
  crisisNotice: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#b91c1c',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    padding: 12,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6b7280',
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disclaimerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default ChatScreen;
