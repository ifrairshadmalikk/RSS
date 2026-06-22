import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiUrl = process.env.VITE_API_URL?.trim();

const rewrites = [];

if (apiUrl?.startsWith('http')) {
  const backendOrigin = apiUrl.replace(/\/api\/?$/, '');
  rewrites.push({
    source: '/api/:path*',
    destination: `${backendOrigin}/api/:path*`
  });
  console.log(`Configured Vercel API proxy -> ${backendOrigin}/api/:path*`);
} else if (process.env.VERCEL) {
  console.warn(
    'VITE_API_URL is missing or invalid. Set it in Vercel to your backend URL, e.g. https://your-server.vercel.app/api'
  );
}

rewrites.push({
  source: '/(.*)',
  destination: '/index.html'
});

fs.writeFileSync(path.join(root, 'vercel.json'), `${JSON.stringify({ rewrites }, null, 2)}\n`);
