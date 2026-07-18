// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Static-first: every page prerenders at build time.
// The node adapter exists for the few on-demand routes (prayer endpoint)
// via `export const prerender = false`.
export default defineConfig({
  site: process.env.SITE_URL || 'https://questlaguna.org',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    // Skip the on-demand API route from the sitemap.
    sitemap({ filter: (page) => !page.includes('/api/') }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
