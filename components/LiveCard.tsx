
import React, { useState } from 'react';
import { ChannelStatus } from '../types';
import { platformService } from '../services/platformService';

interface LiveCardProps {
  status: ChannelStatus;
  commandTemplate: string;
}

export const LiveCard: React.FC<LiveCardProps> = ({ status, commandTemplate }) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const channelUrl = `https://twitch.tv/${status.name}`;

  const handleAction = async () => {
    const command = commandTemplate.replace(/{{url}}/g, channelUrl);
    const isDesktop = platformService.isDesktop();
    
    if (isDesktop) {
      try {
        await platformService.launchCommand(command);
        setFeedback("Launched");
      } catch (e) {
        setFeedback("Error");
        console.error(e);
      }
    } else {
      navigator.clipboard.writeText(command);
      setFeedback("Copied");
    }

    setTimeout(() => setFeedback(null), 2000);
  };

  const isDesktop = platformService.isDesktop();

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
             onClick={handleAction}
             className={`w-full flex items-center justify-center gap-2 text-white text-sm font-bold py-2 px-4 rounded transition-colors shadow-md active:translate-y-0.5
               ${feedback === 'Error' ? 'bg-red-600 hover:bg-red-700' : 'bg-twitch hover:bg-twitch-light'}
             `}
             title={isDesktop ? "Launch stream" : "Copy launch command"}
           >
             {feedback ? (
               <span>{feedback}!</span>
             ) : (
               <>
                 {isDesktop ? (
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 ) : (
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                   </svg>
                 )}
                 {isDesktop ? "Launch" : "Copy Command"}
               </>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};
