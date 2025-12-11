export interface ChannelStatus {
  name: string;
  isLive: boolean;
  title?: string;
  game?: string;
  viewers?: string;
  lastChecked: number;
  lastChanged: number;
}

export interface PollingConfig {
  intervalMinutes: number;
  scriptTemplate: string;
}

export type CheckStatusFunction = (channelName: string) => Promise<Partial<ChannelStatus>>;

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}