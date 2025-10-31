import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'build',
    emptyOutDir: false, // don't wipe the SvelteKit/adapter output
    lib: {
      entry: 'src/background.js', // or .ts
      formats: ['es'],
      fileName: () => 'background',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'background.js',
      },
    },
  },
});