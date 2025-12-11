import { ChannelStatus } from "../types";

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

  for (const chunk of chunks) {
    const params = new URLSearchParams();
    chunk.forEach(name => params.append('user_login', name));

    try {
      const response = await fetch(`https://api.twitch.tv/helix/streams?${params.toString()}`, {
        headers: {
          'Client-Id': clientId,
          'Authorization': `Bearer ${accessToken}`
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
      console.error("Failed to fetch streams chunk", e);
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
    const response = await fetch('https://api.twitch.tv/helix/users?id=44322889', {
      headers: {
        'Client-Id': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.ok;
  } catch {
    return false;
  }
};
