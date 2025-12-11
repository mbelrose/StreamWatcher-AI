import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChannelInput } from './components/ChannelInput';
import { ScriptSettings } from './components/ScriptSettings';
import { LiveCard } from './components/LiveCard';
import { Toast } from './components/Toast';
import { checkChannelStatus } from './services/geminiService';
import { ChannelStatus, ToastMessage } from './types';
import { DEFAULT_CHANNELS, DEFAULT_SCRIPT_TEMPLATE, POLLING_INTERVALS } from './constants';

const App: React.FC = () => {
  const [channels, setChannels] = useState<string[]>(DEFAULT_CHANNELS);
  // Initialize Map with explicit types to ensure state is correctly typed
  const [statuses, setStatuses] = useState<Map<string, ChannelStatus>>(new Map<string, ChannelStatus>());
  const [scriptTemplate, setScriptTemplate] = useState<string>(DEFAULT_SCRIPT_TEMPLATE);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(5);
  const [lastAlerted, setLastAlerted] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
      addToast('Error', 'API_KEY not found in environment. App will not function correctly.', 'error');
    }
  }, []);

  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateStatus = useCallback((name: string, data: Partial<ChannelStatus>) => {
    setStatuses(prev => {
      // Explicitly type the new Map to avoid 'unknown' inference
      const newMap = new Map<string, ChannelStatus>(prev);
      const existing: ChannelStatus = newMap.get(name) || {
        name,
        isLive: false,
        lastChecked: 0,
        lastChanged: 0
      };

      const isGoingLive = !existing.isLive && data.isLive;
      const isGoingOffline = existing.isLive && !data.isLive;

      // Update the map
      newMap.set(name, {
        ...existing,
        ...data,
        lastChecked: Date.now(),
        lastChanged: (isGoingLive || isGoingOffline) ? Date.now() : existing.lastChanged
      });
      return newMap;
    });

    return { 
      wasLive: (prevStatuses: Map<string, ChannelStatus>) => prevStatuses.get(name)?.isLive || false 
    };
  }, []);

  const checkAllChannels = useCallback(async () => {
    if (isChecking || channels.length === 0 || apiKeyMissing) return;
    
    setIsChecking(true);
    addToast('Polling', `Checking status for ${channels.length} channels...`, 'info');

    // Process in chunks to avoid rate limits (pseudo-batching)
    // We do 3 at a time.
    const CHUNK_SIZE = 3;
    const currentStatusesRef = statuses; // Capture current state for comparison logic

    for (let i = 0; i < channels.length; i += CHUNK_SIZE) {
      const chunk = channels.slice(i, i + CHUNK_SIZE);
      
      await Promise.all(chunk.map(async (name) => {
        const result = await checkChannelStatus(name);
        
        // State update logic needs to be careful inside async loops
        // We use functional updates in setStatuses, but for Alerting logic we need recent state.
        
        // Alert Logic
        const wasLive = currentStatusesRef.get(name)?.isLive || false;
        
        if (result.isLive && !wasLive) {
          // Check if we already alerted for this specific session? 
          // Ideally we track session ID, but simplistically if it flips false->true we alert.
          // We also check 'lastAlerted' set to prevent duplicate alerts if state was slightly desync.
          
          setLastAlerted(prev => {
            if (!prev.has(name)) {
              addToast('Channel Live!', `${name} is now live streaming!`, 'success');
              
              // Play a sound?
              try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => console.warn("Audio play failed", e));
              } catch(e) {}
              
              const newSet = new Set(prev);
              newSet.add(name);
              return newSet;
            }
            return prev;
          });
        } else if (!result.isLive && wasLive) {
           // Channel went offline
           setLastAlerted(prev => {
             const newSet = new Set(prev);
             newSet.delete(name);
             return newSet;
           });
        }
        
        updateStatus(name, result);
      }));

      // Small delay between chunks to be nice to the API
      if (i + CHUNK_SIZE < channels.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsChecking(false);
  }, [channels, apiKeyMissing, isChecking, statuses, updateStatus]);

  // Interval Effect
  useEffect(() => {
    if (!isPolling) return;

    // Initial check
    checkAllChannels();

    const intervalId = setInterval(() => {
      checkAllChannels();
    }, pollingInterval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isPolling, pollingInterval, checkAllChannels]);

  // Derived state for display
  // Explicitly type Array.from to ensure TypeScript knows we are working with ChannelStatus objects
  const liveChannels = Array.from<ChannelStatus>(statuses.values()).filter(s => s.isLive);
  const offlineChannels = Array.from<ChannelStatus>(statuses.values()).filter(s => !s.isLive);

  return (
    <div className="min-h-screen bg-twitch-bg text-gray-100 font-sans selection:bg-twitch selection:text-white">
      {/* Header */}
      <header className="bg-twitch-surface border-b border-black shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-twitch rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.866v6.268a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
             </div>
             <h1 className="text-xl font-bold tracking-tight">StreamWatcher AI</h1>
          </div>

          <div className="flex items-center gap-4">
             {apiKeyMissing && (
                <span className="text-red-500 text-xs font-bold border border-red-500 px-2 py-1 rounded">MISSING API KEY</span>
             )}
             <div className="flex items-center gap-2 bg-gray-900 rounded p-1">
                <span className="text-xs text-gray-400 px-2">Poll every:</span>
                <select 
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(Number(e.target.value))}
                  className="bg-gray-800 text-white text-sm rounded border-none focus:ring-1 focus:ring-twitch px-2 py-1 outline-none"
                  disabled={isPolling}
                >
                  {POLLING_INTERVALS.map(m => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
             </div>

             <button
               onClick={() => setIsPolling(!isPolling)}
               disabled={apiKeyMissing}
               className={`
                 flex items-center gap-2 px-6 py-2 rounded font-bold text-sm shadow-lg transition-all
                 ${isPolling 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'}
                 ${apiKeyMissing ? 'opacity-50 cursor-not-allowed' : ''}
               `}
             >
               {isChecking ? (
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               ) : (
                 <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></span>
               )}
               {isPolling ? 'Stop Monitoring' : 'Start Monitoring'}
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Config */}
        <div className="lg:col-span-4 space-y-6">
          <ChannelInput channels={channels} setChannels={setChannels} />
          <ScriptSettings template={scriptTemplate} setTemplate={setScriptTemplate} />
          
          {/* Stats / Info */}
          <div className="bg-twitch-surface p-6 rounded-lg shadow-lg border border-gray-800">
             <h3 className="text-lg font-bold text-white mb-2">Status Log</h3>
             <div className="text-sm text-gray-400 space-y-1">
                <p>Channels Monitored: <span className="text-white">{channels.length}</span></p>
                <p>Currently Live: <span className="text-green-400">{liveChannels.length}</span></p>
                <p>Last Check: <span className="text-white">{isChecking ? 'Checking now...' : new Date().toLocaleTimeString()}</span></p>
             </div>
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="lg:col-span-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Live Channels
          </h2>

          {liveChannels.length === 0 ? (
            <div className="bg-twitch-surface/50 border border-dashed border-gray-700 rounded-xl p-12 text-center">
              <div className="text-gray-500 text-6xl mb-4">📺</div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">No active streams found</h3>
              <p className="text-gray-500">
                {isPolling 
                  ? "Scanning for live channels..." 
                  : "Start monitoring to see live streams here."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveChannels.map(status => (
                <LiveCard 
                  key={status.name} 
                  status={status} 
                  scriptTemplate={scriptTemplate} 
                />
              ))}
            </div>
          )}
          
          {/* Debug/List of monitored but offline */}
           {offlineChannels.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-800">
               <h3 className="text-lg font-bold text-gray-500 mb-4">Offline ({offlineChannels.length})</h3>
               <div className="flex flex-wrap gap-2">
                 {offlineChannels.map(c => (
                   <span key={c.name} className="px-2 py-1 bg-gray-900 rounded text-xs text-gray-500 border border-gray-800">
                     {c.name}
                   </span>
                 ))}
               </div>
            </div>
           )}
        </div>
      </main>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
         <div className="pointer-events-auto">
           {toasts.map(toast => (
             <Toast key={toast.id} toast={toast} onClose={removeToast} />
           ))}
         </div>
      </div>
    </div>
  );
};

export default App;