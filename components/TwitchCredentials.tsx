import React, { useState } from 'react';
import { TwitchCredentials } from '../types';

interface TwitchCredentialsProps {
  onSave: (creds: TwitchCredentials) => void;
}

export const TwitchCredentialsInput: React.FC<TwitchCredentialsProps> = ({ onSave }) => {
  const [clientId, setClientId] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientId && accessToken) {
      onSave({ clientId: clientId.trim(), accessToken: accessToken.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-twitch-surface p-8 rounded-lg shadow-2xl max-w-md w-full border border-twitch">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-twitch rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Twitch Setup</h2>
        </div>
        
        <p className="text-gray-300 text-sm mb-6">
          To query the Twitch API directly, you need a Client ID and Access Token. 
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Client ID</label>
            <input 
              type="text" 
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full bg-twitch-bg border border-gray-700 rounded p-3 text-white focus:border-twitch focus:ring-1 focus:ring-twitch outline-none"
              placeholder="gp762nuuoqcoxypju8c569th9wz7q5"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">App Access Token (Bearer)</label>
            <input 
              type="password" 
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              className="w-full bg-twitch-bg border border-gray-700 rounded p-3 text-white focus:border-twitch focus:ring-1 focus:ring-twitch outline-none"
              placeholder="2gbdx6oar67tqtcmt09c34a17fvqki"
              required
            />
          </div>

          <div className="bg-gray-800 p-3 rounded text-xs text-gray-400">
             <p className="mb-1"><strong>How to get this?</strong></p>
             <p>Register an app on <a href="https://dev.twitch.tv/console" target="_blank" className="text-twitch-light hover:underline">Twitch Console</a>. Then use CLI or tools to generate an App Access Token.</p>
          </div>

          <button 
            type="submit"
            className="w-full bg-twitch hover:bg-twitch-dark text-white font-bold py-3 rounded transition-colors"
          >
            Connect to Twitch
          </button>
        </form>
      </div>
    </div>
  );
};
