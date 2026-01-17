import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  readVault: () => ipcRenderer.invoke('read-vault'),
  writeVault: (data: string) => ipcRenderer.invoke('write-vault', data),
  clearVault: () => ipcRenderer.invoke('clear-vault'),
  vaultExists: () => ipcRenderer.invoke('vault-exists'),
  setCloseToTray: (enabled: boolean) => ipcRenderer.invoke('set-close-to-tray', enabled),
});

declare global {
  interface Window {
    electronAPI: {
      readVault: () => Promise<string | null>;
      writeVault: (data: string) => Promise<boolean>;
      clearVault: () => Promise<boolean>;
      vaultExists: () => Promise<boolean>;
      setCloseToTray: (enabled: boolean) => Promise<void>;
    };
  }
}
