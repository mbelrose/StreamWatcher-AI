import { ChannelStatus } from "../types";

// Helper to clean tokens (remove Bearer/oauth prefixes if pasted)
const cleanToken = (token: string) => token.replace(/^Bearer\s+/i, '').replace(/^oauth:/i, '').trim();
const cleanClientId = (id: string) => id.trim();

export const generateAppAccessToken = async (clientId: string, clientSecret: string): Promise<string> => {
  const params = new URLSearchParams();
  params.append('client_id', cleanClientId(clientId));
  params.append('client_secret', cleanToken(clientSecret));
  params.append('grant_type', 'client_credentials');

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: params
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to generate token: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.access_token;
};

export const getStreams = async (
  channels: string[],
  clientId: string,
  accessToken: string
): Promise<ChannelStatus[]> => {
  if (!channels.length) return [];

  const uniqueChannels = Array.from(new Set(channels.map(c => c.toLowerCase())));
  const chunks = [];
  for (let i = 0; i < uniqueChannels.length; i += 100) {
    chunks.push(uniqueChannels.slice(i, i + 100));
  }

  let allStreams: any[] = [];
  const safeClientId = cleanClientId(clientId);
  const safeToken = cleanToken(accessToken);

  for (const chunk of chunks) {
    const params = new URLSearchParams();
    chunk.forEach(name => params.append('user_login', name));

    try {
      const response = await fetch(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
        headers: {
          'Client-Id': safeClientId,
          'Authorization': `Bearer ${safeToken}`
        }
      });

      if (response.status === 401) {
        throw new Error("Unauthorized: Invalid Client ID or Access Token.");
      }

      if (!response.ok) {
        throw new Error(`Twitch API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      allStreams = [...allStreams, ...data.data];
    } catch (e) {
      if (e instanceof Error) {
        // Propagate auth errors immediately
        if (e.message.includes("Unauthorized")) throw e;
        console.warn("Failed to fetch streams chunk", e.message);
      }
      throw e;
    }
  }

  return allStreams.map((stream: any) => ({
    name: stream.user_login,
    isLive: true,
    title: stream.title,
    game: stream.game_name,
    viewers: stream.viewer_count.toString(),
    thumbnailUrl: stream.thumbnail_url?.replace('{width}', '400').replace('{height}', '225'),
    lastChecked: Date.now(),
    lastChanged: Date.now() 
  }));
};

export const validateCredentials = async (clientId: string, accessToken: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.twitch.tv/helix/streams?first=1', {
      headers: {
        'Client-Id': cleanClientId(clientId),
        'Authorization': `Bearer ${cleanToken(accessToken)}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
};