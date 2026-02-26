import { readFileSync, writeFileSync } from 'fs';

const mode = process.argv[2] || 'production';
const envFile = mode === 'development' ? '.env.development' : '.env.production';

const envContent = readFileSync(envFile, 'utf-8');
const match = envContent.match(/VITE_API_BASE_URL=(.+)/);
if (!match) {
  console.error('VITE_API_BASE_URL not found in', envFile);
  process.exit(1);
}

const apiUrl = new URL(match[1].trim());
const hostPattern = `${apiUrl.protocol}//${apiUrl.host}/*`;

const manifest = JSON.parse(readFileSync('build/manifest.json', 'utf-8'));
manifest.host_permissions = [hostPattern];
writeFileSync('build/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

console.log(`Patched manifest.json with host_permissions: [${hostPattern}]`);
