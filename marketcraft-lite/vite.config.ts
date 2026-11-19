// AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

function getMarketCraftDataDir(): string {
  const base = process.env.LOCALAPPDATA || os.tmpdir();
  const dir = path.join(base, 'MarketCraft');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readJsonBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk.toString();
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function marketcraftLocalBridgePlugin() {
  return {
    name: 'marketcraft-local-blender-bridge',
    configureServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (url === '/api/sui-rpc') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, client-sdk-type, client-sdk-version, client-target-api-version');
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }
          try {
            const body = await readJsonBody(req);
            const upstreams = [
              'https://fullnode.testnet.sui.io:443',
              'https://sui-testnet-rpc.publicnode.com',
            ];
            let lastErr = '';
            for (const endpoint of upstreams) {
              try {
                const upstream = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body,
                });
                const text = await upstream.text();
                if (upstream.ok) {
                  res.statusCode = 200;
                  res.end(text);
                  return;
                }
                lastErr = `${endpoint} -> HTTP ${upstream.status}: ${text.slice(0, 120)}`;
              } catch (e) {
                lastErr = `${endpoint} -> ${String(e)}`;
              }
            }
            res.statusCode = 502;
            res.end(JSON.stringify({ error: `Sui Testnet RPC unreachable: ${lastErr}` }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
            return;
          }
        }
        if (!url.startsWith('/api/local/')) {
          return next();
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const dataDir = getMarketCraftDataDir();
        const sessionFile = path.join(dataDir, 'active-session.json');
        const publishedFile = path.join(dataDir, 'blender-published.json');

        try {
          if (url === '/api/local/session') {
            if (req.method === 'GET') {
              const raw = fs.existsSync(sessionFile)
                ? fs.readFileSync(sessionFile, 'utf-8')
                : JSON.stringify({ sui_address: '', handle: '', signed_in: false });
              res.end(raw);
              return;
            }
            if (req.method === 'POST') {
              const body = await readJsonBody(req);
              fs.writeFileSync(sessionFile, body, 'utf-8');
              res.end(JSON.stringify({ ok: true }));
              return;
            }
          }

          if (url === '/api/local/blender-publish') {
            if (req.method === 'GET') {
              const raw = fs.existsSync(publishedFile) ? fs.readFileSync(publishedFile, 'utf-8') : '[]';
              res.end(raw);
              return;
            }
            if (req.method === 'POST') {
              const body = await readJsonBody(req);
              const item = JSON.parse(body);
              const existing = fs.existsSync(publishedFile)
                ? JSON.parse(fs.readFileSync(publishedFile, 'utf-8'))
                : [];
              const nextList = [item, ...existing.filter((x: { payload_sha256?: string }) => x.payload_sha256 !== item.payload_sha256)];
              fs.writeFileSync(publishedFile, JSON.stringify(nextList, null, 2), 'utf-8');
              res.end(JSON.stringify({ ok: true, count: nextList.length }));
              return;
            }
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Unknown /api/local route' }));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), marketcraftLocalBridgePlugin()],
  server: {
    port: 1425,
    strictPort: true,
  },
});
