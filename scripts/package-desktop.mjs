import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const electronDir = 'E:/新建文件夹/CodexPet/runtime/electron-44.7.0';
const outRoot = path.join(root, 'release');
const appDir = path.join(outRoot, 'SeiaRun-win32-x64');
const appRes = path.join(appDir, 'resources', 'app');

const run = (cmd, args, cwd = root) => {
  execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: false });
};

const runNpm = (args) => {
  execFileSync('cmd.exe', ['/d', '/s', '/c', 'npm', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
};

if (!fs.existsSync(electronDir)) {
  throw new Error(`Electron runtime not found: ${electronDir}`);
}

console.log('[1/5] building web bundle');
runNpm(['run', 'build']);

console.log('[2/5] copying Electron runtime');
fs.rmSync(appDir, { recursive: true, force: true });
fs.mkdirSync(appDir, { recursive: true });
fs.cpSync(electronDir, appDir, { recursive: true });

console.log('[3/5] preparing app payload');
const exeSrc = path.join(appDir, 'electron.exe');
const exeDst = path.join(appDir, '圣娅快跑.exe');
if (fs.existsSync(exeSrc)) fs.renameSync(exeSrc, exeDst);
fs.mkdirSync(appRes, { recursive: true });
fs.cpSync(path.join(root, 'dist'), path.join(appRes, 'dist'), { recursive: true });
fs.copyFileSync(path.join(root, 'desktop', 'main.cjs'), path.join(appRes, 'main.cjs'));
fs.copyFileSync(path.join(root, 'public', 'assets', 'icon.png'), path.join(appRes, 'icon.png'));
fs.writeFileSync(
  path.join(appRes, 'package.json'),
  JSON.stringify(
    {
      name: 'seia-run-desktop',
      productName: '圣娅快跑',
      version: '1.0.0',
      main: 'main.cjs',
      private: true,
    },
    null,
    2
  ),
  'utf8'
);
fs.writeFileSync(
  path.join(appDir, '启动说明.txt'),
  [
    '圣娅快跑 - 蔚蓝档案同人 3D 无尽跑酷',
    '',
    '双击“圣娅快跑.exe”即可开始游戏。',
    '本版本自带本地静态服务器，不需要联网，也不会安装任何东西。',
    '首次启动可能需要几秒钟加载模型。',
    '',
    '快捷键：← → 换道，↑ 跳跃，↓ 滑铲，Esc 暂停。',
    '',
    '同人作品，非商业用途。角色与模型版权归 NEXON / Yostar。',
  ].join('\r\n'),
  'utf8'
);

console.log('[4/5] checking output');
const exeSize = fs.statSync(exeDst).size;
if (!fs.existsSync(path.join(appRes, 'dist', 'index.html'))) {
  throw new Error('dist/index.html missing');
}
if (exeSize < 50 * 1024 * 1024) {
  throw new Error('packaged executable looks too small');
}

console.log('[5/5] done');
console.log(`EXE: ${exeDst}`);
console.log(`folder: ${appDir}`);
