import React from 'react';
import { ChannelStatus } from '../types';

interface LiveCardProps {
  status: ChannelStatus;
  commandTemplate: string;
}

export const LiveCard: React.FC<LiveCardProps> = ({ status, commandTemplate }) => {
  const channelUrl = `https://twitch.tv/${status.name}`;

  const handleCopyCommand = () => {
    const command = commandTemplate.replace(/{{url}}/g, channelUrl);
    navigator.clipboard.writeText(command);
  };

  return (
    <div className="bg-twitch-surface rounded-lg overflow-hidden shadow-lg border border-twitch-dark/30 hover:border-twitch-light/50 transition-all group flex flex-col">
      <div className="relative aspect-video bg-gray-900 group-hover:brightness-110 transition-all">
        {status.thumbnailUrl ? (
          <img 
            src={`${status.thumbnailUrl}?t=${status.lastChecked}`} 
            alt={status.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-bold text-2xl">
             {status.name.toUpperCase()}
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex gap-2">
           <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse shadow-sm">
             Live
           </span>
           <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded backdrop-blur-sm">
             {status.viewers ? `${Number(status.viewers).toLocaleString()} viewers` : 'Viewers hidden'}
           </span>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-white truncate pr-2" title={status.name}>
             {status.name}
          </h3>
        </div>
        <p className="text-sm text-gray-300 line-clamp-2 mb-2 leading-tight" title={status.title}>
           {status.title || 'No Title'}
        </p>
        <p className="text-xs text-twitch-light mb-4 font-medium">
           {status.game || 'Just Chatting'}
        </p>

        <div className="mt-auto pt-2 border-t border-gray-800">
           <button
             onClick={handleCopyCommand}
             className="w-full flex items-center justify-center gap-2 bg-twitch hover:bg-twitch-light text-white text-sm font-bold py-2 px-4 rounded transition-colors shadow-md active:translate-y-0.5"
             title="Copy launch command to clipboard"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             Launch Script
           </button>
           <p className="text-[10px] text-gray-500 text-center mt-1">Copies command to clipboard</p>
        </div>
      </div>
    </div>
  );
};
