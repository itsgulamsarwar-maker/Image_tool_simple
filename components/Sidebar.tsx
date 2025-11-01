import React from 'react';
import { TOOLS } from '../constants';
import { ToolId } from '../types';

interface SidebarProps {
  activeToolId: ToolId;
  setActiveToolId: (id: ToolId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeToolId, setActiveToolId }) => {
  return (
    <aside className="w-64 bg-base-200 p-4 flex flex-col flex-shrink-0">
      <div className="flex items-center mb-8">
         <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3" />
            </svg>
         </div>
         <h1 className="text-xl font-bold text-content-100">Gulam-AI Tool</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveToolId(tool.id)}
            className={`group flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-all duration-150 relative ${
              activeToolId === tool.id
                ? 'bg-base-300 text-content-100'
                : 'text-content-200 hover:bg-base-300 hover:text-content-100'
            }`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-all ${activeToolId === tool.id ? 'bg-brand-primary' : 'bg-transparent'}`}></div>
            {React.cloneElement(tool.icon as React.ReactElement<any>, {
              className: `h-5 w-5 mr-3 transition-colors ${
                activeToolId === tool.id ? 'text-content-100' : 'text-content-200 group-hover:text-content-100'
              }`,
            })}
            {tool.name}
          </button>
        ))}
      </nav>
    </aside>
  );
};