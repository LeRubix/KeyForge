import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Lock, Download, Key, Settings, Grid3x3, List, LayoutGrid } from 'lucide-react';
import { useVault } from '@/hooks/useVault';
import { PasswordEntryList } from './PasswordEntryList';
import { PasswordEntryForm } from './PasswordEntryForm';
import { PasswordGenerator } from './PasswordGenerator';
import { ImportDialog } from './ImportDialog';
import { PasswordEntry } from '@/utils/storage';
import { initializeTheme } from '@/utils/theme';
import { SettingsDialog } from './SettingsDialog';
import { ErrorToast } from './ErrorToast';
import { t } from '@/utils/i18n';

interface VaultScreenProps {
  masterPassword: string;
  onLogout: () => void;
}

export type SortOption = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'username-asc';
export type ViewMode = 'grid' | 'compact' | 'expanded';

export function VaultScreen({ masterPassword, onLogout }: VaultScreenProps) {
  const { vault, loading, addEntry, addEntries, updateEntry, deleteEntry } = useVault(masterPassword);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('compact');
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [, setLanguageKey] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384); // 96 * 4 = 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const MIN_SIDEBAR_WIDTH = 300; // Slightly smaller than current 384px

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageKey(prev => prev + 1);
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  const passwords = vault?.passwords || (vault as any)?.entries || [];
  
  const filteredAndSortedPasswords = useMemo(() => {
    if (!vault) return [];
    
    const query = searchQuery.toLowerCase();
    let filtered = passwords.filter(
      (entry: PasswordEntry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.username.toLowerCase().includes(query) ||
        entry.url?.toLowerCase().includes(query) ||
        entry.notes?.toLowerCase().includes(query)
    );

    // Separate pinned and unpinned entries
    const pinned = filtered.filter((e: PasswordEntry) => e.pinned);
    const unpinned = filtered.filter((e: PasswordEntry) => !e.pinned);

    // Sort each group
    const sortEntries = (entries: PasswordEntry[]) => {
      return [...entries].sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return a.title.localeCompare(b.title);
          case 'name-desc':
            return b.title.localeCompare(a.title);
          case 'date-newest':
            return b.updatedAt - a.updatedAt;
          case 'date-oldest':
            return a.updatedAt - b.updatedAt;
          case 'username-asc':
            return a.username.localeCompare(b.username);
          default:
            return 0;
        }
      });
    };

    return [...sortEntries(pinned), ...sortEntries(unpinned)];
  }, [vault, searchQuery, passwords, sortOption]);

  const handleAddEntry = () => {
    setSelectedEntry(null);
    setIsCreatingNew(true);
    setShowForm(true);
  };

  const handleViewEntry = (entry: PasswordEntry) => {
    setSelectedEntry(entry);
    setShowForm(true);
  };

  const handleCopyPassword = async (password: string) => {
    const { copyToClipboard } = await import('@/utils/clipboard');
    await copyToClipboard(password, true);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSaveEntry = async (entryData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedEntry) {
        const success = await updateEntry(selectedEntry.id, entryData);
        if (success) {
          setIsCreatingNew(false);
          setShowForm(false);
          setSelectedEntry(null);
        }
      } else {
        const success = await addEntry(entryData);
        if (success) {
          setShowForm(false);
          setSelectedEntry(null);
          setIsCreatingNew(false);
          setGeneratedPassword('');
        }
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  useEffect(() => {
    if (vault && selectedEntry && !isCreatingNew && showForm) {
      const updated = (vault.passwords || (vault as any)?.entries || []).find((p: PasswordEntry) => p.id === selectedEntry.id);
      if (updated && updated.updatedAt !== selectedEntry.updatedAt) {
        setSelectedEntry(updated);
      }
    }
  }, [vault, selectedEntry, showForm, isCreatingNew]);

  // Sidebar resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, MIN_SIDEBAR_WIDTH]);

  const handleTogglePin = async (id: string) => {
    const entry = passwords.find((p: PasswordEntry) => p.id === id);
    if (entry) {
      await updateEntry(id, { pinned: !entry.pinned });
    }
  };

  const handleDeleteEntry = async (id: string) => {
            if (confirm(t('form.deleteConfirm'))) {
      await deleteEntry(id);
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
        setShowForm(false);
      }
    }
  };

  if (loading || !vault) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-xl" style={{ color: 'var(--text-primary)' }}>{t('vault.loading')}</div>
      </div>
    );
  }

  return (
    <>
      {copySuccess && <ErrorToast message={t('form.copySuccess')} onClose={() => setCopySuccess(false)} type="success" />}
      <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div 
          ref={sidebarRef}
          className="flex flex-col relative" 
          style={{ 
            width: `${sidebarWidth}px`,
            backgroundColor: 'var(--bg-surface)', 
            borderRight: '1px solid var(--border-color)',
            minWidth: `${MIN_SIDEBAR_WIDTH}px`,
          }}
        >
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-gradient, var(--color-primary))', backgroundColor: 'var(--color-primary-gradient, var(--color-primary))' }}>
                <Key className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>KeyForge</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="w-8 h-8 flex items-center justify-center rounded transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                title={t('vault.settings')}
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="w-8 h-8 flex items-center justify-center rounded transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                title={t('vault.lock')}
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleAddEntry}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('vault.addPassword')}
            </button>
            <button
              onClick={() => setShowGenerator(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              {t('vault.generatePassword')}
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('vault.import')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('vault.searchPlaceholder')}
              className="input-field pl-10 text-sm"
            />
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {filteredAndSortedPasswords.length} {filteredAndSortedPasswords.length === 1 ? t('vault.password') : t('vault.passwords')}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="input-field text-sm py-2 px-3 cursor-pointer appearance-none pr-8"
                style={{
                  backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYgOEwwIDBIMTJINloiIGZpbGw9InZhcigtLXRleHQtc2Vjb25kYXJ5KSIvPjwvc3ZnPg==')`,
                  backgroundSize: '12px 8px',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <option value="name-asc">{t('vault.sort.nameAsc')}</option>
                <option value="name-desc">{t('vault.sort.nameDesc')}</option>
                <option value="date-newest">{t('vault.sort.newest')}</option>
                <option value="date-oldest">{t('vault.sort.oldest')}</option>
                <option value="username-asc">{t('vault.sort.usernameAsc')}</option>
              </select>
              <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'text-white' : ''}`}
                  style={{
                    backgroundColor: viewMode === 'grid' ? 'var(--color-primary)' : 'transparent',
                    color: viewMode === 'grid' ? 'white' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'grid') {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'grid') {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                  title={t('vault.view.grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'compact' ? 'text-white' : ''}`}
                  style={{
                    backgroundColor: viewMode === 'compact' ? 'var(--color-primary)' : 'transparent',
                    color: viewMode === 'compact' ? 'white' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'compact') {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'compact') {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                  title={t('vault.view.compact')}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('expanded')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'expanded' ? 'text-white' : ''}`}
                  style={{
                    backgroundColor: viewMode === 'expanded' ? 'var(--color-primary)' : 'transparent',
                    color: viewMode === 'expanded' ? 'white' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'expanded') {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'expanded') {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                  title={t('vault.view.expanded')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <PasswordEntryList
            entries={filteredAndSortedPasswords}
            selectedId={selectedEntry?.id}
            onSelect={handleViewEntry}
            onDelete={handleDeleteEntry}
            onCopyPassword={handleCopyPassword}
            onTogglePin={handleTogglePin}
            viewMode={viewMode}
          />
        </div>
        {/* Resize handle */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
          style={{
            backgroundColor: isResizing ? 'var(--color-primary)' : 'transparent',
          }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {showForm ? (
          <PasswordEntryForm
            key={isCreatingNew && generatedPassword ? `new-${generatedPassword}-${Date.now()}` : selectedEntry?.id || 'new'}
            entry={selectedEntry}
            onSave={handleSaveEntry}
          onCancel={() => {
            setShowForm(false);
            setSelectedEntry(null);
            setIsCreatingNew(false);
            setGeneratedPassword('');
          }}
            onGeneratePassword={() => {}}
            initialPassword={generatedPassword}
            isViewMode={!!selectedEntry}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
              <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{t('vault.selectPassword')}</p>
              <p className="text-sm mt-2">{t('vault.createNew')}</p>
            </div>
          </div>
        )}
      </div>

      {showGenerator && (
        <PasswordGenerator
          onClose={() => {
            setShowGenerator(false);
            setGeneratedPassword('');
          }}
          onSelect={(password) => {
            setGeneratedPassword(password);
            setShowGenerator(false);
            setSelectedEntry(null);
            setIsCreatingNew(true);
            setShowForm(true);
          }}
          standalone={true}
        />
      )}

      {showSettings && (
        <SettingsDialog
          onClose={() => setShowSettings(false)}
          masterPassword={masterPassword}
          onLogout={onLogout}
        />
      )}

      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onImport={async (entries) => {
            await addEntries(entries);
            setShowImport(false);
          }}
        />
      )}
      </div>
    </>
  );
}
