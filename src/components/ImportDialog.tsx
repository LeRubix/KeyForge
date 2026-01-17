import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, FileText, Key, Clock } from 'lucide-react';
import { importFromFile, normalizeImportedEntries, BrowserPassword } from '@/utils/browserImport';
import { PasswordEntry } from '@/utils/storage';
import { t } from '@/utils/i18n';
import { validateFilePath } from '@/utils/security';
import { getColorScheme } from '@/utils/theme';

interface ImportDialogProps {
  onClose: () => void;
  onImport: (entries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

type BrowserType = 'chrome' | 'firefox' | 'edge';
type TimeInterval = '3h' | '6h' | '12h' | '1d' | '3d' | '1w' | '2w' | '1m' | '3m' | '6m' | '1y' | 'custom';

const timeIntervalOptions: { value: TimeInterval; labelKey: string; hours: number }[] = [
  { value: '3h', labelKey: 'import.interval.3h', hours: 3 },
  { value: '6h', labelKey: 'import.interval.6h', hours: 6 },
  { value: '12h', labelKey: 'import.interval.12h', hours: 12 },
  { value: '1d', labelKey: 'import.interval.1d', hours: 24 },
  { value: '3d', labelKey: 'import.interval.3d', hours: 72 },
  { value: '1w', labelKey: 'import.interval.1w', hours: 168 },
  { value: '2w', labelKey: 'import.interval.2w', hours: 336 },
  { value: '1m', labelKey: 'import.interval.1m', hours: 720 },
  { value: '3m', labelKey: 'import.interval.3m', hours: 2160 },
  { value: '6m', labelKey: 'import.interval.6m', hours: 4320 },
  { value: '1y', labelKey: 'import.interval.1y', hours: 8760 },
  { value: 'custom', labelKey: 'import.interval.custom', hours: 0 },
];

export function ImportDialog({ onClose, onImport }: ImportDialogProps) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<BrowserPassword[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLanguageKey] = useState(0);
  const [autoImport, setAutoImport] = useState(localStorage.getItem('keyforge_auto_import') === 'true');
  const [selectedBrowser, setSelectedBrowser] = useState<BrowserType>(
    (localStorage.getItem('keyforge_auto_import_browser') as BrowserType) || 'chrome'
  );
  const [filePath, setFilePath] = useState<string>(() => {
    return localStorage.getItem('keyforge_auto_import_file_path') || '';
  });
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(
    (localStorage.getItem('keyforge_auto_import_interval') as TimeInterval) || '1d'
  );
  const [customHours, setCustomHours] = useState<number>(() => {
    const saved = localStorage.getItem('keyforge_auto_import_custom_hours');
    return saved ? parseInt(saved, 10) : 24;
  });

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageKey(prev => prev + 1);
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setPreview([]);
    setSelectedEntries(new Set());

    try {
      const result = await importFromFile(file);
      
      if (result.success && result.entries.length > 0) {
        const normalized = normalizeImportedEntries(result.entries);
        setPreview(normalized);
        setSelectedEntries(new Set(normalized.map((_, i) => i)));
      } else {
        setError(result.errors.join(', ') || 'No entries found in file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  const handleToggleEntry = (index: number) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedEntries(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEntries.size === preview.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(preview.map((_, i) => i)));
    }
  };

  const handleImport = () => {
    const entriesToImport = preview.filter((_, i) => selectedEntries.has(i));
    
    const formattedEntries: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>[] = 
      entriesToImport.map(entry => ({
        title: entry.name,
        username: entry.username,
        password: entry.password,
        url: entry.url || undefined,
        notes: entry.notes || undefined,
      }));

    onImport(formattedEntries);
    onClose();
  };

  const handleAutoImportChange = (enabled: boolean) => {
    setAutoImport(enabled);
    localStorage.setItem('keyforge_auto_import', enabled.toString());
  };

  const handleBrowserChange = (browser: BrowserType) => {
    setSelectedBrowser(browser);
    localStorage.setItem('keyforge_auto_import_browser', browser);
    setFilePath('');
    localStorage.removeItem('keyforge_auto_import_file_path');
  };

  const handleFilePathChange = (path: string) => {
    if (path && !validateFilePath(path)) {
      return;
    }
    setFilePath(path);
    localStorage.setItem('keyforge_auto_import_file_path', path);
  };

  const getBrowserFilePathExample = (browser: BrowserType): string => {
    const os = navigator.platform.toLowerCase();
    if (os.includes('win')) {
      switch (browser) {
        case 'chrome':
          return 'C:\\Users\\YourUsername\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Login Data';
        case 'edge':
          return 'C:\\Users\\YourUsername\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Login Data';
        case 'firefox':
          return 'C:\\Users\\YourUsername\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\xxxxxxxx.default-release\\logins.json';
        default:
          return '';
      }
    } else if (os.includes('mac')) {
      switch (browser) {
        case 'chrome':
          return '~/Library/Application Support/Google/Chrome/Default/Login Data';
        case 'edge':
          return '~/Library/Application Support/Microsoft Edge/Default/Login Data';
        case 'firefox':
          return '~/Library/Application Support/Firefox/Profiles/xxxxxxxx.default-release/logins.json';
        default:
          return '';
      }
    } else {
      switch (browser) {
        case 'chrome':
          return '~/.config/google-chrome/Default/Login Data';
        case 'edge':
          return '~/.config/microsoft-edge/Default/Login Data';
        case 'firefox':
          return '~/.mozilla/firefox/xxxxxxxx.default-release/logins.json';
        default:
          return '';
      }
    }
  };

  const handleTimeIntervalChange = (interval: TimeInterval) => {
    setTimeInterval(interval);
    localStorage.setItem('keyforge_auto_import_interval', interval);
    if (interval !== 'custom') {
      const option = timeIntervalOptions.find(opt => opt.value === interval);
      if (option) {
        setCustomHours(option.hours);
        localStorage.setItem('keyforge_auto_import_custom_hours', option.hours.toString());
      }
    }
  };

  const handleCustomHoursChange = (hours: number) => {
    const clampedHours = Math.max(3, Math.min(8760, hours));
    setCustomHours(clampedHours);
    localStorage.setItem('keyforge_auto_import_custom_hours', clampedHours.toString());
  };

  const getNextImportTime = () => {
    if (!autoImport) return null;
    const hours = timeInterval === 'custom' ? customHours : timeIntervalOptions.find(opt => opt.value === timeInterval)?.hours || 24;
    const nextTime = new Date();
    nextTime.setHours(nextTime.getHours() + hours);
    return nextTime;
  };

  const nextImportTime = getNextImportTime();

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
      <div ref={contentRef} className="rounded-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('import.title')}</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {t('import.subtitle')}
            </p>
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
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('import.autoImport')}</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('import.enableAutoImport')}</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {t('import.autoImportDesc')}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoImport}
                    onChange={(e) => handleAutoImportChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div 
                    className="w-11 h-6 rounded-full peer transition-colors"
                    style={{
                      backgroundColor: autoImport ? 'var(--color-primary)' : 'var(--bg-surface)',
                    }}
                  >
                    <div 
                      className="w-5 h-5 rounded-full transition-transform bg-white"
                      style={{
                        transform: autoImport ? 'translateX(1.25rem)' : 'translateX(0.125rem)',
                        marginTop: '0.125rem',
                      }}
                    />
                  </div>
                </label>
              </div>

              {autoImport && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      {t('import.browser')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['chrome', 'firefox', 'edge'] as BrowserType[]).map((browser) => {
                        const isSelected = selectedBrowser === browser;
                        const isCyan = getColorScheme() === 'cyan';
                        return (
                          <button
                            key={browser}
                            type="button"
                            onClick={() => handleBrowserChange(browser)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize"
                            style={isSelected && isCyan ? {
                              background: 'var(--color-primary-gradient)',
                              color: 'white',
                              border: '1px solid transparent',
                            } : {
                              backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--bg-surface)',
                              color: isSelected ? 'white' : 'var(--text-primary)',
                              border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                            }}
                            onMouseEnter={(e) => {
                              if (isSelected && isCyan) {
                                e.currentTarget.style.background = 'var(--color-primary-gradient-hover)';
                              } else if (isSelected) {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isSelected && isCyan) {
                                e.currentTarget.style.background = 'var(--color-primary-gradient)';
                              } else if (isSelected) {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                              }
                            }}
                          >
                            {browser}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      {t('import.filePath')}
                    </label>
                    <input
                      type="text"
                      value={filePath}
                      onChange={(e) => handleFilePathChange(e.target.value)}
                      placeholder={getBrowserFilePathExample(selectedBrowser)}
                      className="input-field w-full"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {t('import.filePathDesc')}
                    </p>
                    <div className="mt-2 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)' }}>
                      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {t('import.examplePath')} ({selectedBrowser}):
                      </p>
                      <code className="block break-all" style={{ color: 'var(--text-secondary)' }}>
                        {getBrowserFilePathExample(selectedBrowser)}
                      </code>
                      <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                        {t('import.filePathNote')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      {t('import.interval')}
                    </label>
                    <select
                      value={timeInterval}
                      onChange={(e) => handleTimeIntervalChange(e.target.value as TimeInterval)}
                      className="input-field"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {timeIntervalOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>

                    {timeInterval === 'custom' && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                          {t('import.customHours')}
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="8760"
                          value={customHours}
                          onChange={(e) => handleCustomHoursChange(parseInt(e.target.value, 10) || 3)}
                          className="input-field"
                          style={{ color: 'var(--text-primary)' }}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {t('import.customHoursDesc')}
                        </p>
                      </div>
                    )}

                    {nextImportTime && (
                      <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Clock className="w-4 h-4" />
                        <span>{t('import.nextImport')}: {nextImportTime.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {preview.length === 0 && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center" style={{ borderColor: 'var(--border-color)' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <p className="mb-2" style={{ color: 'var(--text-primary)' }}>{t('import.selectFile')}</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {t('import.fileDesc')}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="btn-primary"
                style={getColorScheme() === 'cyan' ? {
                  background: 'var(--color-primary-gradient)',
                } : {}}
                onMouseEnter={(e) => {
                  if (getColorScheme() === 'cyan' && !importing) {
                    e.currentTarget.style.background = 'var(--color-primary-gradient-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (getColorScheme() === 'cyan' && !importing) {
                    e.currentTarget.style.background = 'var(--color-primary-gradient)';
                  }
                }}
              >
                {importing ? t('import.processing') : t('import.chooseFile')}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {preview.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p style={{ color: 'var(--text-primary)' }}>
                  {t('import.found')} {preview.length} {preview.length !== 1 ? t('vault.passwords') : t('vault.password')}
                </p>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  {selectedEntries.size === preview.length ? t('import.deselectAll') : t('import.selectAll')}
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {preview.map((entry, index) => (
                  <div
                    key={index}
                    onClick={() => handleToggleEntry(index)}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${selectedEntries.has(index) ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: selectedEntries.has(index) ? 'rgba(var(--color-primary-rgb, 59, 130, 246), 0.2)' : 'var(--bg-surface-hover)',
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedEntries.has(index)) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        style={{
                          width: '1.25rem',
                          height: '1.25rem',
                          borderRadius: '0.25rem',
                          border: `2px solid ${selectedEntries.has(index) ? 'var(--color-primary)' : 'var(--border-color)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '0.125rem',
                          backgroundColor: selectedEntries.has(index) ? 'var(--color-primary)' : 'transparent',
                        }}
                      >
                        {selectedEntries.has(index) && (
                          <Check className="w-3 h-3" style={{ color: 'white' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                          {entry.name}
                        </div>
                        <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                          {entry.url && (
                            <div className="flex items-center gap-1 truncate">
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{entry.url}</span>
                            </div>
                          )}
                          <div className="truncate">
                            <span style={{ color: 'var(--text-secondary)' }}>{t('import.user')}: </span>
                            {entry.username}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {preview.length > 0 && (
          <div className="flex items-center justify-end gap-3 pt-4 mt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button onClick={onClose} className="btn-secondary">
              {t('form.cancel')}
            </button>
            <button
              onClick={handleImport}
              disabled={selectedEntries.size === 0}
              className="btn-primary"
              style={getColorScheme() === 'cyan' ? {
                background: 'var(--color-primary-gradient)',
              } : {}}
              onMouseEnter={(e) => {
                if (getColorScheme() === 'cyan' && selectedEntries.size > 0) {
                  e.currentTarget.style.background = 'var(--color-primary-gradient-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (getColorScheme() === 'cyan' && selectedEntries.size > 0) {
                  e.currentTarget.style.background = 'var(--color-primary-gradient)';
                }
              }}
            >
              {t('import.import')} {selectedEntries.size} {selectedEntries.size !== 1 ? t('vault.passwords') : t('vault.password')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
