
import React from 'react';
import { useLiveConversation } from '../hooks/useLiveConversation';
import { Tool } from '../types';
import { Spinner } from './Spinner';

interface ConversationUIProps {
  tool: Tool;
}

export const ConversationUI: React.FC<ConversationUIProps> = ({ tool }) => {
  const { status, transcript, error, startConversation, stopConversation } = useLiveConversation();

  const isConversationActive = status === 'active' || status === 'connecting';

  return (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-white">{tool.name}</h2>
        <p className="text-content-200 mt-1">{tool.description}</p>
      </header>
      
      <div className="flex-1 bg-base-200 rounded-lg p-6 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {transcript.map((entry, index) => (
            <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl px-4 py-2 rounded-lg ${entry.speaker === 'user' ? 'bg-brand-primary text-white' : 'bg-base-300 text-content-100'}`}>
                <p>{entry.text}</p>
              </div>
            </div>
          ))}
           {transcript.length === 0 && !isConversationActive && (
              <div className="flex items-center justify-center h-full text-content-200">
                <p>Press "Start Conversation" to begin.</p>
              </div>
           )}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center">
        {error && <p className="text-red-400 mb-4">{error}</p>}
        
        <div className="flex items-center space-x-4">
          <button
            onClick={isConversationActive ? stopConversation : startConversation}
            className={`px-8 py-4 text-white font-semibold rounded-full transition-all duration-300 flex items-center justify-center ${
              isConversationActive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {status === 'connecting' && <Spinner />}
            {status === 'connecting' ? 'Connecting...' : isConversationActive ? 'Stop Conversation' : 'Start Conversation'}
          </button>

          {isConversationActive && (
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-12 w-12 bg-brand-primary items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
