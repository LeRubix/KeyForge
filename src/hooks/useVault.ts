import { useState, useEffect, useCallback } from 'react';
import {
  Vault,
  PasswordEntry,
  PasswordFolder,
  readVault,
  readVaultWithRecovery,
  writeVault,
  createEmptyVault,
} from '@/utils/storage';

export function useVault(masterPassword: string | null) {
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVault = useCallback(async () => {
    if (!masterPassword) {
      setVault(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let loadedVault = await readVault(masterPassword);
      
      if (!loadedVault) {
        const storedRecoveryHash = localStorage.getItem('keyforge_recovery_hash');
        if (storedRecoveryHash) {
          loadedVault = await readVaultWithRecovery(masterPassword, masterPassword);
        }
      }
      
      if (loadedVault) {
        setVault(loadedVault);
      } else {
        setVault(createEmptyVault());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault');
      setVault(null);
    } finally {
      setLoading(false);
    }
  }, [masterPassword]);

  const saveVault = useCallback(
    async (updatedVault: Vault) => {
      if (!masterPassword) {
        setError('Master password not set');
        return false;
      }

      try {
        const success = await writeVault(updatedVault, masterPassword);
        if (success) {
          setVault(updatedVault);
          return true;
        } else {
          setError('Failed to save vault');
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save vault');
        return false;
      }
    },
    [masterPassword]
  );

  const addEntry = useCallback(
    async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!vault || !masterPassword) return false;

      const newEntry: PasswordEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedVault: Vault = {
        ...vault,
        passwords: [...(vault.passwords || vault.entries || []), newEntry],
      };

      return await saveVault(updatedVault);
    },
    [vault, masterPassword, saveVault]
  );

  const addEntries = useCallback(
    async (entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => {
      if (!vault || !masterPassword) return false;

      const newEntries: PasswordEntry[] = entries.map(entry => ({
        ...entry,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      const updatedVault: Vault = {
        ...vault,
        passwords: [...(vault.passwords || vault.entries || []), ...newEntries],
      };

      return await saveVault(updatedVault);
    },
    [vault, masterPassword, saveVault]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<PasswordEntry>) => {
      if (!vault || !masterPassword) return false;

      const updatedVault: Vault = {
        ...vault,
        passwords: (vault.passwords || vault.entries || []).map((entry) =>
          entry.id === id
            ? { ...entry, ...updates, updatedAt: Date.now() }
            : entry
        ),
      };

      return await saveVault(updatedVault);
    },
    [vault, masterPassword, saveVault]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!vault || !masterPassword) return false;

      const updatedVault: Vault = {
        ...vault,
        passwords: (vault.passwords || vault.entries || []).filter((entry) => entry.id !== id),
      };

      return await saveVault(updatedVault);
    },
    [vault, masterPassword, saveVault]
  );

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  const addFolder = useCallback(
    async (name: string, color: string) => {
      if (!vault || !masterPassword) return false;

      const newFolder: PasswordFolder = {
        id: crypto.randomUUID(),
        name,
        color,
        expanded: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedVault: Vault = {
        ...vault,
        folders: [...(vault.folders || []), newFolder],
      };

      return await saveVault(updatedVault);
    },
    [vault, masterPassword, saveVault]
  );

  const updateFolder = useCallback(
    async (id: string, updates: Partial<PasswordFolder>) => {
      if (!vault || !masterPassword) return false;

      const updatedVault: Vault = {
        ...vault,
        folders: (vault.folders || []).map((folder) =>
          folder.id === id
            ? { ...folder, ...updates, updatedAt: Date.now() }
            : folder
        ),
      };

      return await saveVault(updatedVault);
    },
    [vault, masterPassword, saveVault]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      if (!vault || !masterPassword) return false;

      const updatedPasswords = (vault.passwords || vault.entries || []).map((entry) => {
        if (entry.folderId === id) {
          const { folderId, ...entryWithoutFolder } = entry;
          return entryWithoutFolder;
        }
        return entry;
      });

      const updatedVault: Vault = {
        ...vault,
        folders: (vault.folders || []).filter((folder) => folder.id !== id),
        passwords: updatedPasswords,
      };

      return await saveVault(updatedVault);
    },
    [vault, masterPassword, saveVault]
  );

  const moveEntriesToFolder = useCallback(
    async (entryIds: string[], folderId: string | null) => {
      if (!vault || !masterPassword) return false;

      const updatedVault: Vault = {
        ...vault,
        passwords: (vault.passwords || vault.entries || []).map((entry) => {
          if (entryIds.includes(entry.id)) {
            return {
              ...entry,
              folderId: folderId || undefined,
              updatedAt: Date.now(),
            };
          }
          return entry;
        }),
      };

      return await saveVault(updatedVault);
    },
    [vault, masterPassword, saveVault]
  );

  const removeEntriesFromFolder = useCallback(
    async (entryIds: string[]) => {
      if (!vault || !masterPassword) return false;

      const updatedVault: Vault = {
        ...vault,
        passwords: (vault.passwords || vault.entries || []).map((entry) => {
          if (entryIds.includes(entry.id) && entry.folderId) {
            const { folderId, ...entryWithoutFolder } = entry;
            return {
              ...entryWithoutFolder,
              updatedAt: Date.now(),
            };
          }
          return entry;
        }),
      };

      return await saveVault(updatedVault);
    },
    [vault, masterPassword, saveVault]
  );

  return {
    vault,
    loading,
    error,
    addEntry,
    addEntries,
    updateEntry,
    deleteEntry,
    addFolder,
    updateFolder,
    deleteFolder,
    moveEntriesToFolder,
    removeEntriesFromFolder,
    reloadVault: loadVault,
  };
}
