import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import adminSeedHandler from './api/admin/seed.js';

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'admin-seed-dev-route',
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const pathname = (request.url || '').split('?')[0];
          if (pathname !== '/api/admin/seed') {
            next();
            return;
          }

          await adminSeedHandler(request, response);
        });
      }
    }
  ]
});