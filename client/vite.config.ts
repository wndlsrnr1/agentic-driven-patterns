import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CLIENT_INTERNAL_PORT = 5173;
const DEFAULT_SERVER_INTERNAL_PORT = 3001;

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const clientInternalPort = parsePort(
  process.env.CLIENT_INTERNAL_PORT,
  DEFAULT_CLIENT_INTERNAL_PORT,
);
const proxyTargetHost = process.env.VITE_PROXY_TARGET_HOST ?? 'localhost';
const proxyTargetPort = parsePort(
  process.env.VITE_PROXY_TARGET_PORT,
  DEFAULT_SERVER_INTERNAL_PORT,
);
const proxyTarget = `http://${proxyTargetHost}:${proxyTargetPort}`;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: clientInternalPort,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
