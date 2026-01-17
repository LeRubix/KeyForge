/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    readVault: () => Promise<string | null>;
    writeVault: (data: string) => Promise<boolean>;
    clearVault: () => Promise<boolean>;
    vaultExists: () => Promise<boolean>;
    setCloseToTray: (enabled: boolean) => Promise<void>;
  };
}
