import { useState, useEffect, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { supabase } from './supabase';
import { getAIResponse } from './api';
import './Chat.css';

export default function Chat({ mode }) {
  const [userId, setUserId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMsgs] = useState([]);
  const [isThinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  // Fetch authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error('Auth error:', error);
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  // Fetch or create conversation
  useEffect(() => {
    if (!userId) return;
    const fetchOrCreateConversation = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('mode', mode)
        .order('last_updated', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Conversation fetch error:', error);
        return;
      }

      if (data && data.length > 0) {
        setConversationId(data[0].id);
      } else {
        const newId = uuid();
        const { error: insertError } = await supabase.from('conversations').insert([{
          id: newId,
          user_id: userId,
          mode,
          started_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          summary: '',
          tags: []
        }]);

        if (insertError) {
          console.error('Insert conversation failed:', insertError);
          return;
        }

        setConversationId(newId);
      }
    };

    fetchOrCreateConversation();
  }, [userId, mode]);

  // Load messages
  useEffect(() => {
    if (!userId || !conversationId) return;
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .eq('mode', mode)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) console.error('Memory load error:', error);
      if (data) setMsgs(data);
    };
    loadMessages();
  }, [userId, mode, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async () => {
    if (!input.trim() || !userId) return;

    const userMessage = {
      id: uuid(),
      role: 'user',
      text: input.trim(),
      created_at: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMessage];
    setMsgs(updatedMessages);
    setInput('');
    setThinking(true);

    await supabase.from('memories').insert([{
      ...userMessage,
      user_id: userId,
      mode,
      conversation_id: conversationId
    }]);

    try {
      const aiText = await getAIResponse(input.trim(), mode, updatedMessages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.text
      })));

      const aiMessage = {
        id: uuid(),
        role: 'ai',
        text: aiText,
        created_at: new Date().toISOString(),
      };
      const newMessages = [...updatedMessages, aiMessage];
      setMsgs(newMessages);

      await supabase.from('memories').insert([{
        ...aiMessage,
        user_id: userId,
        mode,
        conversation_id: conversationId
      }]);

      const summaryPrompt = `Summarize the user's conversation so far in 1-2 sentences.\nThen list 3 tags that describe the key themes or concerns.`;
      const summaryResponse = await getAIResponse(summaryPrompt, mode, newMessages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.text
      })));

      const [summaryTextRaw, tagTextRaw] = summaryResponse.split('\n');
      const summaryText = summaryTextRaw?.replace('Summary:', '').trim();
      const tags = tagTextRaw?.replace('Tags:', '').split(',').map(t => t.trim());

      await supabase.from('conversations').update({
        summary: summaryText,
        tags,
        last_updated: new Date().toISOString()
      }).eq('id', conversationId);

    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: uuid(),
        role: 'ai',
        text: '⚠️ Sorry — I had trouble reaching the AI. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMsgs(prev => [...prev, errorMsg]);
    } finally {
      setThinking(false);
    }
  };

  const clearChat = async () => {
    if (!userId || !conversationId) return;
    if (!window.confirm('Clear this conversation?')) return;

    await supabase
      .from('memories')
      .delete()
      .eq('user_id', userId)
      .eq('mode', mode)
      .eq('conversation_id', conversationId);

    setMsgs([]);

    const newId = uuid();
    const { error } = await supabase.from('conversations').insert([{
      id: newId,
      user_id: userId,
      mode,
      started_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      summary: '',
      tags: []
    }]);

    if (error) {
      console.error('Failed to insert new conversation:', error);
      return;
    }

    setConversationId(newId);
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-window">
        {messages.map(m => (
          <div key={m.id} className={`msg ${m.role}`}>
            <div>{m.text}</div>
            <small>{new Date(m.created_at).toLocaleTimeString()}</small>
          </div>
        ))}
        {isThinking && (
          <div className="msg ai typing">
            <div className="typing-dots">The Connector is thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMsg()}
          placeholder="Type your message…"
          maxLength={1000}
          disabled={!userId}
        />
        <button onClick={sendMsg} disabled={!userId}>Send</button>
      </div>

      <div className="chat-footer">
        <small>{input.length}/1000 characters</small>
        <button onClick={clearChat} style={{ marginLeft: 'auto' }}>
          🗑️ Clear Chat
        </button>
      </div>
    </div>
  );
}
