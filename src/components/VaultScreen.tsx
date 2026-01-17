import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Lock, Download, Key, Settings, Grid3x3, List, LayoutGrid, Pin, Trash2, Folder, FolderPlus, X } from 'lucide-react';
import { useVault } from '@/hooks/useVault';
import { FolderList } from './FolderList';
import { FolderDialog } from './FolderDialog';
import { PasswordEntryForm } from './PasswordEntryForm';
import { PasswordGenerator } from './PasswordGenerator';
import { ImportDialog } from './ImportDialog';
import { PasswordEntry, PasswordFolder } from '@/utils/storage';
import { initializeTheme, getColorScheme } from '@/utils/theme';
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
  const { vault, loading, addEntry, addEntries, updateEntry, deleteEntry, addFolder, updateFolder, deleteFolder, moveEntriesToFolder, removeEntriesFromFolder } = useVault(masterPassword);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [showForm, setShowForm] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<PasswordFolder | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('keyforge_view_mode');
    return (saved as ViewMode) || 'compact';
  });
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [, setLanguageKey] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const MIN_SIDEBAR_WIDTH = 300;

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

    const pinned = filtered.filter((e: PasswordEntry) => e.pinned);
    const unpinned = filtered.filter((e: PasswordEntry) => !e.pinned);

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
    setSelectedIds(new Set());
    setIsCreatingNew(true);
    setShowForm(true);
  };

  const handleViewEntry = (entry: PasswordEntry, event?: React.MouseEvent) => {
    if (event) {
      const isCtrlClick = event.ctrlKey || event.metaKey;
      const isShiftClick = event.shiftKey;
      
      if (isCtrlClick || isShiftClick) {
        event.preventDefault();
        if (isCtrlClick) {
          const newSelectedIds = new Set(selectedIds);
          if (newSelectedIds.has(entry.id)) {
            newSelectedIds.delete(entry.id);
          } else {
            newSelectedIds.add(entry.id);
          }
          setSelectedIds(newSelectedIds);
          setLastSelectedIndex(filteredAndSortedPasswords.findIndex(e => e.id === entry.id));
        } else if (isShiftClick && lastSelectedIndex >= 0) {
          const currentIndex = filteredAndSortedPasswords.findIndex(e => e.id === entry.id);
          const start = Math.min(lastSelectedIndex, currentIndex);
          const end = Math.max(lastSelectedIndex, currentIndex);
          const newSelectedIds = new Set(selectedIds);
          for (let i = start; i <= end; i++) {
            newSelectedIds.add(filteredAndSortedPasswords[i].id);
          }
          setSelectedIds(newSelectedIds);
        }
        return;
      }
    }
    
    setSelectedIds(new Set());
    setSelectedEntry(entry);
    setShowForm(true);
    setLastSelectedIndex(filteredAndSortedPasswords.findIndex(e => e.id === entry.id));
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

  const handleTogglePinMultiple = async () => {
    if (selectedIds.size === 0) return;
    const idsArray = Array.from(selectedIds);
    for (const id of idsArray) {
      const entry = passwords.find((p: PasswordEntry) => p.id === id);
      if (entry) {
        await updateEntry(id, { pinned: !entry.pinned });
      }
    }
    setSelectedIds(new Set());
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm(t('form.deleteConfirm'))) {
      await deleteEntry(id);
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
        setShowForm(false);
      }
      const newSelectedIds = new Set(selectedIds);
      newSelectedIds.delete(id);
      setSelectedIds(newSelectedIds);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(t('form.deleteConfirm'))) {
      const idsArray = Array.from(selectedIds);
      for (const id of idsArray) {
        await deleteEntry(id);
      }
      if (selectedEntry && selectedIds.has(selectedEntry.id)) {
        setSelectedEntry(null);
        setShowForm(false);
      }
      setSelectedIds(new Set());
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
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div 
          ref={sidebarRef}
          className="flex flex-col relative h-full" 
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

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 pb-0 flex-shrink-0">
            <div className="text-center mb-3">
              <span className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>
                {filteredAndSortedPasswords.length} {filteredAndSortedPasswords.length === 1 ? t('vault.password') : t('vault.passwords')}
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('vault.searchPlaceholder')}
                className="input-field pl-10 text-sm"
                style={{ paddingRight: searchQuery ? '2.5rem' : undefined }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setShowFolderDialog(true);
                }}
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
                title={t('vault.newFolder')}
              >
                <FolderPlus className="w-4 h-4" />
              </button>
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
                  {(() => {
                    const isQuepal = getColorScheme() === 'cyan';
                    const getButtonStyle = (isActive: boolean) => {
                      if (isActive && isQuepal) {
                        return {
                          background: 'linear-gradient(to right, #11998e, #38ef7d)',
                          color: 'white',
                        };
                      } else if (isActive) {
                        return {
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                        };
                      }
                      return {
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                      };
                    };
                    return (
                      <>
                        <button
                          onClick={() => {
                            setViewMode('grid');
                            localStorage.setItem('keyforge_view_mode', 'grid');
                          }}
                          className="p-1.5 rounded transition-colors"
                          style={getButtonStyle(viewMode === 'grid')}
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
                          onClick={() => {
                            setViewMode('compact');
                            localStorage.setItem('keyforge_view_mode', 'compact');
                          }}
                          className="p-1.5 rounded transition-colors"
                          style={getButtonStyle(viewMode === 'compact')}
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
                          onClick={() => {
                            setViewMode('expanded');
                            localStorage.setItem('keyforge_view_mode', 'expanded');
                          }}
                          className="p-1.5 rounded transition-colors"
                          style={getButtonStyle(viewMode === 'expanded')}
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
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-0 min-h-0">
            <FolderList
              folders={vault?.folders || []}
              entries={filteredAndSortedPasswords}
              selectedId={selectedEntry?.id}
              selectedIds={Array.from(selectedIds)}
              onSelect={handleViewEntry}
              onDelete={handleDeleteEntry}
              onCopyPassword={handleCopyPassword}
              onTogglePin={handleTogglePin}
              onToggleFolder={async (folderId) => {
                const folder = vault?.folders?.find(f => f.id === folderId);
                if (folder) {
                  await updateFolder(folderId, { expanded: !folder.expanded });
                }
              }}
              onUpdateFolder={async (folderId: string, updates: Partial<PasswordFolder>) => {
                await updateFolder(folderId, updates);
              }}
              onDeleteFolder={async (folderId: string) => {
                if (confirm(t('vault.deleteFolderConfirm'))) {
                  await deleteFolder(folderId);
                }
              }}
              onMoveToFolder={async (entryId: string, folderId: string | null) => {
                await moveEntriesToFolder([entryId], folderId);
              }}
              onRemoveFromFolder={async (entryId: string) => {
                await removeEntriesFromFolder([entryId]);
              }}
              viewMode={viewMode}
            />
          </div>
        </div>
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
          style={{
            backgroundColor: isResizing ? 'var(--color-primary)' : 'transparent',
          }}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden h-full">
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
            folders={vault?.folders || []}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
            <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
              <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{t('vault.selectPassword')}</p>
              <p className="text-sm mt-2">{t('vault.createNew')}</p>
            </div>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2), 0 0 0 1px var(--border-color)',
          }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {selectedIds.size} {selectedIds.size === 1 ? t('vault.password') : t('vault.passwords')} {t('vault.selected')}
          </span>
          <div className="w-px h-5" style={{ backgroundColor: 'var(--border-color)' }} />
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePinMultiple}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              title={t('vault.pin')}
            >
              <Pin className="w-4 h-4" />
            </button>
            {vault?.folders && vault.folders.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowFolderMenu(!showFolderMenu)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  title={t('vault.moveToFolder')}
                >
                  <Folder className="w-4 h-4" />
                </button>
                {showFolderMenu && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-xl shadow-xl min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-200"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
                  >
                    <button
                      onClick={async () => {
                        await moveEntriesToFolder(Array.from(selectedIds), null);
                        setSelectedIds(new Set());
                        setShowFolderMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {t('vault.noFolder')}
                    </button>
                    {vault.folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={async () => {
                          await moveEntriesToFolder(Array.from(selectedIds), folder.id);
                          setSelectedIds(new Set());
                          setShowFolderMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: folder.color }} />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleDeleteMultiple}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#ef4444' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              title={t('form.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setSelectedIds(new Set()); setShowFolderMenu(false); }}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              title={t('form.cancel')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

      {showFolderDialog && (
        <FolderDialog
          onClose={() => {
            setShowFolderDialog(false);
            setEditingFolder(null);
          }}
          onSave={async (name, color) => {
            if (editingFolder) {
              await updateFolder(editingFolder.id, { name, color });
            } else {
              await addFolder(name, color);
            }
            setShowFolderDialog(false);
            setEditingFolder(null);
          }}
          folder={editingFolder}
        />
      )}
      </div>
    </>
  );
}
