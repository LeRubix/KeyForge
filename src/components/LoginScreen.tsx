import { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, Sparkles, Key, ChevronDown } from 'lucide-react';
import { readVault, writeVault, createEmptyVault, setMasterPasswordHash } from '@/utils/storage';
import { validateMasterPassword } from '@/utils/passwordValidation';
import { recoveryPhraseToKey, validateRecoveryPhrase } from '@/utils/recovery';
import { languages, getLanguage, saveLanguage, Language, t } from '@/utils/i18n';
import { getColorMode } from '@/utils/theme';
import { ContextMenu } from './ContextMenu';
import { FlagIcon } from './FlagIcon';

interface LoginScreenProps {
  onLogin: (password: string) => void;
  isNewUser: boolean;
  onNewUserCreated: () => void;
}

export function LoginScreen({ onLogin, isNewUser, onNewUserCreated }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState(getColorMode());
  const [loading, setLoading] = useState(false);
  const [useRecoveryPhrase, setUseRecoveryPhrase] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string[]>(Array(15).fill(''));
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getLanguage());
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: HTMLInputElement } | null>(null);
  const [, setLanguageKey] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(getLanguage());
      setLanguageKey(prev => prev + 1);
    };
    const checkColorMode = () => {
      setColorMode(getColorMode());
    };
    window.addEventListener('languagechange', handleLanguageChange);
    const interval = setInterval(checkColorMode, 100);
    checkColorMode();
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { checkRateLimit, getRemainingAttempts } = await import('@/utils/security');
    const rateLimitKey = 'login_attempts';
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000;

    if (!checkRateLimit(rateLimitKey, maxAttempts, windowMs)) {
      const resetTime = new Date(Date.now() + windowMs).toLocaleTimeString();
      setError(`Too many login attempts. Please try again later. (Resets at ${resetTime})`);
      setLoading(false);
      return;
    }

    try {
      if (isNewUser) {
        const validation = validateMasterPassword(password);
        if (!validation.valid) {
          setError(validation.errors.join('. '));
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError(t('login.error.passwordMismatch'));
          setLoading(false);
          return;
        }

        const vault = createEmptyVault();
        const success = await writeVault(vault, password);
        
        if (success) {
          await setMasterPasswordHash(password);
          onNewUserCreated();
          onLogin(password);
        } else {
          setError('Failed to create vault');
        }
      } else {
        if (useRecoveryPhrase) {
          const phraseWords = recoveryPhrase.filter((w: string) => w.trim()).map((w: string) => w.toLowerCase().trim());
          if (phraseWords.length !== 15) {
            setError(t('login.error.invalidRecoveryPhrase'));
            setLoading(false);
            return;
          }
          
          if (!validateRecoveryPhrase(phraseWords)) {
            setError(t('login.error.invalidRecoveryPhrase'));
            setLoading(false);
            return;
          }
          
          const recoveryKey = await recoveryPhraseToKey(phraseWords);
          const storedRecoveryHash = localStorage.getItem('keyforge_recovery_hash');
          
          if (!storedRecoveryHash) {
            setError('No recovery phrase found. Please use your master password.');
            setLoading(false);
            return;
          }
          
          const { readVaultWithRecovery } = await import('@/utils/storage');
          const vault = await readVaultWithRecovery(recoveryKey, recoveryKey);
          
          if (vault) {
            const { clearRateLimit } = await import('@/utils/security');
            const { clearSensitiveString } = await import('@/utils/clipboard');
            clearRateLimit(rateLimitKey);
            await setMasterPasswordHash(recoveryKey);
            onLogin(recoveryKey);
            setTimeout(() => {
              clearSensitiveString(recoveryKey);
              recoveryPhrase.forEach(w => clearSensitiveString(w));
            }, 100);
          } else {
            const remainingAttempts = getRemainingAttempts(rateLimitKey, maxAttempts);
            setError(`Invalid recovery phrase or vault cannot be decrypted. ${remainingAttempts > 0 ? `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` : 'No attempts remaining.'}`);
          }
        } else {
          const vault = await readVault(password);
          
          if (vault) {
            const { clearRateLimit } = await import('@/utils/security');
            const { clearSensitiveString } = await import('@/utils/clipboard');
            clearRateLimit(rateLimitKey);
            await setMasterPasswordHash(password);
            onLogin(password);
            setTimeout(() => {
              clearSensitiveString(password);
            }, 100);
          } else {
            const remainingAttempts = getRemainingAttempts(rateLimitKey, maxAttempts);
            setError(`${t('login.error.incorrectPassword')} ${remainingAttempts > 0 ? `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` : 'No attempts remaining.'}`);
          }
        }
      }
    } catch (err) {
      const remainingAttempts = getRemainingAttempts(rateLimitKey, maxAttempts);
      setError(`Authentication failed. Please check your credentials. ${remainingAttempts > 0 ? `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` : 'No attempts remaining.'}`);
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = isNewUser && password ? validateMasterPassword(password) : null;

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
        if (target.type === 'password' && target.placeholder?.includes('master')) {
          setPassword(newValue);
        } else if (target.type === 'password' && target.placeholder?.includes('Confirm')) {
          setConfirmPassword(newValue);
        } else if (target.type === 'text') {
          const index = parseInt(target.placeholder || '0') - 1;
          if (index >= 0 && index < recoveryPhrase.length) {
            const newPhrase = [...recoveryPhrase];
            newPhrase[index] = newValue;
            setRecoveryPhrase(newPhrase);
          }
        }
      } else if (action === 'paste') {
        const text = await navigator.clipboard.readText();
        const newValue = target.value.substring(0, start) + text + target.value.substring(end);
        if (target.type === 'password' && target.placeholder?.includes('master')) {
          setPassword(newValue);
        } else if (target.type === 'password' && target.placeholder?.includes('Confirm')) {
          setConfirmPassword(newValue);
        } else if (target.type === 'text') {
          const index = parseInt(target.placeholder || '0') - 1;
          if (index >= 0 && index < recoveryPhrase.length) {
            const newPhrase = [...recoveryPhrase];
            newPhrase[index] = newValue;
            setRecoveryPhrase(newPhrase);
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
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundColor: 'var(--bg-primary)'
      }}
    >
      <div className="fixed top-4 right-4 z-50" ref={languageDropdownRef}>
          <button
            type="button"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
            }}
          >
            <FlagIcon languageCode={currentLanguage} size={24} />
            <span className="text-sm">{languages.find(l => l.code === currentLanguage)?.name}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showLanguageDropdown && (
            <div 
              className="absolute top-full right-0 mt-2 rounded-lg shadow-xl overflow-hidden z-50 min-w-[200px]"
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

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl" style={{ background: 'linear-gradient(to bottom right, #11998e, #38ef7d)', boxShadow: '0 20px 25px -5px rgba(17, 153, 142, 0.3)' }}>
              <Key className="w-10 h-10 text-white" />
            </div>
            {!isNewUser && (
              <span className="text-2xl font-medium" style={{ color: 'var(--text-secondary)' }}>
                KeyForge
              </span>
            )}
          </div>
          <h1 
            className={`text-5xl font-bold mb-3 leading-tight pb-2 ${
              colorMode === 'light' 
                ? 'text-black' 
                : 'bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent'
            }`}
          >
            {isNewUser ? t('app.name') : t('login.unlock')}
          </h1>
          {isNewUser && (
            <p 
              className="text-lg font-semibold" 
              style={{ 
                color: 'var(--text-primary)',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                display: 'inline-block'
              }}
            >
              {t('login.title')}
            </p>
          )}
        </div>

        <div className="card backdrop-blur-xl shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('login.masterPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onContextMenu={handleContextMenu}
                  className="input-field pl-10 pr-10"
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isNewUser && passwordValidation && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>{t('login.strength')}</span>
                    <span>{passwordValidation.strength}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        passwordValidation.strength >= 70
                          ? 'bg-green-500'
                          : passwordValidation.strength >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${passwordValidation.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {isNewUser && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('login.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onContextMenu={handleContextMenu}
                    className="input-field pl-10"
                    placeholder={t('login.confirmPasswordPlaceholder')}
                    required
                  />
                </div>
              </div>
            )}

            {!isNewUser && (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setUseRecoveryPhrase(!useRecoveryPhrase)}
                  className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  <Key className="w-4 h-4" />
                  {useRecoveryPhrase ? t('login.usePassword') : t('login.recoveryPhrase')}
                </button>
              </div>
            )}

            {!isNewUser && useRecoveryPhrase && (
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('login.recoveryPhrasePlaceholder')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {recoveryPhrase.map((word: string, i: number) => (
                    <input
                      key={i}
                    type="text"
                    value={word}
                    onChange={(e) => {
                      const newPhrase = [...recoveryPhrase];
                      newPhrase[i] = e.target.value;
                      setRecoveryPhrase(newPhrase);
                    }}
                    onContextMenu={handleContextMenu}
                    className="input-field text-xs"
                      placeholder={`${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isNewUser && passwordValidation ? !passwordValidation.valid : false)}
              className="btn-primary w-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: 'linear-gradient(to right, #11998e, #38ef7d)',
                boxShadow: '0 10px 15px -3px rgba(17, 153, 142, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #0e7a72, #2dd66f)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #11998e, #38ef7d)';
              }}
            >
              {loading ? (
                  <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  {t('login.processing')}
                </span>
              ) : (
                isNewUser ? t('login.createVault') : t('login.unlockVault')
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-400 text-center">
              {t('login.privacyNotice')}
            </p>
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
