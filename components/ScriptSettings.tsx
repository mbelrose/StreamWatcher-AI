import React from 'react';

interface ScriptSettingsProps {
  template: string;
  setTemplate: (val: string) => void;
}

export const ScriptSettings: React.FC<ScriptSettingsProps> = ({ template, setTemplate }) => {
  return (
    <div className="bg-twitch-surface p-6 rounded-lg shadow-lg border border-gray-800">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-twitch-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Bash Script Config
      </h2>
      
      <p className="text-sm text-gray-400 mb-2">
        Define the script content. Use <code className="text-twitch-light">{'{{url}}'}</code> as a placeholder for the Twitch URL.
      </p>

      <textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        className="w-full h-32 bg-twitch-bg text-green-400 p-3 rounded border border-gray-700 focus:border-twitch focus:ring-1 focus:ring-twitch outline-none text-sm font-mono"
        spellCheck={false}
      />
    </div>
  );
};