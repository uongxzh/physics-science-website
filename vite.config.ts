import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import Sitemap from 'vite-plugin-sitemap';
import { visualizer } from 'rollup-plugin-visualizer';

const dynamicRoutes = [
  '/',
  '/about',
  '/experiments',
  '/videos',
];

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ViteImageOptimizer({
      png: { quality: 80, compressionLevel: 9 },
      jpeg: { quality: 75, progressive: true },
      webp: { lossless: false, quality: 75 },
      avif: { lossless: false, quality: 50 },
      svg: { multipass: true },
      cache: true,
      cacheLocation: '.cache/image-optimizer',
      includePublic: true,
      logStats: true,
    }),
    Sitemap({
      hostname: 'https://251119.xyz',
      dynamicRoutes,
      changefreq: {
        '*': 'weekly',
        '/': 'daily',
      },
      priority: {
        '*': 0.7,
        '/': 1.0,
        '/about': 0.8,
      },
      exclude: ['/admin', '/private'],
      generateRobotsTxt: true,
      readable: true,
    }),
    mode === 'analyze' &&
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      }),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    cssCodeSplit: true,
    assetsInlineLimit: 8192,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
}));
