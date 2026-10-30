// robots.txt : autorise tous les robots et indique le plan du site.
// Généré au build en dist/robots.txt, avec le domaine de astro.config.mjs (site).
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
	new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site)}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
