
// This service abstracts the underlying desktop runner (Tauri or Electron)
// so the React components don't care which one is being used.

// We use dynamic imports or global checks to avoid build errors if dependencies are missing
import { invoke } from '@tauri-apps/api/core';

export type PlatformType = 'tauri' | 'electron' | 'web';

export const getPlatform = (): PlatformType => {
  if (window.__TAURI__) return 'tauri';
  if (window.electron) return 'electron';
  return 'web';
};

export const platformService = {
  getType: getPlatform,

  isDesktop: (): boolean => {
    const type = getPlatform();
    return type === 'tauri' || type === 'electron';
  },

  launchCommand: async (command: string): Promise<string> => {
    const type = getPlatform();
    
    if (type === 'tauri') {
      // Calls the Rust function 'launch_command'
      return await invoke('launch_command', { command });
    }
    
    if (type === 'electron' && window.electron) {
      return await window.electron.launchCommand(command);
    }

    throw new Error('Not running in a desktop environment');
  },

  readConfig: async (): Promise<any> => {
    const type = getPlatform();

    if (type === 'tauri') {
      try {
        // Calls the Rust function 'read_config'
        const configStr = await invoke('read_config') as string;
        return JSON.parse(configStr);
      } catch (e) {
        console.warn("Tauri config read failed", e);
        return null;
      }
    }

    if (type === 'electron' && window.electron) {
      return await window.electron.readConfig();
    }

    // Web fallback
    try {
      const response = await fetch('/config.json');
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        return await response.json();
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }
};
