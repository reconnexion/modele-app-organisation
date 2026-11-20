import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { appManifest } from '@activitypods/app-manifest/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '');
  return {
    envDir: '..',
    // The client ID is served by the backend, so it must use its URL
    plugins: [react(), appManifest({ origin: env.PUBLIC_URL || 'http://localhost:4000' })],
    server: {
      port: Number(env.VITE_PORT || 5173),
      strictPort: true
    }
  };
});
