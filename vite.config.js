import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  rollupOptions: {
      input: {
        background: 'src/background.js'
      },
      output: {
        entryFileNames: 'background.js'
      }
    }
  // build: {
  //   rollupOptions: {
  //     input: 'src/routes/settings' // specify your entry point
  //   }
  // },
  // build: {
  //   rollupOptions: {
  //     output: {
  //       inlineDynamicImports: false,
  //       manualChunks: undefined
  //     }
  //   }
  // },
  // Normally this would be unnecessary, but we
  // need it for learn.svelte.dev
  // server: {
  //   fs: {
  //     strict: false
  //   }
  // }
});
