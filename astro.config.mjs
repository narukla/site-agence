// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Adresse publique du site : sert aux balises canonical et de partage, au sitemap et au robots.txt.
	// Domaine narukla.fr (acheté chez HostMyServer), branché sur Netlify par les DNS.
	site: 'https://narukla.fr',
});
