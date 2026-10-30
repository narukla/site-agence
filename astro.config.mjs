// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Adresse publique du site : sert aux balises canonical et de partage, au sitemap et au robots.txt.
	// À remplacer par 'https://narukla.fr' (ou le domaine acheté) le jour où le domaine pointe vers Netlify.
	site: 'https://narukla.netlify.app',
});
