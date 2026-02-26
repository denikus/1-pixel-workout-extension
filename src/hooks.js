/** @type {import('@sveltejs/kit').Reroute} */
export function reroute({ url }) {
  if (url.pathname.endsWith('.html')) {
    return url.pathname.slice(0, -5);
  }
}
