
import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  onSkip?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isTyping, onSkip }) => {
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-rpg-900 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-rpg-sub opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>A aventura aguarda...</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-lg p-4 shadow-md ${
                msg.role === 'user'
                  ? 'bg-rpg-700 text-white rounded-br-none border border-rpg-600'
                  : msg.isDiceRoll 
                    ? 'bg-rpg-800 text-rpg-accent border border-rpg-accent border-dashed italic text-center'
                    : 'bg-rpg-800 text-gray-100 rounded-bl-none border border-rpg-700 font-fantasy leading-relaxed'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.role === 'user' ? 'Você' : msg.role === 'system' ? 'Sistema' : 'Mestre'}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-rpg-800 rounded-lg p-4 rounded-bl-none border border-rpg-700">
               <span className="text-rpg-sub text-sm italic">O Mestre está escrevendo...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-rpg-800 border-t border-rpg-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="O que você faz?"
            className="flex-1 bg-rpg-900 text-white border border-rpg-600 rounded-md px-4 py-3 focus:outline-none focus:border-rpg-accent focus:ring-1 focus:ring-rpg-accent transition-all disabled:opacity-50"
          />
          {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={isTyping}
                title="Pular/Continuar (Sem falar nada)"
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 transition-colors border border-gray-600"
              >
                ⏩
              </button>
          )}
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="bg-rpg-accent hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};
