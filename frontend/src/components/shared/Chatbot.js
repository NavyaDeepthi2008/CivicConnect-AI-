import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../utils/api';

export default function Chatbot({ onClose }) {
  const { token, t } = useApp();
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: "Hello! I'm your CivicConnect AI assistant. How can I help you today? You can ask me about reporting issues, checking status, or how the platform works." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.chatbot(token, input);
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between p-4 bg-civic-500 text-white">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-semibold text-sm">{t('chatbot')}</span>
        </div>
        <button onClick={onClose}><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-civic-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={t('askAnything')}
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-civic-500"
        />
        <button onClick={send} disabled={!input.trim() || loading}
          className="p-2 bg-civic-500 text-white rounded-lg disabled:opacity-50 hover:bg-civic-600 transition-colors">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
