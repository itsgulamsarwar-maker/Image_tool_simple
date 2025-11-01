import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageEditor } from './components/ImageEditor';
import { TOOLS } from './constants';
import { ToolId } from './types';

const App: React.FC = () => {
  const [activeToolId, setActiveToolId] = useState<ToolId>(ToolId.BackgroundRemover);

  const activeTool = TOOLS.find(tool => tool.id === activeToolId);

  return (
    <div className="flex h-screen bg-base-100 font-sans">
      <Sidebar activeToolId={activeToolId} setActiveToolId={setActiveToolId} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full">
          {activeTool ? (
             <ImageEditor tool={activeTool} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-2xl text-content-200">Select a tool to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;