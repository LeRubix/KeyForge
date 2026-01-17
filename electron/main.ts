import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let closeToTray = false;
let appIsQuitting = false;

function getIconPath(): string {
  if (process.env.NODE_ENV === 'development') {
    const devPaths = [
      path.join(process.cwd(), 'public', 'key.png'),
      path.join(__dirname, '../../public/key.png'),
      path.join(__dirname, '../../key.png'),
      path.join(process.cwd(), 'key.png'),
    ];
    for (const p of devPaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return devPaths[0];
  } else {
    const prodPaths = [
      path.join(process.resourcesPath, 'app', 'public', 'key.png'),
      path.join(app.getAppPath(), 'public', 'key.png'),
      path.join(__dirname, '../public/key.png'),
      path.join(__dirname, '../key.png'),
      path.join(process.resourcesPath, 'key.png'),
      path.join(app.getAppPath(), 'key.png'),
    ];
    for (const p of prodPaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return prodPaths[0];
  }
}

function getAppIcon(): Electron.NativeImage {
  const iconPath = getIconPath();
  let icon = nativeImage.createFromPath(iconPath);
  
  if (icon.isEmpty() && fs.existsSync(iconPath)) {
    try {
      const imageData = fs.readFileSync(iconPath);
      icon = nativeImage.createFromBuffer(imageData);
    } catch (error) {
    }
  }
  
  if (icon.isEmpty()) {
    return nativeImage.createEmpty();
  }
  
  return icon;
}

function createWindow() {
  const icon = getAppIcon();
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: icon.isEmpty() ? undefined : icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    frame: true,
    backgroundColor: '#0f172a',
    show: false,
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    mainWindow?.show();
    mainWindow?.webContents.openDevTools();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const possiblePaths = [
      path.join(__dirname, '../dist/index.html'),
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
      path.join(app.getAppPath(), 'dist', 'index.html'),
    ];

    let loaded = false;
    for (const htmlPath of possiblePaths) {
      if (fs.existsSync(htmlPath)) {
        mainWindow.loadFile(htmlPath);
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      console.error('Could not find index.html in any expected location');
      mainWindow?.show();
      mainWindow?.webContents.openDevTools();
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (process.env.NODE_ENV === 'development') {
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.on('close', (event) => {
    // Check the setting from localStorage via IPC before closing
    if (closeToTray && !appIsQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.setZoomFactor(1);
    // Request the close-to-tray setting from the renderer
    mainWindow?.webContents.send('request-close-to-tray-setting');
    // Also try to get it immediately via IPC
    mainWindow?.webContents.executeJavaScript(`
      (async () => {
        if (window.electronAPI) {
          const setting = localStorage.getItem('keyforge_close_to_tray') === 'true';
          await window.electronAPI.setCloseToTray(setting);
        }
      })();
    `).catch(() => {});
  });
}

app.whenReady().then(() => {
  const icon = getAppIcon();
  
  if (!icon.isEmpty()) {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.keyforge.app');
    }
    if (process.platform === 'darwin') {
      app.dock.setIcon(icon);
    }
  }
  
  createWindow();
  createTray();
  
  if (process.platform !== 'darwin') {
    Menu.setApplicationMenu(null);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  appIsQuitting = true;
  closeToTray = false;
});

function createTray() {
  const icon = getAppIcon();
  const trayIcon = icon.isEmpty() ? icon : icon.resize({ width: 16, height: 16 });
  if (trayIcon.isEmpty()) {
    const fallbackIcon = nativeImage.createEmpty();
    tray = new Tray(fallbackIcon);
  } else {
    tray = new Tray(trayIcon);
  }
  
  tray.setToolTip('KeyForge');
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show KeyForge',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        appIsQuitting = true;
        closeToTray = false;
        app.quit();
      },
    },
  ]);
  
  tray.setContextMenu(contextMenu);
}

const getVaultPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'vault.encrypted');
};

ipcMain.handle('read-vault', async () => {
  try {
    const vaultPath = getVaultPath();
    if (fs.existsSync(vaultPath)) {
      return fs.readFileSync(vaultPath, 'utf-8');
    }
    return null;
  } catch (error) {
    console.error('Error reading vault:', error);
    return null;
  }
});

ipcMain.handle('write-vault', async (_event, data: string) => {
  try {
    const vaultPath = getVaultPath();
    fs.writeFileSync(vaultPath, data, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing vault:', error);
    return false;
  }
});

ipcMain.handle('vault-exists', async () => {
  const vaultPath = getVaultPath();
  return fs.existsSync(vaultPath);
});

ipcMain.handle('set-close-to-tray', async (_event, enabled: boolean) => {
  closeToTray = enabled;
  if (enabled && !tray) {
    createTray();
  }
});

ipcMain.handle('get-close-to-tray', async () => {
  return closeToTray;
});

ipcMain.on('close-to-tray-setting', (_event, enabled: boolean) => {
  closeToTray = enabled;
  if (enabled && !tray) {
    createTray();
  } else if (!enabled && tray) {
    // Don't destroy tray, just keep it for potential future use
  }
});

ipcMain.handle('clear-vault', async () => {
  try {
    const vaultPath = getVaultPath();
    if (fs.existsSync(vaultPath)) {
      fs.unlinkSync(vaultPath);
    }
    return true;
  } catch (error) {
    console.error('Error clearing vault:', error);
    return false;
  }
});