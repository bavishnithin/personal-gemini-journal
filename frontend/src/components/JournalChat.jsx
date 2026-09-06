import React, { useState, useRef, useEffect } from 'react';
import { apiPost, apiGet } from '../services/api';

export default function JournalChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setSaveSuccess('');
    setAnalysisResult(null);

    try {
      const { response } = await apiPost('/api/chat', { messages: newMessages });
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
    if (!userMessages) return;

    setSaving(true);
    try {
      const data = await apiPost('/api/entries', { 
        text: userMessages,
        summary: userMessages.substring(0, 150) + '...'
      });
      setSaveSuccess(`Entry saved! ID: ${data.id}`);
      
      // Auto analyze
      setAnalyzing(true);
      const analysis = await apiPost(`/api/entries/${data.id}/analyze`);
      setAnalysisResult(analysis);
    } catch (err) {
      console.error(err);
      setSaveSuccess('Failed to save entry.');
    } finally {
      setSaving(false);
      setAnalyzing(false);
    }
  };

  const handlePromptMe = async () => {
    setPromptLoading(true);
    try {
      const data = await apiGet('/api/prompts/today');
      setInput(data.prompt);
    } catch (err) {
      console.error(err);
    } finally {
      setPromptLoading(false);
    }
  };

  const handleNew = () => {
    setMessages([]);
    setInput('');
    setSaveSuccess('');
    setAnalysisResult(null);
  };

  return (
    <div className="container">
      <div className="card-header">
        <h2>Journal</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handlePromptMe} disabled={promptLoading}>Prompt Me</button>
          <button onClick={handleNew}>New Conversation</button>
        </div>
      </div>

      <div className="card chat-container">
        {messages.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>
            Start typing to reflect on your day, or ask for a prompt!
          </p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {msg.content.split('\n').map((line, j) => (
                <React.Fragment key={j}>{line}<br/></React.Fragment>
              ))}
            </div>
          ))
        )}
        {loading && <div className="chat-bubble assistant">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your thoughts here... (Shift+Enter for new line)"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {messages.length > 0 && (
              <button className="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
            )}
          </div>
          <button className="primary" onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="card" style={{ marginTop: '20px' }}>
          <p style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>{saveSuccess}</p>
          {analyzing && <p>Analyzing mood and topics...</p>}
          {analysisResult && (
            <div>
              <div><strong>Mood:</strong> <span className={`badge mood-${analysisResult.mood?.toLowerCase()}`}>{analysisResult.mood}</span></div>
              <div style={{ marginTop: '10px' }}>
                <strong>Topics:</strong>
                {analysisResult.tags?.map(tag => (
                  <span key={tag} className="badge">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
