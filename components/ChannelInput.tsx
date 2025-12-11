import React, { useState } from 'react';

interface ChannelInputProps {
  channels: string[];
  setChannels: (channels: string[]) => void;
}

export const ChannelInput: React.FC<ChannelInputProps> = ({ channels, setChannels }) => {
  const [inputText, setInputText] = useState(channels.join('\n'));

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleSave = () => {
    const newChannels = inputText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Deduplicate
    const uniqueChannels = Array.from(new Set(newChannels));
    setChannels(uniqueChannels);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputText(text);
      // Automatically save on load
      const newChannels = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      setChannels(Array.from(new Set(newChannels)));
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-twitch-surface p-6 rounded-lg shadow-lg border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-twitch-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Channel List
        </h2>
        <label className="cursor-pointer bg-twitch-surfaceHover hover:bg-gray-700 text-xs text-gray-300 py-1 px-3 rounded border border-gray-600 transition-colors">
          Upload .txt
          <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <textarea
        value={inputText}
        onChange={handleTextChange}
        className="w-full h-40 bg-twitch-bg text-gray-300 p-3 rounded border border-gray-700 focus:border-twitch focus:ring-1 focus:ring-twitch outline-none text-sm font-mono"
        placeholder="Enter channel names (one per line)..."
      />

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="bg-twitch hover:bg-twitch-dark text-white px-4 py-2 rounded font-medium text-sm transition-colors shadow-md"
        >
          Update List
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-right">
        Tracking {channels.length} channels
      </p>
    </div>
  );
};
