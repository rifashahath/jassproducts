import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import {defineConfig, Plugin} from 'vite';

dotenv.config();

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }
        const endpoint = req.url.replace(/^\/api\//, '').split('?')[0];
        const validEndpoints = [
          'create-razorpay-order',
          'verify-razorpay-payment',
          'revalidate-cart',
          'cancel-order',
        ];
        if (!validEndpoints.includes(endpoint)) {
          return next();
        }

        try {
          const chunks: any[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const bodyBuffer = Buffer.concat(chunks);
          let body = {};
          if (bodyBuffer.length > 0) {
            try {
              body = JSON.parse(bodyBuffer.toString('utf-8'));
            } catch {
              body = {};
            }
          }
          (req as any).body = body;

          (res as any).status = function (code: number) {
            res.statusCode = code;
            return res;
          };
          (res as any).json = function (data: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return res;
          };
          (res as any).send = function (data: any) {
            res.end(data);
            return res;
          };

          const modulePath = path.resolve(__dirname, `api/${endpoint}.ts`);
          const mod = await server.ssrLoadModule(modulePath);
          await mod.default(req, res);
        } catch (err: any) {
          console.error(`API Error in ${endpoint}:`, err);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          }
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

