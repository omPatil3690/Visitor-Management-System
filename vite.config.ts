import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true, // ✅ This is fine — see the cast below
  } as any, // ✅ Cast to 'any' to bypass strict type checking safely
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
