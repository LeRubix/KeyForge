import { useState, useEffect, useRef } from 'react';
import { X, Moon, Sun, Slash, Palette, Lock, Key, AlertTriangle, Copy, Eye, EyeOff, ChevronDown, Globe, Download, CheckCircle, Trash2 } from 'lucide-react';
import { ColorMode, ColorScheme, getColorMode, getColorScheme, saveColorMode, saveColorScheme, applyTheme, getThemeColorsByMode } from '@/utils/theme';
import { readVault, writeVault, clearAllData } from '@/utils/storage';
import { generateRecoveryPhrase, recoveryPhraseToKey } from '@/utils/recovery';
import { validateMasterPassword } from '@/utils/passwordValidation';
import { hashPassword } from '@/utils/crypto';
import { languages, getLanguage, saveLanguage, Language, t } from '@/utils/i18n';
import { FlagIcon } from './FlagIcon';
import { checkForUpdates, getCurrentVersion, UpdateInfo } from '@/utils/updates';

interface SettingsDialogProps {
  onClose: () => void;
  masterPassword: string;
  onLogout: () => void;
}

export function SettingsDialog({ onClose, masterPassword, onLogout }: SettingsDialogProps) {
  const [colorMode, setColorMode] = useState<ColorMode>(getColorMode());
  const [colorScheme, setColorScheme] = useState<ColorScheme>(getColorScheme());
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string[] | null>(null);
  const [recoveryPhraseShown, setRecoveryPhraseShown] = useState(false);
  const [closeToTray, setCloseToTray] = useState(localStorage.getItem('keyforge_close_to_tray') === 'true');
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getLanguage());
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateChecked, setUpdateChecked] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [clearDataConfirmText, setClearDataConfirmText] = useState('');
  const currentVersion = getCurrentVersion();

  const [, setLanguageKey] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(getLanguage());
      setLanguageKey(prev => prev + 1);
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  useEffect(() => {
    const checkUpdate = async () => {
      const lastCheck = localStorage.getItem('keyforge_last_update_check');
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (lastCheck && (now - parseInt(lastCheck, 10)) < oneDay) {
        return;
      }
      
      setTimeout(async () => {
        setCheckingUpdate(true);
        try {
          const update = await checkForUpdates(currentVersion);
          if (update) {
            setUpdateInfo(update);
          }
          setUpdateChecked(true);
          localStorage.setItem('keyforge_last_update_check', now.toString());
        } catch (error) {
          console.error('Update check failed:', error);
        } finally {
          setCheckingUpdate(false);
        }
      }, 100);
    };

    checkUpdate();
  }, [currentVersion]);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  useEffect(() => {
    applyTheme(colorMode, colorScheme);
  }, [colorMode, colorScheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLanguageDropdown]);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    saveLanguage(lang);
    setShowLanguageDropdown(false);
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
  };

  const handleColorModeChange = (mode: ColorMode) => {
    setColorMode(mode);
    saveColorMode(mode);
    applyTheme(mode, colorScheme);
  };

  const handleColorSchemeChange = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    saveColorScheme(scheme);
    applyTheme(colorMode, scheme);
  };

  const handleCloseToTrayChange = (enabled: boolean) => {
    setCloseToTray(enabled);
    localStorage.setItem('keyforge_close_to_tray', enabled.toString());
    if (window.electronAPI) {
      window.electronAPI.setCloseToTray(enabled);
    }
  };

  const handleGenerateRecoveryPhrase = async () => {
    const phrase = generateRecoveryPhrase();
    setRecoveryPhrase(phrase);
    setRecoveryPhraseShown(true);
    const phraseKey = await recoveryPhraseToKey(phrase);
    localStorage.setItem('keyforge_recovery_hash', phraseKey);
    try {
      const vault = await readVault(masterPassword);
      if (vault) {
        vault.recoveryPhraseHash = phraseKey;
        await writeVault(vault, masterPassword);
        await writeVault(vault, phraseKey, true);
        const { clearSensitiveString } = await import('@/utils/clipboard');
        setTimeout(() => {
          clearSensitiveString(phraseKey);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to set up recovery phrase');
    }
  };

  const handleChangePassword = async () => {
    setChangePasswordError(null);
    if (currentPassword !== masterPassword) {
      setChangePasswordError(t('settings.passwordError.incorrect'));
      return;
    }

    const validation = validateMasterPassword(newPassword);
    if (!validation.valid) {
      setChangePasswordError(validation.errors.join('. '));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError(t('settings.passwordError.mismatch'));
      return;
    }

    setChangePasswordLoading(true);

    try {
      const vault = await readVault(masterPassword);
      if (!vault) {
        setChangePasswordError(t('settings.passwordError.readFailed'));
        setChangePasswordLoading(false);
        return;
      }

      const success = await writeVault(vault, newPassword);
      if (success) {
        const hash = await hashPassword(newPassword);
        localStorage.setItem('keyforge_master_hash', hash);
        const { clearSensitiveString } = await import('@/utils/clipboard');
        alert(t('settings.passwordChanged'));
        setTimeout(() => {
          clearSensitiveString(currentPassword);
          clearSensitiveString(newPassword);
          clearSensitiveString(confirmNewPassword);
        }, 100);
        onLogout();
      } else {
        setChangePasswordError(t('settings.passwordError.saveFailed'));
      }
    } catch (error) {
      setChangePasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleCopyRecoveryPhrase = async () => {
    if (recoveryPhrase) {
      const { copyToClipboard } = await import('@/utils/clipboard');
      await copyToClipboard(recoveryPhrase.join(' '), true);
    }
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateInfo(null);
    try {
      const update = await checkForUpdates(currentVersion);
      if (update) {
        setUpdateInfo(update);
      } else {
        setUpdateInfo(null);
      }
      setUpdateChecked(true);
      localStorage.setItem('keyforge_last_update_check', Date.now().toString());
    } catch (error) {
      console.error('Update check failed:', error);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleDownloadInstaller = () => {
    if (!updateInfo) return;
    const installer = updateInfo.assets.find(a => 
      a.name.toLowerCase().includes('.exe') && 
      !a.name.toLowerCase().includes('portable')
    );
    if (installer) {
      window.open(installer.browser_download_url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(updateInfo.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadPortable = () => {
    if (!updateInfo) return;
    const portable = updateInfo.assets.find(a => 
      a.name.toLowerCase().includes('portable')
    );
    if (portable) {
      window.open(portable.browser_download_url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(updateInfo.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClearAllData = async () => {
    if (!showClearDataConfirm) {
      setShowClearDataConfirm(true);
      setClearDataConfirmText('');
      return;
    }

    if (clearDataConfirmText.trim().toUpperCase() !== 'DELETE') {
      return;
    }

    const success = await clearAllData();
    if (success) {
      alert(t('settings.clearData.success'));
      onLogout();
      window.location.reload();
    } else {
      alert(t('settings.clearData.failed'));
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
    <div ref={modalRef} className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={(e) => e.target === modalRef.current && onClose()}>
      <div ref={contentRef} className="rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('settings.title')}</h3>
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

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.language')}</h4>
            </div>
            <div className="relative" ref={languageDropdownRef}>
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-surface-hover)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }}
              >
                <div className="flex items-center gap-3">
                  <FlagIcon languageCode={currentLanguage} size={24} />
                  <span className="text-sm">{languages.find(l => l.code === currentLanguage)?.name}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLanguageDropdown && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-xl overflow-hidden z-50"
                  style={{ 
                    backgroundColor: 'var(--bg-surface)', 
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{ 
                        color: 'var(--text-primary)',
                        backgroundColor: currentLanguage === lang.code ? 'var(--bg-surface-hover)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (currentLanguage !== lang.code) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentLanguage !== lang.code) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <FlagIcon languageCode={lang.code} size={24} />
                      <span className="text-sm">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
                <Moon className="w-5 h-5" />
                <Slash className="w-4 h-4" />
                <Sun className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.theme')}</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['dark', 'light', 'darkBlue', 'grey'] as ColorMode[]).map((mode) => {
                const colors = getThemeColorsByMode(mode, colorScheme);
                return (
                  <button
                    key={mode}
                    onClick={() => handleColorModeChange(mode)}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${colorMode === mode
                        ? 'border-primary-500 ring-2 ring-primary-500/50'
                        : 'border-slate-600 hover:border-slate-500'
                      }
                    `}
                  >
                    <div
                      className="w-full h-12 rounded mb-2"
                      style={{ backgroundColor: colors.background }}
                    />
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t(`settings.theme.${mode}`)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.colorScheme')}</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(() => {
                const schemes: ColorScheme[] = ['blue', 'cyan', 'green', 'navy', 'orange', 'pink', 'purple', 'red', 'teal', 'yellow'];
                const sorted = schemes.sort((a, b) => {
                  if (a === 'cyan') return -1;
                  if (b === 'cyan') return 1;
                  return a.localeCompare(b);
                });
                return sorted;
              })().map((scheme) => {
                const colors = getThemeColorsByMode(colorMode, scheme);
                const isGradient = scheme === 'cyan';
                return (
                  <button
                    key={scheme}
                    onClick={() => handleColorSchemeChange(scheme)}
                    className="p-4 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: colorScheme === scheme ? 'var(--color-primary)' : 'var(--border-color)',
                      boxShadow: colorScheme === scheme ? '0 0 0 2px var(--color-primary)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (colorScheme !== scheme) {
                        e.currentTarget.style.borderColor = 'var(--bg-surface-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (colorScheme !== scheme) {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }
                    }}
                  >
                    <div
                      className="w-full h-12 rounded mb-2"
                      style={isGradient 
                        ? { background: 'linear-gradient(to right, #11998e, #38ef7d)' }
                        : { backgroundColor: colors.primary }
                      }
                    />
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t(`settings.colorScheme.${scheme}`)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.system')}</h4>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
              <div>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('settings.closeToTray')}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {t('settings.closeToTrayDesc')}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={closeToTray}
                  onChange={(e) => handleCloseToTrayChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div 
                  className="w-11 h-6 rounded-full peer transition-colors"
                  style={{
                    backgroundColor: closeToTray ? 'var(--color-primary)' : 'var(--bg-surface)',
                  }}
                >
                  <div 
                    className="w-5 h-5 rounded-full transition-transform bg-white"
                    style={{
                      transform: closeToTray ? 'translateX(1.25rem)' : 'translateX(0.125rem)',
                      marginTop: '0.125rem',
                    }}
                  />
                </div>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.changePassword')}</h4>
            </div>
            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="btn-primary w-full"
              >
                {t('settings.changePassword')}
              </button>
            ) : (
              <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    {t('settings.currentPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder={t('settings.currentPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    {t('form.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field pr-10"
                      placeholder={t('settings.newPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2">
                      {validateMasterPassword(newPassword).errors.map((error, i) => (
                        <div key={i} className="text-xs text-red-400">{error}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    {t('settings.confirmNewPassword')}
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="input-field"
                    placeholder={t('settings.confirmNewPasswordPlaceholder')}
                  />
                </div>
                {changePasswordError && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {changePasswordError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setChangePasswordError(null);
                    }}
                    className="btn-secondary flex-1"
                  >
                    {t('form.cancel')}
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={changePasswordLoading}
                    className="btn-primary flex-1"
                  >
                    {changePasswordLoading ? t('settings.changing') : t('settings.changePassword')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary-400" />
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings.recoveryPhrase')}</h4>
            </div>
            {!recoveryPhraseShown ? (
              <div className="space-y-3">
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">{t('settings.recoveryPhraseImportant')}</p>
                    <p>{t('settings.recoveryPhraseDesc')}</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateRecoveryPhrase}
                  className="btn-primary w-full"
                >
                  {t('settings.generateRecoveryPhrase')}
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">{t('settings.storeSafely')}</p>
                    <p>{t('settings.recoveryPhraseWarning')}</p>
                  </div>
                </div>
                {recoveryPhrase && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <div className="grid grid-cols-3 gap-2 font-mono text-sm">
                      {recoveryPhrase.map((word, i) => (
                        <div key={i} style={{ color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>{i + 1}.</span>
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleCopyRecoveryPhrase}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t('settings.copyRecoveryPhrase')}
                </button>
              </div>
            )}
          </div>

          {updateInfo && (
            <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--color-primary)' }}>
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                <div className="flex-1">
                  <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {t('settings.update.available')}: {updateInfo.version}
                  </div>
                  <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {t('settings.update.description')}
                  </div>
                  <div className="flex gap-2">
                    {updateInfo.assets.some(a => a.name.toLowerCase().includes('.exe') && !a.name.toLowerCase().includes('portable')) && (
                      <button
                        onClick={handleDownloadInstaller}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t('settings.update.downloadInstaller')}
                      </button>
                    )}
                    {updateInfo.assets.some(a => a.name.toLowerCase().includes('portable')) && (
                      <button
                        onClick={handleDownloadPortable}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t('settings.update.downloadPortable')}
                      </button>
                    )}
                    {!updateInfo.assets.some(a => a.name.toLowerCase().includes('.exe')) && (
                      <button
                        onClick={() => window.open(updateInfo.url, '_blank', 'noopener,noreferrer')}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t('settings.update.download')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Version {currentVersion}
                </span>
                {updateChecked && !updateInfo && (
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                )}
              </div>
              <button
                onClick={handleCheckForUpdates}
                disabled={checkingUpdate}
                className="text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {checkingUpdate ? t('settings.update.checking') : t('settings.update.check')}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4" style={{ borderTop: '2px solid var(--border-color)' }}>
            <div className="space-y-4">
              {!showClearDataConfirm ? (
                <>
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">{t('settings.clearData.warning')}</p>
                      <p>{t('settings.clearData.description')}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearAllData}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors text-white"
                    style={{ 
                      backgroundColor: '#ef4444',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ef4444';
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                    {t('settings.clearData.button')}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">{t('settings.clearData.finalWarning')}</p>
                      <p>{t('settings.clearData.finalDescription')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      {t('settings.clearData.confirmText')}
                    </label>
                    <input
                      type="text"
                      value={clearDataConfirmText}
                      onChange={(e) => setClearDataConfirmText(e.target.value)}
                      className="input-field"
                      placeholder="DELETE"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowClearDataConfirm(false);
                        setClearDataConfirmText('');
                      }}
                      className="btn-secondary flex-1"
                    >
                      {t('form.cancel')}
                    </button>
                    <button
                      onClick={handleClearAllData}
                      disabled={clearDataConfirmText.trim().toUpperCase() !== 'DELETE'}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        backgroundColor: clearDataConfirmText.trim().toUpperCase() === 'DELETE' ? '#ef4444' : '#7f1d1d',
                      }}
                      onMouseEnter={(e) => {
                        if (clearDataConfirmText.trim().toUpperCase() === 'DELETE') {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (clearDataConfirmText.trim().toUpperCase() === 'DELETE') {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                        }
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                      {t('settings.clearData.confirmButton')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
