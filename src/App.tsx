import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { VaultScreen } from './components/VaultScreen';
import { UpdatePopup } from './components/UpdatePopup';
import { vaultExists } from './utils/storage';
import { initializeTheme } from './utils/theme';
import { t } from './utils/i18n';
import { checkForUpdates, getCurrentVersion, UpdateInfo } from './utils/updates';

function App() {
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);

  useEffect(() => {
    initializeTheme();
    const checkVault = async () => {
      const exists = await vaultExists();
      setIsNewUser(!exists);
      setLoading(false);
    };
    checkVault();

    if (window.electronAPI) {
      const electronAPI = window.electronAPI;
      const syncCloseToTray = () => {
        const closeToTray = localStorage.getItem('keyforge_close_to_tray') === 'true';
        electronAPI.setCloseToTray(closeToTray);
        electronAPI.sendCloseToTraySetting(closeToTray);
      };
      
      syncCloseToTray();
      
      const cleanup = electronAPI.onRequestCloseToTraySetting(() => {
        syncCloseToTray();
      });
      
      return cleanup;
    }
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
        try {
          const update = await checkForUpdates(getCurrentVersion());
          if (update) {
            setUpdateInfo(update);
            setShowUpdatePopup(true);
            localStorage.setItem('keyforge_last_update_check', now.toString());
          }
        } catch (error) {
          console.error('Update check failed:', error);
        }
      }, 2000);
    };

    checkUpdate();
  }, []);

  const handleLogin = (password: string) => {
    setMasterPassword(password);
  };

  const handleLogout = () => {
    setMasterPassword(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">{t('app.loading')}</div>
      </div>
    );
  }

  if (!masterPassword) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isNewUser={isNewUser ?? false}
        onNewUserCreated={() => setIsNewUser(false)}
      />
    );
  }

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

  return (
    <>
      {showUpdatePopup && updateInfo && (
        <UpdatePopup
          updateInfo={updateInfo}
          onClose={() => setShowUpdatePopup(false)}
          onDownloadInstaller={handleDownloadInstaller}
          onDownloadPortable={handleDownloadPortable}
        />
      )}
      <VaultScreen masterPassword={masterPassword} onLogout={handleLogout} />
    </>
  );
}

export default App;
