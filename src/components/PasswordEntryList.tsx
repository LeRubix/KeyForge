import { useState, useEffect } from 'react';
import { Trash2, Globe, User, Copy } from 'lucide-react';
import { PasswordEntry } from '@/utils/storage';
import { ViewMode } from './VaultScreen';
import { t } from '@/utils/i18n';

interface PasswordEntryListProps {
  entries: PasswordEntry[];
  selectedId?: string;
  onSelect: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onCopyPassword?: (password: string) => void;
  viewMode?: ViewMode;
}

export function PasswordEntryList({
  entries,
  selectedId,
  onSelect,
  onDelete,
  onCopyPassword,
  viewMode = 'compact',
}: PasswordEntryListProps) {
  const [, setLanguageKey] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageKey(prev => prev + 1);
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  if (entries.length === 0) {
    return (
      <div className="text-center text-sm py-8" style={{ color: 'var(--text-secondary)' }}>
        {t('vault.noPasswords')}
      </div>
    );
  }

  const getBaseClasses = (isSelected: boolean) => `
    rounded-lg cursor-pointer transition-all border
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

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {entries.map((entry) => {
          const isSelected = selectedId === entry.id;
          return (
            <div
              key={entry.id}
              onClick={() => onSelect(entry)}
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
                <div className="font-medium truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                  {entry.title || t('form.untitled')}
                </div>
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
    );
  }

  if (viewMode === 'expanded') {
    return (
      <div className="space-y-3">
        {entries.map((entry) => {
          const isSelected = selectedId === entry.id;
          return (
            <div
              key={entry.id}
              onClick={() => onSelect(entry)}
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
                  <div className="font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                    {entry.title || t('form.untitled')}
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
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isSelected = selectedId === entry.id;
        return (
          <div
            key={entry.id}
            onClick={() => onSelect(entry)}
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
                <div className="font-medium truncate mb-1" style={{ color: 'var(--text-primary)' }}>
                  {entry.title || t('form.untitled')}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {entry.username && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="truncate">{entry.username}</span>
                    </div>
                  )}
                  {entry.url && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{entry.url}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
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
  );
}
