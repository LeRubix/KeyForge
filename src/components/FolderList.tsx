import { useState, useMemo, memo } from 'react';
import { ChevronRight, ChevronDown, Folder, Edit2, Trash2, Palette } from 'lucide-react';
import { PasswordFolder, PasswordEntry } from '@/utils/storage';
import { PasswordEntryList } from './PasswordEntryList';
import { ViewMode } from './VaultScreen';
import { t } from '@/utils/i18n';

interface FolderListProps {
  folders: PasswordFolder[];
  entries: PasswordEntry[];
  selectedId?: string;
  selectedIds?: string[];
  onSelect: (entry: PasswordEntry, event?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onCopyPassword?: (password: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleFolder: (folderId: string) => void;
  onUpdateFolder?: (folderId: string, updates: Partial<PasswordFolder>) => Promise<void>;
  onDeleteFolder?: (folderId: string) => void;
  onMoveToFolder?: (entryId: string, folderId: string | null) => void;
  onRemoveFromFolder?: (entryId: string) => void;
  viewMode?: ViewMode;
}

const FOLDER_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#f97316',
  '#ef4444',
  '#14b8a6',
  '#f472b6',
  '#fbbf24',
];

const FolderItem = memo(({
  folder,
  folderEntries,
  selectedId,
  selectedIds,
  onSelect,
  onDelete,
  onCopyPassword,
  onTogglePin,
  onToggleFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveToFolder,
  onRemoveFromFolder,
  folders,
  viewMode,
  editingFolder,
  editName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
}: {
  folder: PasswordFolder;
  folderEntries: PasswordEntry[];
  selectedId?: string;
  selectedIds: string[];
  onSelect: (entry: PasswordEntry, event?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onCopyPassword?: (password: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleFolder: (folderId: string) => void;
  onUpdateFolder?: (folderId: string, updates: Partial<PasswordFolder>) => Promise<void>;
  onDeleteFolder?: (folderId: string) => void;
  onMoveToFolder?: (entryId: string, folderId: string | null) => void;
  onRemoveFromFolder?: (entryId: string) => void;
  folders: PasswordFolder[];
  viewMode: ViewMode;
  editingFolder: string | null;
  editName: string;
  onStartEdit: (folder: PasswordFolder) => void;
  onSaveEdit: (folderId: string, name: string) => Promise<void>;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        className="flex items-center gap-2 p-3 cursor-pointer transition-colors"
        onClick={() => onToggleFolder(folder.id)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
        }}
        style={{ borderBottom: folder.expanded ? '1px solid var(--border-color)' : 'none' }}
      >
        <div className="transition-transform duration-200" style={{ transform: folder.expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          {folder.expanded ? (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          )}
        </div>
        <div
          className="w-4 h-4 rounded flex-shrink-0"
          style={{ backgroundColor: folder.color }}
        />
        {editingFolder === folder.id ? (
          <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onBlur={() => onSaveEdit(folder.id, editName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveEdit(folder.id, editName);
                } else if (e.key === 'Escape') {
                  onCancelEdit();
                }
              }}
              className="flex-1 input-field text-sm"
              autoFocus
            />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 rounded transition-colors"
                style={{
                  backgroundColor: showColorPicker ? 'var(--bg-surface-hover)' : 'transparent',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (!showColorPicker) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
              {showColorPicker && (
                <div
                  className="absolute top-full right-0 mt-1 p-2 rounded-lg shadow-xl z-10"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-4 gap-2">
                    {FOLDER_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={async () => {
                          if (onUpdateFolder) {
                            await onUpdateFolder(folder.id, { color });
                            setShowColorPicker(false);
                          }
                        }}
                        className="w-8 h-8 rounded transition-all duration-200 hover:scale-110"
                        style={{
                          backgroundColor: color,
                          border: folder.color === color ? '2px solid var(--text-primary)' : '2px solid var(--border-color)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="flex-1 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {folder.name} <span style={{ color: 'var(--text-secondary)' }}>({folderEntries.length})</span>
          </span>
        )}
        {onDeleteFolder && editingFolder !== folder.id && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onStartEdit(folder)}
              className="p-1 transition-colors rounded"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDeleteFolder(folder.id)}
              className="p-1 transition-colors rounded"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: folder.expanded ? '10000px' : '0',
          opacity: folder.expanded ? 1 : 0,
          transition: 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
            {folder.expanded && (
              <div className="animate-in fade-in duration-200">
                <div className="p-2">
                  {folderEntries.length > 0 ? (
                    <PasswordEntryList
                      entries={folderEntries}
                      selectedId={selectedId}
                      selectedIds={selectedIds}
                      onSelect={onSelect}
                      onDelete={onDelete}
                      onCopyPassword={onCopyPassword}
                      onTogglePin={onTogglePin}
                      onMoveToFolder={onMoveToFolder}
                      onRemoveFromFolder={onRemoveFromFolder}
                      folders={folders}
                      viewMode={viewMode}
                    />
                  ) : (
                    <div className="text-center py-8 text-sm animate-in fade-in duration-300" style={{ color: 'var(--text-secondary)' }}>
                      <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>{t('vault.folderEmpty')}</p>
                    </div>
                  )}
                </div>
                <div className="h-px w-full flex-shrink-0" style={{ backgroundColor: folder.color }} aria-hidden />
              </div>
            )}
      </div>
    </div>
  );
});

FolderItem.displayName = 'FolderItem';

export const FolderList = memo(function FolderList({
  folders,
  entries,
  selectedId,
  selectedIds = [],
  onSelect,
  onDelete,
  onCopyPassword,
  onTogglePin,
  onToggleFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveToFolder,
  onRemoveFromFolder,
  viewMode = 'compact',
}: FolderListProps) {
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleEditFolder = (folder: PasswordFolder) => {
    setEditingFolder(folder.id);
    setEditName(folder.name);
  };

  const handleSaveEdit = async (folderId: string, name: string) => {
    if (name.trim() && onUpdateFolder) {
      await onUpdateFolder(folderId, { name: name.trim() });
    }
    setEditingFolder(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingFolder(null);
    setEditName('');
  };

  const { entriesByFolder, entriesWithoutFolder } = useMemo(() => {
    const byFolder = new Map<string, PasswordEntry[]>();
    const withoutFolder: PasswordEntry[] = [];

    entries.forEach(entry => {
      if (entry.folderId) {
        if (!byFolder.has(entry.folderId)) {
          byFolder.set(entry.folderId, []);
        }
        byFolder.get(entry.folderId)!.push(entry);
      } else {
        withoutFolder.push(entry);
      }
    });

    return { entriesByFolder: byFolder, entriesWithoutFolder: withoutFolder };
  }, [entries]);

  return (
    <div className="space-y-2">
      {folders.map(folder => {
        const folderEntries = entriesByFolder.get(folder.id) || [];
        return (
          <FolderItem
            key={folder.id}
            folder={folder}
            folderEntries={folderEntries}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onDelete={onDelete}
            onCopyPassword={onCopyPassword}
            onTogglePin={onTogglePin}
            onToggleFolder={onToggleFolder}
            onUpdateFolder={onUpdateFolder}
            onDeleteFolder={onDeleteFolder}
            onMoveToFolder={onMoveToFolder}
            onRemoveFromFolder={onRemoveFromFolder}
            folders={folders}
            viewMode={viewMode}
            editingFolder={editingFolder}
            editName={editName}
            onStartEdit={handleEditFolder}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onEditNameChange={setEditName}
          />
        );
      })}

      {entriesWithoutFolder.length > 0 && (
        <div className="animate-in fade-in duration-200">
          <PasswordEntryList
            entries={entriesWithoutFolder}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onDelete={onDelete}
            onCopyPassword={onCopyPassword}
            onTogglePin={onTogglePin}
            onMoveToFolder={onMoveToFolder}
            onRemoveFromFolder={onRemoveFromFolder}
            folders={folders}
            viewMode={viewMode}
          />
        </div>
      )}
    </div>
  );
});
