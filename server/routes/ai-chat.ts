import express, { Request, Response } from 'express';
import { getAIResponse, streamAIResponse } from '../services/ragSystem';
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * POST /api/ai-chat/message
 * Send a message and get AI response (non-streaming)
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { message, conversationId, userId, history } = req.body;

    if (!message || !conversationId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: message, conversationId, userId'
      });
    }

    // Get AI response with RAG
    const result = await getAIResponse(message, conversationId, userId, history || []);

    // Store user message
    await supabase.from('chat_messages').insert({
      session_id: conversationId,
      user_id: userId,
      content: message,
      sender: 'user',
    });

    // Store AI response
    await supabase.from('chat_messages').insert({
      session_id: conversationId,
      user_id: userId,
      content: result.response,
      sender: 'ai',
    });

    res.json({
      response: result.response,
      researchUsed: result.researchUsed,
      shouldAlert: result.shouldAlert,
    });

  } catch (error: any) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      details: error.message
    });
  }
});

/**
 * POST /api/ai-chat/stream
 * Send a message and get streaming AI response (SSE)
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { message, conversationId, userId, history } = req.body;

    if (!message || !conversationId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: message, conversationId, userId'
      });
    }

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';

    // Stream AI response
    const result = await streamAIResponse(
      message,
      conversationId,
      userId,
      history || [],
      (chunk: string) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk, type: 'content' })}\n\n`);
      }
    );

    // Send completion event
    res.write(`data: ${JSON.stringify({
      type: 'done',
      researchUsed: result.researchUsed,
      shouldAlert: result.shouldAlert,
    })}\n\n`);

    res.end();

    // Store messages in database
    await supabase.from('chat_messages').insert([
      {
        session_id: conversationId,
        user_id: userId,
        content: message,
        sender: 'user',
      },
      {
        session_id: conversationId,
        user_id: userId,
        content: fullResponse,
        sender: 'ai',
      }
    ]);

  } catch (error: any) {
    console.error('Error in AI chat stream:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: 'Failed to get AI response'
    })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/ai-chat/history/:conversationId
 * Get conversation history
 */
router.get('/history/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ messages: data || [] });

  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

/**
 * POST /api/ai-chat/new-conversation
 * Create a new conversation
 */
router.post('/new-conversation', async (req: Request, res: Response) => {
  try {
    const { userId, title } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: title || 'New Conversation',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ conversation: data });

  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * GET /api/ai-chat/conversations/:userId
 * Get user's conversations
 */
router.get('/conversations/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ conversations: data || [] });

  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
