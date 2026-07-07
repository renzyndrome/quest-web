// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// Static-first: every page prerenders at build time.
// The node adapter exists for the few on-demand routes we add later
// (prayer form endpoint, draft preview) via `export const prerender = false`.
export default defineConfig({
  site: process.env.SITE_URL || 'https://questlaguna.org',
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
  },
});
