import React, { useState } from 'react';
import { TwitchCredentials } from '../types';
import { validateCredentials } from '../services/twitchService';

interface TwitchCredentialsProps {
  onSave: (creds: TwitchCredentials) => void;
}

export const TwitchCredentialsInput: React.FC<TwitchCredentialsProps> = ({ onSave }) => {
  const [clientId, setClientId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (clientId && accessToken) {
      setIsValidating(true);
      
      // Clean inputs for validation check (same as service will do)
      const cleanId = clientId.trim();
      const cleanToken = accessToken.replace(/^Bearer\s+/i, '').replace(/^oauth:/i, '').trim();

      const isValid = await validateCredentials(cleanId, cleanToken);
      setIsValidating(false);

      if (isValid) {
        onSave({ clientId: cleanId, accessToken: cleanToken });
      } else {
        setError("Invalid credentials. Please check your Client ID and Access Token.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
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
              className="w-full bg-twitch-bg border border-gray-700 rounded p-3 text-white focus:border-twitch focus:ring-1 focus:ring-twitch outline-none transition-colors"
              placeholder="gp762nuuoqcoxypju8c569th9wz7q5"
              required
              disabled={isValidating}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">App Access Token</label>
            <input 
              type="password" 
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              className="w-full bg-twitch-bg border border-gray-700 rounded p-3 text-white focus:border-twitch focus:ring-1 focus:ring-twitch outline-none transition-colors"
              placeholder="2gbdx6oar67tqtcmt09c34a17fvqki"
              required
              disabled={isValidating}
            />
            <p className="text-[10px] text-gray-500 mt-1">If using CLI, paste the token without 'Bearer' prefix.</p>
          </div>

          {error && (
             <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
             </div>
          )}

          <div className="bg-gray-800 p-3 rounded text-xs text-gray-400">
             <p className="mb-1"><strong>How to get this?</strong></p>
             <p>Register an app on <a href="https://dev.twitch.tv/console" target="_blank" className="text-twitch-light hover:underline">Twitch Console</a>. Then use CLI or tools to generate an App Access Token.</p>
          </div>

          <button 
            type="submit"
            disabled={isValidating}
            className={`w-full bg-twitch hover:bg-twitch-dark text-white font-bold py-3 rounded transition-all flex items-center justify-center gap-2 ${isValidating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isValidating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              'Connect to Twitch'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};