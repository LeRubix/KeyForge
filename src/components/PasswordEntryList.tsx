import { useState, useEffect } from 'react';
import { Trash2, Globe, User, Copy, Pin } from 'lucide-react';
import { PasswordEntry, PasswordFolder } from '@/utils/storage';
import { ViewMode } from './VaultScreen';
import { PasswordContextMenu } from './PasswordContextMenu';
import { t } from '@/utils/i18n';

interface PasswordEntryListProps {
  entries: PasswordEntry[];
  selectedId?: string;
  selectedIds?: string[];
  onSelect: (entry: PasswordEntry, event?: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onCopyPassword?: (password: string) => void;
  onTogglePin?: (id: string) => void;
  onMoveToFolder?: (entryId: string, folderId: string | null) => void;
  onRemoveFromFolder?: (entryId: string) => void;
  folders?: PasswordFolder[];
  viewMode?: ViewMode;
}

export function PasswordEntryList({
  entries,
  selectedId,
  selectedIds = [],
  onSelect,
  onDelete,
  onCopyPassword,
  onTogglePin,
  onMoveToFolder,
  onRemoveFromFolder,
  folders = [],
  viewMode = 'compact',
}: PasswordEntryListProps) {
  const [, setLanguageKey] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: PasswordEntry } | null>(null);
  const safeSelectedIds = selectedIds || [];

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageKey(prev => prev + 1);
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  if (entries.length === 0) {
    return (
      <>
        <div className="text-center text-sm py-8" style={{ color: 'var(--text-secondary)' }}>
          {t('vault.noPasswords')}
        </div>
        {contextMenu && (
          <PasswordContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onPin={() => onTogglePin?.(contextMenu.entry.id)}
            onCopy={() => onCopyPassword?.(contextMenu.entry.password)}
            onDelete={() => onDelete(contextMenu.entry.id)}
            onMoveToFolder={onMoveToFolder ? (folderId) => onMoveToFolder(contextMenu.entry.id, folderId) : undefined}
            onRemoveFromFolder={onRemoveFromFolder && contextMenu.entry.folderId ? () => onRemoveFromFolder(contextMenu.entry.id) : undefined}
            isPinned={contextMenu.entry.pinned || false}
            currentFolderId={contextMenu.entry.folderId || null}
            folders={folders}
          />
        )}
      </>
    );
  }

  const getBaseClasses = (isSelected: boolean) => `
    rounded-lg cursor-pointer transition-all border select-none
    ${isSelected ? '' : 'border-transparent'}
  `;
  
  const getBaseStyles = (isSelected: boolean) => {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    };
    const rgb = hexToRgb(primaryColor);
    
    return {
      backgroundColor: isSelected ? (rgb ? `rgba(${rgb}, 0.2)` : 'var(--bg-surface)') : 'var(--bg-surface)',
      borderColor: isSelected ? 'var(--color-primary)' : 'transparent',
    };
  };

  const handleContextMenu = (e: React.MouseEvent, entry: PasswordEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  const handleClick = (e: React.MouseEvent, entry: PasswordEntry) => {
    onSelect(entry, e);
  };

  if (viewMode === 'grid') {
    return (
      <>
        <div className="grid grid-cols-2 gap-3">
          {entries.map((entry) => {
            const isSelected = selectedId === entry.id || safeSelectedIds.includes(entry.id);
            return (
              <div
                key={entry.id}
                onClick={(e) => handleClick(e, entry)}
                onContextMenu={(e) => handleContextMenu(e, entry)}
                className={`${getBaseClasses(isSelected)} p-4`}
                style={getBaseStyles(isSelected)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {entry.pinned && (
                    <Pin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-primary)' }} fill="currentColor" />
                  )}
                  <div className="font-medium truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                    {entry.title || t('form.untitled')}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onTogglePin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(entry.id);
                      }}
                      className="transition-colors p-1 flex-shrink-0"
                      style={{ color: entry.pinned ? 'var(--color-primary)' : 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = entry.pinned ? 'var(--color-primary)' : 'var(--text-secondary)';
                      }}
                      title={entry.pinned ? t('vault.unpin') : t('vault.pin')}
                    >
                      <Pin className="w-3 h-3" fill={entry.pinned ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(entry.id);
                    }}
                    className="transition-colors p-1 flex-shrink-0"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {entry.username && (
                <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  <User className="w-3 h-3 inline mr-1" />
                  {entry.username}
                </div>
              )}
            </div>
          );
        })}
        </div>
        {contextMenu && (
          <PasswordContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onPin={() => onTogglePin?.(contextMenu.entry.id)}
            onCopy={() => onCopyPassword?.(contextMenu.entry.password)}
            onDelete={() => onDelete(contextMenu.entry.id)}
            onMoveToFolder={onMoveToFolder ? (folderId) => onMoveToFolder(contextMenu.entry.id, folderId) : undefined}
            onRemoveFromFolder={onRemoveFromFolder && contextMenu.entry.folderId ? () => onRemoveFromFolder(contextMenu.entry.id) : undefined}
            isPinned={contextMenu.entry.pinned || false}
            currentFolderId={contextMenu.entry.folderId || null}
            folders={folders}
          />
        )}
      </>
    );
  }

  if (viewMode === 'expanded') {
    return (
      <>
        <div className="space-y-3">
          {entries.map((entry) => {
            const isSelected = selectedId === entry.id || safeSelectedIds.includes(entry.id);
            return (
              <div
                key={entry.id}
                onClick={(e) => handleClick(e, entry)}
                onContextMenu={(e) => handleContextMenu(e, entry)}
                className={`${getBaseClasses(isSelected)} p-4`}
                style={getBaseStyles(isSelected)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {entry.pinned && (
                      <Pin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} fill="currentColor" />
                    )}
                    <div className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                      {entry.title || t('form.untitled')}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {entry.username && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        <span>{entry.username}</span>
                      </div>
                    )}
                    {entry.url && (
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Globe className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        <span className="truncate">{entry.url}</span>
                      </div>
                    )}
                    {entry.notes && (
                      <div className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onTogglePin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(entry.id);
                      }}
                      className="transition-colors p-2 flex-shrink-0"
                      style={{ color: entry.pinned ? 'var(--color-primary)' : 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = entry.pinned ? 'var(--color-primary)' : 'var(--text-secondary)';
                      }}
                      title={entry.pinned ? t('vault.unpin') : t('vault.pin')}
                    >
                      <Pin className="w-4 h-4" fill={entry.pinned ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  {onCopyPassword && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyPassword(entry.password);
                      }}
                      className="transition-colors p-2 flex-shrink-0"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                      title={t('form.copyPassword')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(entry.id);
                    }}
                    className="transition-colors p-2 flex-shrink-0"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    title={t('form.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
        {contextMenu && (
          <PasswordContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onPin={() => onTogglePin?.(contextMenu.entry.id)}
            onCopy={() => onCopyPassword?.(contextMenu.entry.password)}
            onDelete={() => onDelete(contextMenu.entry.id)}
            onMoveToFolder={onMoveToFolder ? (folderId) => onMoveToFolder(contextMenu.entry.id, folderId) : undefined}
            onRemoveFromFolder={onRemoveFromFolder && contextMenu.entry.folderId ? () => onRemoveFromFolder(contextMenu.entry.id) : undefined}
            isPinned={contextMenu.entry.pinned || false}
            currentFolderId={contextMenu.entry.folderId || null}
            folders={folders}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {entries.map((entry) => {
          const isSelected = selectedId === entry.id || safeSelectedIds.includes(entry.id);
          return (
            <div
              key={entry.id}
              onClick={(e) => handleClick(e, entry)}
              onContextMenu={(e) => handleContextMenu(e, entry)}
              className={`${getBaseClasses(isSelected)} p-3`}
              style={getBaseStyles(isSelected)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              }
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {entry.pinned && (
                    <Pin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-primary)' }} fill="currentColor" />
                  )}
                  <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {entry.title || t('form.untitled')}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs min-w-0" style={{ color: 'var(--text-secondary)' }}>
                  {entry.username && (
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{entry.username}</span>
                    </div>
                  )}
                  {entry.url && (
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{entry.url}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onTogglePin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(entry.id);
                    }}
                    className="transition-colors p-1 flex-shrink-0"
                    style={{ color: entry.pinned ? 'var(--color-primary)' : 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = entry.pinned ? 'var(--color-primary)' : 'var(--text-secondary)';
                    }}
                    title={entry.pinned ? t('vault.unpin') : t('vault.pin')}
                  >
                    <Pin className="w-3 h-3" fill={entry.pinned ? 'currentColor' : 'none'} />
                  </button>
                )}
                {onCopyPassword && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyPassword(entry.password);
                    }}
                    className="transition-colors p-1 flex-shrink-0"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    title={t('form.copyPassword')}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.id);
                  }}
                  className="transition-colors p-1"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  title={t('form.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      </div>
      {contextMenu && (
        <PasswordContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onPin={() => onTogglePin?.(contextMenu.entry.id)}
          onCopy={() => onCopyPassword?.(contextMenu.entry.password)}
          onDelete={() => onDelete(contextMenu.entry.id)}
          onMoveToFolder={onMoveToFolder ? (folderId) => onMoveToFolder(contextMenu.entry.id, folderId) : undefined}
          onRemoveFromFolder={onRemoveFromFolder && contextMenu.entry.folderId ? () => onRemoveFromFolder(contextMenu.entry.id) : undefined}
          isPinned={contextMenu.entry.pinned || false}
          currentFolderId={contextMenu.entry.folderId || null}
          folders={folders}
        />
      )}
    </>
  );
}
