import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Copy, RefreshCw, Check } from 'lucide-react';
import { generatePassword, calculatePasswordStrength } from '@/utils/crypto';
import { clearSensitiveString } from '@/utils/clipboard';
import { ContextMenu } from './ContextMenu';
import { t } from '@/utils/i18n';

interface PasswordGeneratorProps {
  onClose: () => void;
  onSelect: (password: string) => void;
  standalone?: boolean;
}

export function PasswordGenerator({ onClose, onSelect, standalone = false }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [customCharset, setCustomCharset] = useState('');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: HTMLInputElement } | null>(null);
  const [, setLanguageKey] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageKey(prev => prev + 1);
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
      clearSensitiveString(password);
    };
  }, [password]);

  const generate = useCallback(() => {
    try {
      const generated = generatePassword({
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar,
        excludeAmbiguous,
        customCharset: customCharset.trim(),
      });
      setPassword(generated);
      setCopied(false);
    } catch (error) {
      alert(t('generator.selectType'));
    }
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeAmbiguous, customCharset]);

  const handleCopy = async () => {
    if (!password) return;
    const { copyToClipboard } = await import('@/utils/clipboard');
    const success = await copyToClipboard(password, true);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUse = () => {
    if (password) {
      onSelect(password);
    }
  };

  useEffect(() => {
    generate();
  }, [generate]);

  const strength = password ? calculatePasswordStrength(password) : 0;
  const strengthColor =
    strength >= 70 ? 'bg-green-500' : strength >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  const strengthLabel =
    strength >= 70 ? t('generator.strength.strong') : strength >= 40 ? t('generator.strength.medium') : t('generator.strength.weak');

  const handleContextMenu = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      target: e.currentTarget,
    });
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
      } else if (action === 'cut' && selectedText) {
        await copyToClipboard(selectedText, false);
        const newValue = target.value.substring(0, start) + target.value.substring(end);
        setCustomCharset(newValue);
      } else if (action === 'paste') {
        const text = await navigator.clipboard.readText();
        const newValue = target.value.substring(0, start) + text + target.value.substring(end);
        setCustomCharset(newValue);
        setTimeout(() => {
          target.setSelectionRange(start + text.length, start + text.length);
        }, 0);
      }
    } catch (err) {
      console.error('Context menu action failed:', err);
    }
  };

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={modalRef} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.target === modalRef.current && onClose()}>
      <div ref={contentRef} className="rounded-xl p-6 w-full max-w-md shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('generator.title')}</h3>
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
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('generator.generatedPassword')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={password}
                readOnly
                className="input-field pr-20 font-mono text-sm"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  title={t('form.copy')}
                >
                  {copied ? (
                    <Check className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={generate}
                  className="p-2 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  title={t('generator.regenerate')}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{t('generator.strength')}: {strengthLabel}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{strength}%</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                  <div
                    className={`${strengthColor} h-2 rounded-full transition-all`}
                    style={{ width: `${strength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('generator.length')}: {length}
            </label>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => {
                setLength(Number(e.target.value));
                generate();
              }}
              className="w-full"
              style={{
                accentColor: 'var(--color-primary)',
              }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              <span>8</span>
              <span>64</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('generator.characterTypes')}
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => {
                  setIncludeUppercase(e.target.checked);
                  generate();
                }}
                className="w-4 h-4 rounded"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{t('generator.uppercase')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => {
                  setIncludeLowercase(e.target.checked);
                  generate();
                }}
                className="w-4 h-4 rounded"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{t('generator.lowercase')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => {
                  setIncludeNumbers(e.target.checked);
                  generate();
                }}
                className="w-4 h-4 rounded"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{t('generator.numbers')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => {
                  setIncludeSymbols(e.target.checked);
                  generate();
                }}
                className="w-4 h-4 rounded"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{t('generator.symbols')}</span>
            </label>
          </div>

          <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('generator.advancedOptions')}
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeSimilar}
                onChange={(e) => {
                  setExcludeSimilar(e.target.checked);
                  generate();
                }}
                className="w-4 h-4 rounded"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{t('generator.excludeSimilar')}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => {
                  setExcludeAmbiguous(e.target.checked);
                  generate();
                }}
                className="w-4 h-4 rounded"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}
              />
              <span style={{ color: 'var(--text-primary)' }}>{t('generator.excludeAmbiguous')}</span>
            </label>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('generator.customChars')}
              </label>
              <input
                type="text"
                value={customCharset}
                onChange={(e) => {
                  setCustomCharset(e.target.value);
                  generate();
                }}
                onContextMenu={handleContextMenu}
                placeholder={t('generator.customCharsPlaceholder')}
                className="input-field text-sm"
                maxLength={50}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t('generator.customCharsDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button onClick={onClose} className="btn-secondary">
              {standalone ? t('form.close') : t('form.cancel')}
            </button>
            {standalone && (
              <button
                onClick={handleCopy}
                disabled={!password}
                className="btn-secondary"
              >
                {t('generator.copyPassword')}
              </button>
            )}
            <button
              onClick={standalone ? () => onSelect(password) : handleUse}
              disabled={!password}
              className="btn-primary"
            >
              {standalone ? t('generator.useInNewEntry') : t('generator.usePassword')}
            </button>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCopy={() => handleContextMenuAction('copy')}
          onCut={() => handleContextMenuAction('cut')}
          onPaste={() => handleContextMenuAction('paste')}
          canCopy={!!(contextMenu.target.selectionStart !== null && contextMenu.target.selectionEnd !== null && contextMenu.target.selectionStart !== contextMenu.target.selectionEnd)}
          canCut={!!(contextMenu.target.selectionStart !== null && contextMenu.target.selectionEnd !== null && contextMenu.target.selectionStart !== contextMenu.target.selectionEnd)}
          canPaste={true}
        />
      )}
    </div>
  );
}
