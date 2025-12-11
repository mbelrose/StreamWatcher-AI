export interface ChannelStatus {
  name: string;
  isLive: boolean;
  title?: string;
  game?: string;
  viewers?: string;
  thumbnailUrl?: string;
  lastChecked: number;
  lastChanged: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface TwitchCredentials {
  clientId: string;
  accessToken: string;
  clientSecret?: string;
}