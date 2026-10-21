import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // 开发环境代理硅基流动，避免浏览器 CORS → Failed to fetch
      '/siliconflow-api': {
        target: 'https://api.siliconflow.cn',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/siliconflow-api/, ''),
      },
    },
  },
});
