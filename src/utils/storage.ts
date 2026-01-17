import { encrypt, decrypt, EncryptedData, hashPassword } from './crypto';
import { clearSensitiveString } from './clipboard';

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  pinned?: boolean;
  folderId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PasswordFolder {
  id: string;
  name: string;
  color: string;
  expanded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Vault {
  passwords: PasswordEntry[];
  folders?: PasswordFolder[];
  version: string;
  recoveryPhraseHash?: string;
  entries?: PasswordEntry[];
}

const VAULT_VERSION = '1.0.0';

function isElectron(): boolean {
  return typeof window !== 'undefined' && 'electronAPI' in window;
}

export async function readVault(
  masterPassword: string
): Promise<Vault | null> {
  try {
    let encryptedData: string | null = null;

    if (isElectron() && window.electronAPI) {
      encryptedData = await window.electronAPI.readVault();
    } else {
      encryptedData = localStorage.getItem('keyforge_vault');
    }

    if (!encryptedData) {
      return null;
    }

    const encrypted: EncryptedData = JSON.parse(encryptedData);
    const decrypted = await decrypt(encrypted, masterPassword);
    const vault = JSON.parse(decrypted) as Vault;
    
    clearSensitiveString(decrypted);
    
    if (vault.entries && !vault.passwords) {
      vault.passwords = vault.entries;
      delete vault.entries;
    }
    
    return vault;
  } catch (error) {
    console.error('Error reading vault');
    return null;
  }
}

export async function writeVault(
  vault: Vault,
  masterPassword: string,
  isRecoveryBackup: boolean = false
): Promise<boolean> {
  try {
    vault.version = VAULT_VERSION;
    const plaintext = JSON.stringify(vault);
    const encrypted = await encrypt(plaintext, masterPassword);

    const encryptedData = JSON.stringify(encrypted);

    if (isElectron() && window.electronAPI) {
      if (isRecoveryBackup) {
        localStorage.setItem('keyforge_vault_recovery_backup', encryptedData);
        return true;
      }
      return await window.electronAPI.writeVault(encryptedData);
    } else {
      if (isRecoveryBackup) {
        localStorage.setItem('keyforge_vault_recovery_backup', encryptedData);
        return true;
      }
      localStorage.setItem('keyforge_vault', encryptedData);
      return true;
    }
  } catch (error) {
    console.error('Error writing vault');
    return false;
  }
}

export async function readVaultWithRecovery(
  masterPassword: string,
  recoveryKey?: string
): Promise<Vault | null> {
  if (recoveryKey && (!masterPassword || masterPassword === recoveryKey)) {
    try {
      let encryptedData: string | null = null;
      
      if (isElectron() && window.electronAPI) {
        encryptedData = localStorage.getItem('keyforge_vault_recovery_backup');
      } else {
        encryptedData = localStorage.getItem('keyforge_vault_recovery_backup');
      }
      
      if (encryptedData) {
        const encrypted: EncryptedData = JSON.parse(encryptedData);
        const decrypted = await decrypt(encrypted, recoveryKey);
        const vault = JSON.parse(decrypted) as Vault;
        
        clearSensitiveString(decrypted);
        
        if (vault.entries && !vault.passwords) {
          vault.passwords = vault.entries;
          delete vault.entries;
        }
        
        return vault;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  let vault = await readVault(masterPassword);
  
  if (!vault && recoveryKey && masterPassword !== recoveryKey) {
    try {
      let encryptedData: string | null = null;
      
      if (isElectron() && window.electronAPI) {
        encryptedData = localStorage.getItem('keyforge_vault_recovery_backup');
      } else {
        encryptedData = localStorage.getItem('keyforge_vault_recovery_backup');
      }
      
      if (encryptedData) {
        const encrypted: EncryptedData = JSON.parse(encryptedData);
        const decrypted = await decrypt(encrypted, recoveryKey);
        vault = JSON.parse(decrypted) as Vault;
        
        clearSensitiveString(decrypted);
        
        if (vault.entries && !vault.passwords) {
          vault.passwords = vault.entries;
          delete vault.entries;
        }
      }
    } catch (error) {
      return null;
    }
  }
  
  return vault;
}

export async function vaultExists(): Promise<boolean> {
  if (isElectron() && window.electronAPI) {
    return await window.electronAPI.vaultExists();
  } else {
    return localStorage.getItem('keyforge_vault') !== null;
  }
}

export function createEmptyVault(): Vault {
  return {
    passwords: [],
    folders: [],
    version: VAULT_VERSION,
  };
}

export async function setMasterPasswordHash(password: string): Promise<void> {
  const hash = await hashPassword(password);
  localStorage.setItem('keyforge_master_hash', hash);
}

export async function verifyMasterPasswordHash(
  password: string
): Promise<boolean> {
  const hash = await hashPassword(password);
  const storedHash = localStorage.getItem('keyforge_master_hash');
  return hash === storedHash;
}

export async function clearAllData(): Promise<boolean> {
  try {
    if (isElectron() && window.electronAPI) {
      await window.electronAPI.clearVault();
    }
    
    const keysToRemove: string[] = [
      'keyforge_vault',
      'keyforge_vault_recovery_backup',
      'keyforge_master_hash',
      'keyforge_recovery_hash',
      'keyforge_auto_import',
      'keyforge_auto_import_browser',
      'keyforge_auto_import_file_path',
      'keyforge_auto_import_interval',
      'keyforge_auto_import_custom_hours',
      'keyforge_color_mode',
      'keyforge_color_scheme',
      'keyforge_theme',
      'keyforge_background_gradient',
      'keyforge_close_to_tray',
      'keyforge_last_update_check',
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    const rateLimitPrefix = 'keyforge_rate_limit_';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(rateLimitPrefix)) {
        localStorage.removeItem(key);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
}