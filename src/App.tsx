import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { VaultScreen } from './components/VaultScreen';
import { vaultExists } from './utils/storage';
import { initializeTheme } from './utils/theme';
import { t } from './utils/i18n';

function App() {
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeTheme();
    const checkVault = async () => {
      const exists = await vaultExists();
      setIsNewUser(!exists);
      setLoading(false);
    };
    checkVault();
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

  return <VaultScreen masterPassword={masterPassword} onLogout={handleLogout} />;
}

export default App;
