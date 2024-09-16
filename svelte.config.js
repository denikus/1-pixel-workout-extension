/** @type {import('@sveltejs/kit').Config} */
import adapter from 'sveltekit-adapter-chrome-extension';
// import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),

  kit: {
    // For the tutorial, we need to disable CSRF protection.
    // Don't do this in your own apps unless you know what you're doing!
    // See https://kit.svelte.dev/docs/configuration#csrf for more info.
    // csrf: false,
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null,
      precompress: false,
      manifest: 'manifest.json'
    }),
    appDir: 'app',
    // target: '#svelte',
    // inlineStyleThreshold: 0, // Disable inlining
    // csp: {
    //   mode: 'hash',
    //   directives: {
    //     'default-src': ['self'],
    //     'script-src': ['unsafe-inline'],
    //     'script-src-elem': ['self'],
    //     'object-src': ['none'],
    //     'style-src': ['self', 'https://fonts.googleapis.com'],
    //     'img-src': ['self', 'data:'],
    //     'connect-src': ['self'],
    //     'font-src': ['self', 'https://fonts.gstatic.com']
    //     // Add other directives as needed
    //   }
    //   // reportOnly: false // Set to true if you want to report only without enforcement
    // }
  },

  // vitePlugin: {
  //   // This enables compile-time warnings to be
  //   // visible in the learn.svelte.dev editor
  //   onwarn: (warning, defaultHandler) => {
  //     console.log('svelte:warnings:%s', JSON.stringify(warning));
  //     defaultHandler(warning);
  //   }
  // }
};

export default config;
