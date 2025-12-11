import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChannelInput } from './components/ChannelInput';
import { ScriptSettings } from './components/ScriptSettings';
import { LiveCard } from './components/LiveCard';
import { Toast } from './components/Toast';
import { TwitchCredentialsInput } from './components/TwitchCredentials';
import { getStreams, generateAppAccessToken } from './services/twitchService';
import { ChannelStatus, ToastMessage, TwitchCredentials } from './types';
import { DEFAULT_CHANNELS, DEFAULT_COMMAND_TEMPLATE, POLLING_INTERVALS } from './constants';

const App: React.FC = () => {
  const [channels, setChannels] = useState<string[]>(DEFAULT_CHANNELS);
  const [statuses, setStatuses] = useState<Map<string, ChannelStatus>>(new Map<string, ChannelStatus>());
  const [commandTemplate, setCommandTemplate] = useState<string>(DEFAULT_COMMAND_TEMPLATE);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(2);
  const [lastAlerted, setLastAlerted] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [creds, setCreds] = useState<TwitchCredentials | null>(null);

  // Load creds from env or local storage
  useEffect(() => {
    const envClientId = process.env.TWITCH_CLIENT_ID;
    const envSecret = process.env.TWITCH_CLIENT_SECRET;
    const envToken = process.env.TWITCH_ACCESS_TOKEN;

    const savedClientId = localStorage.getItem('twitch_client_id');
    const savedAccessToken = localStorage.getItem('twitch_access_token');
    const savedClientSecret = localStorage.getItem('twitch_client_secret');

    if (envClientId && envSecret) {
      // Prioritize environment variables for headless/Linux setup
      setCreds({
        clientId: envClientId,
        clientSecret: envSecret,
        // Use provided token, or fallback to saved token, or empty (to trigger generation)
        accessToken: envToken || savedAccessToken || ''
      });
    } else if (savedClientId && savedAccessToken) {
      setCreds({ 
        clientId: savedClientId, 
        accessToken: savedAccessToken,
        clientSecret: savedClientSecret || undefined
      });
    }
  }, []);

  const handleSaveCreds = useCallback((newCreds: TwitchCredentials) => {
    setCreds(newCreds);
    localStorage.setItem('twitch_client_id', newCreds.clientId);
    localStorage.setItem('twitch_access_token', newCreds.accessToken);
    if (newCreds.clientSecret) {
      localStorage.setItem('twitch_client_secret', newCreds.clientSecret);
    }
  }, []);

  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const processChannelData = (liveStreams: ChannelStatus[]) => {
    const liveStreamMap = new Map<string, ChannelStatus>();
    liveStreams.forEach(s => liveStreamMap.set(s.name.toLowerCase(), s));

    setStatuses((prev: Map<string, ChannelStatus>) => {
      const next = new Map<string, ChannelStatus>(prev);
      const nextAlerted = new Set(lastAlerted);
      let hasAlertUpdates = false;

      channels.forEach(channelRaw => {
        const channelKey = channelRaw.toLowerCase();
        const existing = next.get(channelKey);
        const liveData = liveStreamMap.get(channelKey);

        if (liveData) {
          // Channel is Live
          if (!existing?.isLive) {
            // Was not live before (or new)
            if (!nextAlerted.has(channelKey)) {
              addToast('Channel Live!', `${liveData.name} is now live playing ${liveData.game || 'something'}!`, 'success');
              try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                  audio.volume = 0.4;
                  audio.play().catch(() => {});
              } catch {}
              
              nextAlerted.add(channelKey);
              hasAlertUpdates = true;
            }
          }
          
          next.set(channelKey, { ...liveData, name: channelRaw });
        } else {
          // Channel is Offline
          if (existing?.isLive) {
            nextAlerted.delete(channelKey);
            hasAlertUpdates = true;
          }
          
          next.set(channelKey, {
            name: channelRaw,
            isLive: false,
            lastChecked: Date.now(),
            lastChanged: existing?.isLive ? Date.now() : (existing?.lastChanged || Date.now())
          });
        }
      });

      if (hasAlertUpdates) {
        setLastAlerted(nextAlerted);
      }
      return next;
    });
  };

  const checkStatus = useCallback(async () => {
    if (isChecking || !creds) return;
    setIsChecking(true);

    let activeToken = creds.accessToken;
    let fetchedStreams: ChannelStatus[] | null = null;

    try {
      // 1. If we have a secret but no token (or empty token), generate one first
      if (!activeToken && creds.clientSecret) {
        try {
          const newToken = await generateAppAccessToken(creds.clientId, creds.clientSecret);
          handleSaveCreds({ ...creds, accessToken: newToken });
          activeToken = newToken;
        } catch (genError: any) {
          addToast('Auth Error', `Could not generate token: ${genError.message}`, 'error');
          setIsChecking(false);
          return;
        }
      }

      // 2. Try fetching streams
      try {
        fetchedStreams = await getStreams(channels, creds.clientId, activeToken);
      } catch (e: any) {
        // 3. Handle Unauthorized: Retry with refresh if secret is available
        if (e.message.includes('Unauthorized') && creds.clientSecret) {
          console.log('Token expired or invalid, attempting refresh...');
          try {
            const newToken = await generateAppAccessToken(creds.clientId, creds.clientSecret);
            handleSaveCreds({ ...creds, accessToken: newToken });
            // Retry fetch with new token
            fetchedStreams = await getStreams(channels, creds.clientId, newToken);
          } catch (refreshErr: any) {
            throw new Error(`Failed to refresh token: ${refreshErr.message}`);
          }
        } else {
          throw e; // Propagate other errors or if no secret available
        }
      }

      if (fetchedStreams) {
        processChannelData(fetchedStreams);
      }

    } catch (e: any) {
      console.error(e);
      addToast('Check Failed', e.message || 'Error querying Twitch API', 'error');
      if (e.message.includes('Unauthorized')) {
        setCreds(null); // Force re-login or check of env vars
      }
    } finally {
      setIsChecking(false);
    }
  }, [channels, creds, isChecking, lastAlerted, handleSaveCreds]);

  // Interval Effect
  useEffect(() => {
    if (!isPolling || !creds) return;
    checkStatus(); // Initial check
    const intervalId = setInterval(checkStatus, pollingInterval * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [isPolling, pollingInterval, creds, checkStatus]);

  const liveChannels = Array.from(statuses.values()).filter((s: ChannelStatus) => s.isLive);

  if (!creds) {
    return <TwitchCredentialsInput onSave={handleSaveCreds} />;
  }

  return (
    <div className="min-h-screen bg-twitch-bg text-gray-100 font-sans selection:bg-twitch selection:text-white">
      {/* Header */}
      <header className="bg-twitch-surface border-b border-black shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-twitch rounded flex items-center justify-center shadow-lg shadow-twitch/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.866v6.268a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
             </div>
             <h1 className="text-xl font-bold tracking-tight">StreamWatcher</h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-gray-900 rounded p-1 border border-gray-800">
                <span className="text-xs text-gray-400 px-2 uppercase font-bold tracking-wider">Poll Interval</span>
                <select 
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(Number(e.target.value))}
                  className="bg-gray-800 text-white text-sm rounded border-none focus:ring-1 focus:ring-twitch px-2 py-1 outline-none"
                  disabled={isPolling}
                >
                  {POLLING_INTERVALS.map(m => (
                    <option key={m} value={m}>{m}m</option>
                  ))}
                </select>
             </div>

             <button
               onClick={() => setIsPolling(!isPolling)}
               className={`
                 flex items-center gap-2 px-6 py-2 rounded font-bold text-sm shadow-lg transition-all
                 ${isPolling 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-900/20'}
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
               {isPolling ? 'Stop' : 'Start'}
             </button>
             
             <button 
               onClick={() => setCreds(null)}
               className="text-xs text-gray-500 hover:text-gray-300 underline"
             >
               Logout
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Config */}
        <div className="lg:col-span-4 space-y-6">
          <ChannelInput channels={channels} setChannels={setChannels} />
          <ScriptSettings template={commandTemplate} setTemplate={setCommandTemplate} />
          
          {/* Stats / Info */}
          <div className="bg-twitch-surface p-6 rounded-lg shadow-lg border border-gray-800">
             <h3 className="text-lg font-bold text-white mb-2">Status Log</h3>
             <div className="text-sm text-gray-400 space-y-1">
                <p>Channels Monitored: <span className="text-white">{channels.length}</span></p>
                <p>Currently Live: <span className="text-green-400 font-bold">{liveChannels.length}</span></p>
                <p>Last Check: <span className="text-white">{isChecking ? 'Checking...' : new Date().toLocaleTimeString()}</span></p>
             </div>
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="lg:col-span-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${liveChannels.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`}></span>
            Live Channels
          </h2>

          {liveChannels.length === 0 ? (
            <div className="bg-twitch-surface/50 border border-dashed border-gray-700 rounded-xl p-12 text-center">
              <div className="text-gray-600 text-6xl mb-4 grayscale opacity-50">📺</div>
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
                  commandTemplate={commandTemplate} 
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none gap-2">
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