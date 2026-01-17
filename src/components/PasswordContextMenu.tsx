import { useEffect, useRef, useState, useCallback } from 'react';
import { Pin, Copy, Trash2, Folder, ChevronRight } from 'lucide-react';
import { PasswordFolder } from '@/utils/storage';
import { t } from '@/utils/i18n';

interface PasswordContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onPin: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onMoveToFolder?: (folderId: string | null) => void;
  onRemoveFromFolder?: () => void;
  isPinned: boolean;
  currentFolderId?: string | null;
  folders?: PasswordFolder[];
}

const SUBMENU_CLOSE_DELAY = 220;

export function PasswordContextMenu({
  x,
  y,
  onClose,
  onPin,
  onCopy,
  onDelete,
  onMoveToFolder,
  onRemoveFromFolder,
  isPinned,
  currentFolderId,
  folders = [],
}: PasswordContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);

  const scheduleSubmenuClose = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setShowFolderSubmenu(false);
      closeTimeoutRef.current = null;
    }, SUBMENU_CLOSE_DELAY);
  }, []);

  const cancelSubmenuClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && !(submenuRef.current?.contains(event.target as Node))) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [onClose]);

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  useEffect(() => {
    if (showFolderSubmenu && submenuRef.current && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const submenuRect = submenuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      let submenuX = menuRect.right;
      let submenuY = menuRect.top;

      if (submenuX + submenuRect.width > viewportWidth) {
        submenuX = menuRect.left - submenuRect.width;
      }

      submenuRef.current.style.left = `${submenuX}px`;
      submenuRef.current.style.top = `${submenuY}px`;
    }
  }, [showFolderSubmenu]);

  const handlePin = () => {
    onPin();
    onClose();
  };

  const handleCopy = () => {
    onCopy();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleMoveToFolder = (folderId: string | null) => {
    if (onMoveToFolder) {
      onMoveToFolder(folderId);
    }
    onClose();
  };

  const handleRemoveFromFolder = () => {
    if (onRemoveFromFolder) {
      onRemoveFromFolder();
    }
    onClose();
  };

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-[9999] rounded-lg shadow-2xl overflow-hidden min-w-[150px] animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
        <div className="py-1">
          <button
            type="button"
            onClick={handlePin}
            className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
            style={{
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Pin className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} />
            {isPinned ? t('vault.unpin') : t('vault.pin')}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
            style={{
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Copy className="w-4 h-4" />
            {t('form.copyPassword')}
          </button>
          {onMoveToFolder && (
            <div
              className="relative"
              onMouseEnter={() => {
                cancelSubmenuClose();
                setShowFolderSubmenu(true);
              }}
              onMouseLeave={scheduleSubmenuClose}
            >
              <button
                type="button"
                className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between gap-2"
                style={{
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  {t('vault.moveToFolder')}
                </div>
                <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} aria-hidden />
              </button>
              {showFolderSubmenu && (
                <div
                  ref={submenuRef}
                  className="fixed z-[10000] rounded-lg shadow-2xl overflow-hidden min-w-[180px] animate-in fade-in slide-in-from-left-2 duration-200"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                  }}
                  onMouseEnter={() => {
                    cancelSubmenuClose();
                    setShowFolderSubmenu(true);
                  }}
                  onMouseLeave={scheduleSubmenuClose}
                >
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => handleMoveToFolder(null)}
                      className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
                      style={{
                        color: !currentFolderId ? 'var(--color-primary)' : 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {t('vault.noFolder')}
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => handleMoveToFolder(folder.id)}
                        className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
                        style={{
                          color: currentFolderId === folder.id ? 'var(--color-primary)' : 'var(--text-primary)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded flex-shrink-0"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {onRemoveFromFolder && currentFolderId && (
            <button
              type="button"
              onClick={handleRemoveFromFolder}
              className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
              style={{
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Folder className="w-4 h-4" />
              {t('vault.removeFromFolder')}
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2"
            style={{
              color: '#ef4444',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Trash2 className="w-4 h-4" />
            {t('form.delete')}
          </button>
        </div>
      </div>
    </>
  );
}
