import React from 'react';
import { ChannelStatus } from '../types';

interface LiveCardProps {
  status: ChannelStatus;
  scriptTemplate: string;
}

export const LiveCard: React.FC<LiveCardProps> = ({ status, scriptTemplate }) => {
  const channelUrl = `https://twitch.tv/${status.name}`;

  const handleCopyCommand = () => {
    const command = scriptTemplate.replace(/{{url}}/g, channelUrl);
    navigator.clipboard.writeText(command);
    // Note: Parent component handles generic toasts, but specific button feedback is good locally or via callback.
    // For simplicity, we just copy.
  };

  const handleDownloadScript = () => {
    const scriptContent = scriptTemplate.replace(/{{url}}/g, channelUrl);
    const blob = new Blob([scriptContent], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `launch-${status.name}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getThumbnailUrl = () => {
    // We don't have real thumbnails without Twitch API, using placeholder or generic
    return `https://picsum.photos/320/180?random=${status.name.length}`;
  };

  return (
    <div className="bg-twitch-surface rounded-lg overflow-hidden shadow-lg border border-twitch-dark/30 hover:border-twitch-light/50 transition-all group">
      <div className="relative h-32 bg-gray-900">
         {/* Placeholder for thumbnail since we can't get real one easily without auth */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-bold text-2xl bg-black/40">
           {status.name.toUpperCase()}
        </div>
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
          Live
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white truncate pr-2" title={status.name}>{status.name}</h3>
        </div>
        <p className="text-sm text-gray-300 line-clamp-1 mb-1" title={status.title}>{status.title || 'No Title'}</p>
        <p className="text-xs text-twitch-light mb-4">{status.game || 'Just Chatting'}</p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyCommand}
            className="flex items-center justify-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-colors"
            title="Copy command to clipboard"
          >
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
             Copy Cmd
          </button>
          <button
            onClick={handleDownloadScript}
            className="flex items-center justify-center gap-1 bg-twitch hover:bg-twitch-light text-white text-xs py-2 px-3 rounded transition-colors"
            title="Download .sh script"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Launch Script
          </button>
        </div>
      </div>
    </div>
  );
};
