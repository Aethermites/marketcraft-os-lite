// AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block
// Netlify Serverless Bridge for Live Blender 5.3 <-> https://marketcraft-os-lite.netlify.app

import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// In-memory fallback if Blobs store is unavailable in local dev
let memSession = JSON.stringify({ sui_address: '', handle: '', signed_in: false, entitled_buyers: [] });
let memPublished: Array<Record<string, unknown>> = [];

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;

  let store: ReturnType<typeof getStore> | null = null;
  try {
    store = getStore('marketcraft-lite-bridge');
  } catch {
    store = null;
  }

  try {
    if (pathname.endsWith('/session')) {
      if (req.method === 'GET') {
        const raw = store
          ? ((await store.get('active-session', { type: 'text' })) ?? memSession)
          : memSession;
        return new Response(raw, { status: 200, headers: CORS_HEADERS });
      }
      if (req.method === 'POST') {
        const body = await req.text();
        JSON.parse(body); // validate JSON
        memSession = body;
        if (store) {
          await store.set('active-session', body);
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS_HEADERS });
      }
    }

    if (pathname.endsWith('/blender-publish')) {
      if (req.method === 'GET') {
        const raw = store
          ? ((await store.get('blender-published', { type: 'text' })) ?? JSON.stringify(memPublished))
          : JSON.stringify(memPublished);
        return new Response(raw, { status: 200, headers: CORS_HEADERS });
      }
      if (req.method === 'POST') {
        const item = (await req.json()) as Record<string, unknown>;
        const prevRaw = store
          ? ((await store.get('blender-published', { type: 'text' })) ?? '[]')
          : JSON.stringify(memPublished);
        const existing = JSON.parse(prevRaw) as Array<Record<string, unknown>>;
        const nextList = [
          item,
          ...existing.filter((x) => x.payload_sha256 !== item.payload_sha256),
        ].slice(0, 25);
        memPublished = nextList;
        const serialized = JSON.stringify(nextList);
        if (store) {
          await store.set('blender-published', serialized);
        }
        return new Response(JSON.stringify({ ok: true, count: nextList.length }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      }
    }

    return new Response(JSON.stringify({ error: `Unknown bridge route: ${pathname}` }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }
};

export const config = {
  path: ['/api/local/session', '/api/local/blender-publish'],
};
