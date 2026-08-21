import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3010,
    proxy: {
      '/api': {
        target: 'http://localhost:5010',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5010',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  build: {
    // Every browser that supports native ES modules and dynamic import, which
    // is what the lazy routes need anyway. Avoids shipping legacy transforms.
    target: 'es2020',

    sourcemap: false,

    // Skipping the gzip-size report shaves noticeable time off each build; the
    // real numbers come from the server's brotli anyway.
    reportCompressedSize: false,

    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        /**
         * Manual chunking.
         *
         * Before this, the main bundle was ~407 KB brotli-compressed and had to
         * be downloaded and parsed before anything appeared on screen - even
         * though most of its weight is code the first screen never touches.
         *
         * The heavy libraries below are pulled out so they load in parallel
         * with, or after, first paint:
         *   recharts      only the dashboard and report tabs need it
         *   jspdf         only used when someone exports a PDF
         *   framer-motion presentation polish, not required to render
         *   socket.io     chat, which connects after the app is interactive
         *
         * lucide-react is forced into ONE chunk. Vite's default behaviour split
         * it into ~17 separate 1 KB files (crown, printer, shopping-bag …),
         * which meant 17 extra round trips and 17 more things that can fail
         * during a server restart.
         */
        manualChunks(id) {
          // Rollup hands us decorated module ids: a leading NUL byte for
          // virtual modules, and suffixes like "?commonjs-proxy" on the shim
          // modules that wrap a CommonJS package. Normalise before matching.
          //
          // This matters more than it looks. If a package's proxy module is
          // routed to a different chunk than the package itself, an import edge
          // appears from the eager chunk into the lazy one - which is exactly
          // how 672 KB of PDF library ended up being preloaded on every single
          // page load even though only one button uses it.
          const path = id.replace(/^\0/, '').split('?')[0];

          // Shared interop helpers that every chunk needs. They must live in a
          // chunk that is always loaded, or they drag their host onto the
          // critical path.
          if (path.includes('commonjsHelpers') || path.includes('vite/preload-helper')) {
            return 'vendor';
          }

          if (!path.includes('node_modules')) return undefined;

          // Transitive dependencies must follow their parent library. If they
          // are left in the shared vendor bucket they become eager, which is
          // how ~200 KB of charting and PDF internals were being downloaded on
          // every page load while their parent libraries were correctly lazy.
          const CHART_DEPS = [
            'recharts', 'd3-', 'victory-vendor', 'decimal.js-light',
            'fast-equals', 'react-smooth', 'eventemitter3',
            'react-resize-detector', 'tiny-invariant',
          ];
          const PDF_DEPS = [
            'jspdf', 'canvg', 'html2canvas', 'dompurify', 'svg-pathdata',
            'stackblur-canvas', 'rgbcolor', 'fflate', 'core-js', 'raf',
            'performance-now', 'regenerator-runtime',
          ];

          if (CHART_DEPS.some((dep) => path.includes(dep))) {
            return 'charts';
          }
          if (PDF_DEPS.some((dep) => path.includes(dep))) {
            return 'pdf';
          }
          if (path.includes('framer-motion') || path.includes('popmotion') || path.includes('style-value-types')) {
            return 'motion';
          }
          if (path.includes('socket.io') || path.includes('engine.io')) {
            return 'realtime';
          }
          if (path.includes('lucide-react')) {
            return 'icons';
          }
          if (
            path.includes('/react/') ||
            path.includes('/react-dom/') ||
            path.includes('react-router') ||
            path.includes('@remix-run/router') ||
            path.includes('scheduler')
          ) {
            return 'react-vendor';
          }
          return 'vendor';
        },

        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
