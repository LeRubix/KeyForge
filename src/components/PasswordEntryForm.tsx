import { useState, useEffect } from 'react';
import { Save, X, Eye, EyeOff, Copy, RefreshCw, ExternalLink, Pencil } from 'lucide-react';
import { PasswordEntry } from '@/utils/storage';
import { generatePassword } from '@/utils/crypto';
import { PasswordGenerator } from './PasswordGenerator';
import { ErrorToast } from './ErrorToast';
import { ContextMenu } from './ContextMenu';
import { clearSensitiveString } from '@/utils/clipboard';
import { t } from '@/utils/i18n';
import { validateUrl } from '@/utils/security';
import { getColorScheme } from '@/utils/theme';

interface PasswordEntryFormProps {
  entry: PasswordEntry | null;
  onSave: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  onGeneratePassword: () => void;
  initialPassword?: string;
  isViewMode?: boolean;
}

export function PasswordEntryForm({
  entry,
  onSave,
  onCancel,
  onGeneratePassword: _onGeneratePassword,
  initialPassword,
  isViewMode: initialViewMode = false,
}: PasswordEntryFormProps) {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(initialPassword || '');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(!entry || !initialViewMode);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: HTMLInputElement | HTMLTextAreaElement } | null>(null);
  const [, setLanguageKey] = useState(0);
  
  const [lastInitialPassword, setLastInitialPassword] = useState(initialPassword);

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageKey(prev => prev + 1);
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setUsername(entry.username);
      setPassword(entry.password);
      setUrl(entry.url || '');
      setNotes(entry.notes || '');
      setIsEditMode(!initialViewMode);
      setLastInitialPassword('');
    } else {
      setTitle('');
      setUsername('');
      setUrl('');
      setNotes('');
      setIsEditMode(true);
      if (initialPassword) {
        setPassword(initialPassword);
        setLastInitialPassword(initialPassword);
      } else {
        setPassword('');
        setLastInitialPassword('');
      }
    }
  }, [entry, initialViewMode]);

  useEffect(() => {
    if (!entry && initialPassword && initialPassword !== lastInitialPassword) {
      setPassword(initialPassword);
      setLastInitialPassword(initialPassword);
    }
  }, [initialPassword, entry, lastInitialPassword]);
  
  useEffect(() => {
    return () => {
      if (entry?.password) {
        clearSensitiveString(entry.password);
      }
      if (initialPassword) {
        clearSensitiveString(initialPassword);
      }
    };
  }, [entry, initialPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode) return;
    if (!title.trim()) {
      setError(t('form.error.titleRequired'));
      return;
    }
    if (!username.trim()) {
      setError(t('form.error.usernameRequired'));
      return;
    }
    if (!password.trim()) {
      setError(t('form.error.passwordRequired'));
      return;
    }
    
    setError(null);
    try {
      await onSave({
        title,
        username,
        password,
        url: url || undefined,
        notes: notes || undefined,
      });
      if (!entry) {
        onCancel();
      } else {
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      setError(t('form.error.saveFailed'));
    }
  };

  const handleCopy = async () => {
    const { copyToClipboard } = await import('@/utils/clipboard');
    const success = await copyToClipboard(password, true);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleQuickGenerate = () => {
    const generated = generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
    setPassword(generated);
  };

  const handleOpenUrl = () => {
    if (url) {
      const validatedUrl = validateUrl(url);
      if (validatedUrl) {
        window.open(validatedUrl, '_blank', 'noopener,noreferrer');
      } else {
        setError('Invalid URL. Please enter a valid web address.');
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    if (isEditMode) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        target: e.currentTarget,
      });
    }
  };

  const handleContextMenuAction = async (action: 'copy' | 'cut' | 'paste') => {
    if (!contextMenu) return;

    const target = contextMenu.target;
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    const selectedText = target.value.substring(start, end);

    try {
      const { copyToClipboard } = await import('@/utils/clipboard');
      if (action === 'copy' && selectedText) {
        await copyToClipboard(selectedText, false);
      } else if (action === 'cut' && selectedText && isEditMode) {
        await copyToClipboard(selectedText, false);
        const newValue = target.value.substring(0, start) + target.value.substring(end);
        if (target === document.activeElement) {
          if (target.name === 'title' || !target.name) {
            setTitle(newValue);
          } else if (target.name === 'username') {
            setUsername(newValue);
          } else if (target.name === 'url') {
            setUrl(newValue);
          } else if (target.name === 'notes') {
            setNotes(newValue);
          }
        }
      } else if (action === 'paste' && isEditMode) {
        const text = await navigator.clipboard.readText();
        const newValue = target.value.substring(0, start) + text + target.value.substring(end);
        if (target === document.activeElement) {
          if (target.name === 'title' || !target.name) {
            setTitle(newValue);
          } else if (target.name === 'username') {
            setUsername(newValue);
          } else if (target.name === 'url') {
            setUrl(newValue);
          } else if (target.name === 'notes') {
            setNotes(newValue);
          }
        }
        setTimeout(() => {
          target.setSelectionRange(start + text.length, start + text.length);
        }, 0);
      }
    } catch (err) {
      console.error('Context menu action failed:', err);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {entry ? (isEditMode ? t('form.editPassword') : t('form.viewPassword')) : t('form.newPassword')}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {entry ? (isEditMode ? t('form.updatePassword') : t('form.viewDetails')) : t('form.addNew')}
            </p>
          </div>

          {error && <ErrorToast message={error} onClose={() => setError(null)} />}
          
          <form onSubmit={handleSubmit} className="card space-y-6" noValidate>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('form.title')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onContextMenu={handleContextMenu}
                className="input-field"
                placeholder={t('form.placeholder.title')}
                disabled={!isEditMode}
                readOnly={!isEditMode}
                autoFocus={isEditMode && !entry}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('form.username')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onContextMenu={handleContextMenu}
                className="input-field"
                placeholder={t('form.placeholder.username')}
                disabled={!isEditMode}
                readOnly={!isEditMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('form.password')} <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-32"
                  placeholder={t('form.placeholder.password')}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-2 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    title={t('form.copyPassword')}
                  >
                    <Copy className={`w-4 h-4 ${copied ? 'text-green-400' : ''}`} />
                  </button>
                  {isEditMode && (
                    <>
                      <button
                        type="button"
                        onClick={handleQuickGenerate}
                        className="p-2 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                        title={t('form.quickGenerate')}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowGenerator(true)}
                        className="px-3 py-1 text-xs text-white rounded transition-colors"
                        style={getColorScheme() === 'cyan' ? {
                          background: 'var(--color-primary-gradient)',
                        } : {
                          backgroundColor: 'var(--color-primary)',
                        }}
                        onMouseEnter={(e) => {
                          if (getColorScheme() === 'cyan') {
                            e.currentTarget.style.background = 'var(--color-primary-gradient-hover)';
                          } else {
                            e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (getColorScheme() === 'cyan') {
                            e.currentTarget.style.background = 'var(--color-primary-gradient)';
                          } else {
                            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                          }
                        }}
                      >
                        {t('form.generate')}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              {copied && (
                <p className="text-xs text-green-400 mt-1">{t('form.copySuccess')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('form.url')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onContextMenu={handleContextMenu}
                  className="input-field pr-10"
                  placeholder={t('form.placeholder.url')}
                  disabled={!isEditMode}
                  readOnly={!isEditMode}
                />
                {url && (
                  <button
                    type="button"
                    onClick={handleOpenUrl}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors"
                    title={t('form.openUrl')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('form.notes')}
              </label>
              <textarea
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onContextMenu={handleContextMenu}
                className="input-field min-h-[100px] resize-none"
                placeholder={t('form.placeholder.notes')}
                disabled={!isEditMode}
                readOnly={!isEditMode}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              {isEditMode ? (
                <>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {t('form.cancel')}
                  </button>
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {t('form.save')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  {t('form.edit')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {showGenerator && (
        <PasswordGenerator
          onClose={() => setShowGenerator(false)}
          onSelect={(generatedPassword) => {
            setPassword(generatedPassword);
            setShowGenerator(false);
          }}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCopy={() => handleContextMenuAction('copy')}
          onCut={() => handleContextMenuAction('cut')}
          onPaste={() => handleContextMenuAction('paste')}
          canCopy={!!(contextMenu.target.selectionStart !== null && contextMenu.target.selectionEnd !== null && contextMenu.target.selectionStart !== contextMenu.target.selectionEnd)}
          canCut={isEditMode && !!(contextMenu.target.selectionStart !== null && contextMenu.target.selectionEnd !== null && contextMenu.target.selectionStart !== contextMenu.target.selectionEnd)}
          canPaste={isEditMode}
        />
      )}
    </>
  );
}
