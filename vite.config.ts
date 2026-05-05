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
          // firebase-admin é server-only (api/) — não entra no bundle do browser
          external: (id) => id.startsWith('firebase-admin'),
          output: {
            manualChunks: {
              // React core — carregado imediatamente em todo render
              'vendor-react':         ['react', 'react-dom', 'react-router-dom'],
              // Firebase core + data — necessário na landing (Firestore para leads, Storage)
              'vendor-firebase-core': ['firebase/app', 'firebase/firestore', 'firebase/storage', 'firebase/analytics'],
              // firebase/auth em chunk separado — carregado lazy via AuthContext (dynamic import)
              // Não faz parte da cadeia crítica de render da landing page
              'vendor-firebase-auth': ['firebase/auth'],
              // Charts e ícones — carregados sob demanda no dashboard
              'vendor-charts':        ['recharts'],
              'vendor-icons':         ['lucide-react'],
              // SDK Gemini — carregado lazy pelo ContentStudio
              'vendor-ai':            ['@google/genai'],
            },
          },
        },
        // Avisa quando chunk > 600 KiB (aumentado de 500 para reduzir ruído)
        chunkSizeWarningLimit: 600,
      },
    };
});
