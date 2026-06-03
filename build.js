const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FILES = [
  'filterComments.js', 'popup.html', 'popup.js', 'background.js',
  'icon-32.png', 'icon-48.png', 'icon-128.png', 'LICENSE'
];
const BUILD = 'build';
const VER = '1.2.0';

const targets = [
  { name: 'chrome', manifest: 'manifest.json' },
  { name: 'firefox', manifest: 'manifest-firefox.json' }
];

for (const t of targets) {
  const tmp = fs.mkdtempSync('build-');
  const out = path.join(BUILD, `comment-vaccinator-${t.name}-v${VER}.zip`);

  for (const f of FILES) {
    fs.cpSync(f, path.join(tmp, f));
  }
  fs.cpSync(t.manifest, path.join(tmp, 'manifest.json'));

  const files = fs.readdirSync(tmp).map(f => `"${path.join(tmp, f)}"`).join(',');
  execSync(
    `powershell -Command "Compress-Archive -Path ${files} -DestinationPath '${out}' -Force"`,
    { stdio: 'pipe' }
  );
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Created ${out}`);
}
