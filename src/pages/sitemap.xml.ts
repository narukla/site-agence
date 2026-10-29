// Plan du site pour Google : généré au build en dist/sitemap.xml, sans dépendance.
// Le domaine vient de astro.config.mjs (site). Ajouter ici toute nouvelle page publique.
// Merci et 404 n'y sont pas : elles sont en noindex.
import type { APIRoute } from 'astro';

const pages = ['/', '/services/', '/realisations/', '/equipe/', '/contact/', '/mentions-legales/'];

export const GET: APIRoute = ({ site }) => {
	const urls = pages
		.map((page) => `\t<url>\n\t\t<loc>${new URL(page, site)}</loc>\n\t</url>`)
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
