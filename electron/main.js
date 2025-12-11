
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Disabling to allow Twitch API CORS requests from localhost/file
    },
    autoHideMenuBar: true,
    backgroundColor: '#0e0e10',
    title: "StreamWatcher"
  });

  // In development, load from localhost. In production, load index.html
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('launch-command', async (event, command) => {
  return new Promise((resolve, reject) => {
    console.log('Executing:', command);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error.message);
        return;
      }
      resolve(stdout);
    });
  });
});

ipcMain.handle('read-config', async () => {
  try {
    // Look for config.json next to the executable or in the root
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (err) {
    console.error("Failed to read config", err);
    return null;
  }
});
