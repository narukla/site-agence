// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Adresse publique du site : sert aux balises canonical et de partage, au sitemap et au robots.txt.
	// Domaine narukla.fr (acheté chez HostMyServer), branché sur Netlify par les DNS.
	site: 'https://narukla.fr',

	// Politique de sécurité du contenu (CSP) générée par Astro : au build, Astro calcule l'empreinte (hash)
	// de chaque script et de chaque bloc <style> de la page et n'autorise que ceux-là. Un script injecté
	// par un pirate (faille XSS) ou ajouté par erreur n'a pas d'empreinte connue : le navigateur le bloque.
	// Elle s'ajoute à la CSP de public/_headers (frame-ancestors, form-action…) : les deux s'appliquent.
	security: {
		csp: {
			directives: [
				"default-src 'self'",
				"img-src 'self' data:",
				"font-src 'self'",
				"connect-src 'self'",
				"object-src 'none'",
				"base-uri 'self'",
				"form-action 'self'",
			],
			scriptDirective: { resources: ["'self'"] },
			styleDirective: {
				// Attributs style="…" autorisés : ils servent aux variables CSS (--i des cartes en cascade).
				// Ils ne peuvent pas exécuter de code, contrairement à un script.
				resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
			},
		},
	},
});
