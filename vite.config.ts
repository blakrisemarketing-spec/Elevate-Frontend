import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // CSS minification stays disabled: lightningcss (Vite 8 default) rejects
    // the WordPress/Elementor vendor CSS as "Invalid empty selector", and
    // the esbuild minifier needs an extra dep with a postinstall step. The
    // CSS is gzipped on the wire, so the marginal parse-size gain is not
    // worth the build instability for this WordPress-export migration.
    cssMinify: false,
    chunkSizeWarningLimit: 3000,
  },
});
