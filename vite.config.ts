
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
        }
      }
    }
  },
  // 由于项目结构扁平，我们将根目录作为静态资源来源
  // 这样打包时 manifest.json 和 sw.js 会被自动复制到 dist 目录
  publicDir: '.', 
  server: {
    port: 3000,
    host: true
  }
});
// fix vercel build
