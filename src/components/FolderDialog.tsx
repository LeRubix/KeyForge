import { useState, useEffect, useRef } from 'react';
import { X, Folder } from 'lucide-react';
import { PasswordFolder } from '@/utils/storage';
import { t } from '@/utils/i18n';

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

interface FolderDialogProps {
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;
  folder?: PasswordFolder | null;
}

export function FolderDialog({ onClose, onSave, folder }: FolderDialogProps) {
  const [name, setName] = useState(folder?.name || '');
  const [selectedColor, setSelectedColor] = useState(folder?.color || FOLDER_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
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
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('vault.folderNameRequired'));
      return;
    }

    setSaving(true);
    try {
      await onSave(name.trim(), selectedColor);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('vault.folderSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={(e) => e.target === modalRef.current && onClose()}
    >
      <div
        ref={contentRef}
        className="rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: selectedColor }}
            >
              <Folder className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {folder ? t('vault.editFolder') : t('vault.createFolder')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('vault.folderName')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder={t('vault.folderNamePlaceholder')}
                disabled={saving}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                {t('vault.folderColor')}
              </label>
              <div className="grid grid-cols-4 gap-3">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="relative w-full aspect-square rounded-lg transition-all duration-200 hover:scale-110"
                    style={{
                      backgroundColor: color,
                      border: selectedColor === color ? '3px solid var(--text-primary)' : '2px solid var(--border-color)',
                      boxShadow: selectedColor === color ? '0 0 0 2px var(--bg-surface), 0 0 0 4px var(--text-primary)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedColor !== color) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedColor !== color) {
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {selectedColor === color && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white opacity-90" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#ef4444',
                }}
              >
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={saving}
              >
                {t('form.cancel')}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving || !name.trim()}
              >
                {saving ? t('form.saving') : (folder ? t('form.save') : t('vault.createFolder'))}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
