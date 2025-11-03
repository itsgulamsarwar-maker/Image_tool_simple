import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageEditor } from './components/ImageEditor';
import { ConversationUI } from './components/ConversationUI';
import { TOOLS } from './constants';
import { ToolId } from './types';
import { ApiKeyChecker } from './components/ApiKeyChecker';

const App: React.FC = () => {
  const [activeToolId, setActiveToolId] = useState<ToolId>(ToolId.LiveConversation);

  const activeTool = TOOLS.find(tool => tool.id === activeToolId);

  const renderTool = () => {
    if (!activeTool) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-2xl text-content-200">Select a tool to get started</p>
        </div>
      );
    }
    
    if (activeTool.id === ToolId.LiveConversation) {
      return <ConversationUI tool={activeTool} />;
    }
    
    return <ImageEditor tool={activeTool} />;
  };

  return (
    <ApiKeyChecker>
      <div className="flex h-screen bg-base-100 font-sans">
        <Sidebar activeToolId={activeToolId} setActiveToolId={setActiveToolId} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto h-full">
            {renderTool()}
          </div>
        </main>
      </div>
    </ApiKeyChecker>
  );
};

export default App;