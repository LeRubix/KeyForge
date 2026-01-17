import { useState, useEffect, useCallback } from 'react';
import {
  Vault,
  PasswordEntry,
  readVault,
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
      const loadedVault = await readVault(masterPassword);
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

  return {
    vault,
    loading,
    error,
    addEntry,
    addEntries,
    updateEntry,
    deleteEntry,
    reloadVault: loadVault,
  };
}
