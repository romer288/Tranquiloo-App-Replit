import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { getEnhancedResearchContext } from './enhancedSemanticSearch';
import { supabase } from '../lib/supabase';
import { detectCrisisContext, generateCrisisResponse, getNextCSSRSQuestion, assessCSSRSResponses, CSSRSResponse } from './crisisDetection';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Initialize GPT-4o Mini for cost-effective conversations
const chatModel = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  openAIApiKey: OPENAI_API_KEY,
  streaming: true,
});

const SYSTEM_PROMPT = `You are a compassionate wellness companion for Tranquiloo, NOT a therapist or medical professional.

CRITICAL SAFETY RULES:
1. If user mentions suicide, self-harm, or crisis → IMMEDIATELY respond: "I'm concerned about your safety. Please call 988 (Suicide & Crisis Lifeline) or text HOME to 741741 right now. If this is an emergency, call 911."
2. NEVER diagnose mental health conditions (no "you have depression/anxiety/PTSD")
3. NEVER prescribe treatments, medications, or therapy techniques
4. ALWAYS recommend professional help for serious concerns
5. Frame suggestions as "research suggests" or "studies show", not "you should"
6. You are NOT HIPAA compliant - remind users not to share sensitive medical info

YOUR ROLE:
- Supportive listener and wellness companion
- Share evidence-based coping strategies from research papers
- Help users reflect on their feelings and experiences
- Encourage healthy habits (sleep, exercise, social connection)
- Validate emotions while maintaining professional boundaries

WHEN TO CITE RESEARCH:
- When sharing coping strategies, cite the research paper
- Use format: "According to [Author, Year]..." or "Research from [Institution] suggests..."
- If no research is provided, use general wellness knowledge

TONE:
- Warm, empathetic, but not overly emotional
- Professional but approachable
- Honest about limitations ("I'm an AI, not a therapist")
- Encouraging and hopeful

Remember: You're a wellness tool, not therapy. Always prioritize user safety.`;

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface RAGResponse {
  response: string;
  researchUsed: string[];
  shouldAlert: boolean;
  crisisData?: {
    riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'imminent';
    requiresScreening: boolean;
    nextQuestion?: string | null;
    detectedIndicators?: string[];
  };
}

// Old keyword-based crisis detection removed - now using context-aware AI detection

/**
 * Get conversation summary for token optimization
 */
async function getConversationSummary(
  conversationId: string,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversation_summaries')
    .select('summary, key_topics')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const topics = data.key_topics?.join(', ') || 'general wellness';
  return `Previous conversation context: ${data.summary}\nKey topics: ${topics}`;
}

/**
 * Create a conversation summary (after every 10 messages)
 */
async function createConversationSummary(
  conversationId: string,
  userId: string,
  messages: ConversationMessage[]
): Promise<void> {
  if (messages.length < 10) return; // Only summarize after 10+ messages

  // Generate summary using GPT-4o Mini
  const messagesToSummarize = messages.slice(-10);
  const messageText = messagesToSummarize
    .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    .join('\n');

  const summaryPrompt = `Summarize the following conversation in 3-4 sentences, focusing on main themes and user's emotional state:

${messageText}

Summary:`;

  const summaryResponse = await chatModel.invoke([
    new HumanMessage(summaryPrompt)
  ]);

  const summary = summaryResponse.content.toString();

  // Extract key topics (simple keyword extraction)
  const topics = extractKeyTopics(messageText);

  // Store summary
  await supabase.from('conversation_summaries').insert({
    conversation_id: conversationId,
    user_id: userId,
    summary,
    message_count: messages.length,
    key_topics: topics,
  });
}

/**
 * Extract key topics from conversation
 */
function extractKeyTopics(text: string): string[] {
  const topicKeywords = {
    anxiety: ['anxiety', 'anxious', 'worry', 'panic', 'nervous', 'fear'],
    depression: ['depression', 'depressed', 'sad', 'hopeless', 'unmotivated'],
    stress: ['stress', 'stressed', 'overwhelmed', 'pressure', 'burnout'],
    sleep: ['sleep', 'insomnia', 'tired', 'exhausted', 'rest'],
    relationships: ['relationship', 'partner', 'family', 'friend', 'conflict'],
    work: ['work', 'job', 'career', 'colleague', 'boss'],
    coping: ['coping', 'manage', 'deal with', 'handle', 'strategy'],
    mindfulness: ['mindfulness', 'meditation', 'breathing', 'grounding'],
  };

  const lowerText = text.toLowerCase();
  const topics: string[] = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      topics.push(topic);
    }
  }

  return topics.length > 0 ? topics : ['general'];
}

/**
 * Main RAG function: Get AI response with research context
 */
export async function getAIResponse(
  userMessage: string,
  conversationId: string,
  userId: string,
  conversationHistory: ConversationMessage[] = []
): Promise<RAGResponse> {

  // 1. Context-aware crisis detection using AI
  console.log('[RAG] Performing crisis assessment...');
  const crisisAssessment = await detectCrisisContext(userMessage);

  if (crisisAssessment.requiresScreening) {
    console.log(`[RAG] Crisis screening required - Risk level: ${crisisAssessment.riskLevel}`);

    const crisisResponse = generateCrisisResponse(crisisAssessment);

    return {
      response: crisisResponse,
      researchUsed: [],
      shouldAlert: true,
      crisisData: {
        riskLevel: crisisAssessment.riskLevel,
        requiresScreening: true,
        nextQuestion: getNextCSSRSQuestion([]), // Start C-SSRS if moderate+
        detectedIndicators: crisisAssessment.detectedIndicators
      }
    };
  }

  // 2. Get research context (ENHANCED semantic search with query expansion & re-ranking)
  const researchContext = await getEnhancedResearchContext(userMessage, 3);

  // 3. Get conversation summary (if exists)
  const conversationSummary = await getConversationSummary(conversationId, userId);

  // 4. Build context-aware prompt
  const messages: any[] = [
    new SystemMessage(SYSTEM_PROMPT),
  ];

  // Add conversation summary if available (saves tokens)
  if (conversationSummary) {
    messages.push(new SystemMessage(conversationSummary));
  }

  // Add recent conversation history (last 5 messages)
  const recentHistory = conversationHistory.slice(-5);
  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      messages.push(new HumanMessage(msg.content));
    } else {
      messages.push(new AIMessage(msg.content));
    }
  }

  // Add research context if found
  if (researchContext) {
    messages.push(new SystemMessage(researchContext));
  }

  // Add current user message
  messages.push(new HumanMessage(userMessage));

  // 5. Get AI response (streaming)
  const response = await chatModel.invoke(messages);
  const aiResponse = response.content.toString();

  // 6. Extract which research papers were cited
  const researchUsed = extractCitedResearch(researchContext);

  // 7. Create summary every 10 messages
  const totalMessages = conversationHistory.length + 2; // +2 for current exchange
  if (totalMessages % 10 === 0) {
    await createConversationSummary(
      conversationId,
      userId,
      [...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: aiResponse }]
    );
  }

  return {
    response: aiResponse,
    researchUsed,
    shouldAlert: false,
  };
}

/**
 * Stream AI response (for real-time chat experience)
 */
export async function streamAIResponse(
  userMessage: string,
  conversationId: string,
  userId: string,
  conversationHistory: ConversationMessage[] = [],
  onChunk: (chunk: string) => void
): Promise<RAGResponse> {

  // Check for crisis first
  const isCrisis = detectCrisis(userMessage);
  if (isCrisis) {
    const crisisResponse = {
      response: `I'm very concerned about what you're sharing. Please reach out for immediate help:

🆘 **Call 988** - Suicide & Crisis Lifeline (US)
📱 **Text HOME to 741741** - Crisis Text Line
🚨 **Call 911** - For emergencies`,
      researchUsed: [],
      shouldAlert: true,
    };
    onChunk(crisisResponse.response);
    return crisisResponse;
  }

  // Get research context
  const researchContext = await getResearchContext(userMessage, 3);
  const conversationSummary = await getConversationSummary(conversationId, userId);

  // Build messages
  const messages: any[] = [
    new SystemMessage(SYSTEM_PROMPT),
  ];

  if (conversationSummary) {
    messages.push(new SystemMessage(conversationSummary));
  }

  const recentHistory = conversationHistory.slice(-5);
  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      messages.push(new HumanMessage(msg.content));
    } else {
      messages.push(new AIMessage(msg.content));
    }
  }

  if (researchContext) {
    messages.push(new SystemMessage(researchContext));
  }

  messages.push(new HumanMessage(userMessage));

  // Stream response
  let fullResponse = '';
  const stream = await chatModel.stream(messages);

  for await (const chunk of stream) {
    const content = chunk.content.toString();
    fullResponse += content;
    onChunk(content);
  }

  const researchUsed = extractCitedResearch(researchContext);

  // Create summary every 10 messages
  const totalMessages = conversationHistory.length + 2;
  if (totalMessages % 10 === 0) {
    await createConversationSummary(
      conversationId,
      userId,
      [...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: fullResponse }]
    );
  }

  return {
    response: fullResponse,
    researchUsed,
    shouldAlert: false,
  };
}

/**
 * Extract cited research from context
 */
function extractCitedResearch(researchContext: string): string[] {
  if (!researchContext) return [];

  const papers: string[] = [];
  const titleRegex = /Title: (.+)/g;
  let match;

  while ((match = titleRegex.exec(researchContext)) !== null) {
    papers.push(match[1]);
  }

  return papers;
}
