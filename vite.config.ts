import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // B2: Compressão Brotli — serve .br para browsers modernos (Vercel/Nginx)
        viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
        // B2: Gzip como fallback
        viteCompression({ algorithm: 'gzip', ext: '.gz' }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          // B3: firebase-admin é server-only (api/) — não deve entrar no bundle do browser
          external: (id) => id.startsWith('firebase-admin'),
          output: {
            // B1: Code splitting — chunks separados para vendors pesados
            manualChunks: {
              'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
              'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
              'vendor-charts':   ['recharts'],
              'vendor-icons':    ['lucide-react'],
              'vendor-ai':       ['@google/genai'],
            },
          },
        },
      },
    };
});
