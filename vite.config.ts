import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    build: {
      target: 'es2020',
      sourcemap: false,
      cssMinify: true,
      reportCompressedSize: true,
    },
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      // Prepares clean static PWA output in dist/ for Render Static Site hosting:
      // 1) Removes unoptimized raw upload attachments from dist/assets/aistudio
      // 2) Injects compiled ./assets/*.js and ./assets/*.css into dist/sw.js precache list
      // 3) Stamps a deterministic build hash into dist/sw.js CACHE_NAME for instant cache updates on redeploy
      {
        name: 'finalize-pwa-static-bundle',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const rawUploadDir = path.join(distDir, 'assets', 'aistudio');
          if (fs.existsSync(rawUploadDir)) {
            fs.rmSync(rawUploadDir, {recursive: true, force: true});
          }

          const swPath = path.join(distDir, 'sw.js');
          const assetsDir = path.join(distDir, 'assets');
          if (fs.existsSync(swPath) && fs.existsSync(assetsDir)) {
            const assetFiles = fs
              .readdirSync(assetsDir)
              .filter((file) => /\.(js|css|woff2?)$/i.test(file))
              .sort();

            const compiledAssets = assetFiles
              .map((file) => `,\n  './assets/${file}'`)
              .join('');

            const buildHash = crypto
              .createHash('sha256')
              .update(assetFiles.join('|'))
              .digest('hex')
              .slice(0, 8);

            const swContent = fs.readFileSync(swPath, 'utf-8');
            const updatedSw = swContent
              .replace(
                "const CACHE_NAME = 'madarao-pwa-2027-v4';",
                `const CACHE_NAME = 'madarao-pwa-2027-${buildHash}';`,
              )
              .replace('/* __VITE_PRECACHE_ASSETS__ */', compiledAssets);
            fs.writeFileSync(swPath, updatedSw, 'utf-8');
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
