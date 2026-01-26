import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            ws: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 真实后端服务地址
            target: 'http://localhost:9000/api',
          },

          // '/api': {
          //   changeOrigin: true,
          //   ws: true,
          //   rewrite: (path) => path.replace(/^\/api/, ''),
          //   // 真实后端服务地址
          //   target: 'http://localhost:8090',
          // },

          // '/socket': {
          //   changeOrigin: true,
          //   rewrite: (path) => path.replace(/^\/socket/, ''),
          //   // 真实后端服务地址
          //   target: 'http://localhost:8090',
          //   ws: true,
          // },
        },
      },
    },
  };
});
