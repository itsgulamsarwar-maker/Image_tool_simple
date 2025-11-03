import React from 'react';

const isSecureContext = window.isSecureContext;
const apiKey = process.env.API_KEY;

const issues: { title: string; description: string; code?: string }[] = [];

if (!apiKey) {
  issues.push({
    title: "API Key Not Found",
    description: "This application requires a Google AI API key. Please run this application in an environment where the API_KEY is set, such as Google AI Studio.",
    code: "process.env.API_KEY"
  });
}

if (!isSecureContext) {
  issues.push({
    title: "Insecure Context",
    description: "The Live Conversation feature requires a secure context (HTTPS or localhost) to access your microphone. Please serve this page over HTTPS, as it will not work correctly when opened as a local file.",
    code: "window.isSecureContext === false"
  });
}

export const ApiKeyChecker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (issues.length > 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100 text-content-100">
        <div className="max-w-2xl p-8 bg-base-200 rounded-lg shadow-lg text-center border border-base-300">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Application Environment Error</h2>
          <p className="text-content-200 mb-6">
            The application cannot start due to the following configuration issues:
          </p>
          <div className="space-y-4 text-left">
            {issues.map(issue => (
              <div key={issue.title} className="p-4 bg-base-100 rounded-md">
                <h3 className="font-bold text-content-100">{issue.title}</h3>
                <p className="mt-2 text-content-200 text-sm">{issue.description}</p>
                {issue.code && <div className="mt-3 p-2 bg-base-300 rounded-md font-mono text-xs text-content-100"><code>{issue.code}</code></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};