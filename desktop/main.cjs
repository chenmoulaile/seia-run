const { app, BrowserWindow, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.join(__dirname, 'dist');
const ICON = path.join(__dirname, 'icon.png');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

let server = null;
let win = null;

function safePath(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  if (pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(DIST, pathname));
  if (!file.startsWith(DIST + path.sep) && file !== path.join(DIST, 'index.html')) return null;
  return file;
}

function startServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const file = safePath(req.url || '/');
      if (!file) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      fs.stat(file, (err, stat) => {
        if (err || !stat.isFile()) {
          const index = path.join(DIST, 'index.html');
          fs.readFile(index, (readErr, data) => {
            if (readErr) {
              res.writeHead(404);
              res.end('Not found');
              return;
            }
            res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
            res.end(data);
          });
          return;
        }
        const ext = path.extname(file).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        const range = req.headers.range;
        if (range) {
          const match = /bytes=(\d*)-(\d*)/.exec(range);
          if (match) {
            const start = match[1] ? Number(match[1]) : 0;
            const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
            if (start <= end && start < stat.size) {
              res.writeHead(206, {
                'Content-Type': type,
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': end - start + 1,
                'Cache-Control': 'no-cache',
              });
              fs.createReadStream(file, { start, end }).pipe(res);
              return;
            }
          }
        }
        res.writeHead(200, {
          'Content-Type': type,
          'Content-Length': stat.size,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache',
        });
        fs.createReadStream(file).pipe(res);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function createWindow(port) {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#dcebff',
    autoHideMenuBar: true,
    title: '圣娅快跑',
    icon: ICON,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) event.preventDefault();
  });
  win.on('closed', () => {
    win = null;
  });
  win.loadURL(`http://127.0.0.1:${port}/`);
}

app.setName('圣娅快跑');
app.setAppUserModelId('com.seia.run');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      const port = await startServer();
      createWindow(port);
    } catch (err) {
      console.error(err);
      app.quit();
    }
  });
}

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});
