import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          devOptions: {
            enabled: true
          },
          manifest: {
            name: 'Fajmuls Learning',
            short_name: 'Fajmuls',
            description: 'Aplikasi Tryout SKD dan UTBK',
            theme_color: '#4f46e5',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
              {
                src: 'https://files.catbox.moe/02xqjo.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'https://files.catbox.moe/02xqjo.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 5000000
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
