// Contrôle du site en ligne, lancé toutes les 30 min par .github/workflows/surveiller.yml (sans dépendance).
// Vérifie que narukla.fr répond, qu'il affiche bien notre site, que ses protections sont en place,
// qu'aucun script extérieur n'est apparu et que le certificat HTTPS n'expire pas bientôt.
// En cas de problème : le contrôle échoue et, si DISCORD_ALERTES_URL existe, une alerte part sur Discord.
import tls from 'node:tls';

const SITE = process.env.SITE_URL ?? 'https://narukla.fr';
const PAGES = ['/', '/services/', '/equipe/', '/contact/', '/mentions-legales/'];
const EN_TETES = [
	'strict-transport-security',
	'content-security-policy',
	'x-frame-options',
	'x-content-type-options',
	'referrer-policy',
];
const JOURS_CERTIFICAT = 14;

const attendre = (ms) => new Promise((fin) => setTimeout(fin, ms));

// Une micro-coupure ne doit pas déclencher d'alerte : 3 essais avant de conclure
async function lire(url, options = {}) {
	let erreur;
	for (let essai = 0; essai < 3; essai++) {
		try {
			return await fetch(url, { signal: AbortSignal.timeout(15000), ...options });
		} catch (e) {
			erreur = e;
			await attendre(5000);
		}
	}
	throw erreur;
}

async function controlerPage(chemin) {
	const problemes = [];
	const reponse = await lire(SITE + chemin);
	if (reponse.status !== 200) return [`${chemin} répond ${reponse.status}`];

	const html = await reponse.text();
	if (!html.includes('Narukla')) problemes.push(`${chemin} n'affiche plus notre site`);
	if (!/http-equiv="content-security-policy"/i.test(html)) problemes.push(`${chemin} n'a plus sa CSP`);
	for (const nom of EN_TETES) {
		if (!reponse.headers.get(nom)) problemes.push(`${chemin} n'a plus l'en-tête ${nom}`);
	}
	for (const [, source] of html.matchAll(/<script[^>]*\ssrc=["']?([^"'\s>]+)/gi)) {
		if (!source.startsWith('/_astro/')) problemes.push(`${chemin} charge un script inconnu : ${source}`);
	}
	return problemes;
}

async function controlerRedirection(depuis) {
	const reponse = await lire(depuis, { redirect: 'manual' });
	const cible = reponse.headers.get('location') ?? '';
	return cible.startsWith(`${SITE}/`) ? [] : [`${depuis} ne redirige plus vers ${SITE} (${reponse.status})`];
}

function controlerCertificat() {
	const hote = new URL(SITE).hostname;
	return new Promise((resultat) => {
		const connexion = tls.connect({ host: hote, port: 443, servername: hote, timeout: 15000 }, () => {
			const jours = (new Date(connexion.getPeerCertificate().valid_to) - Date.now()) / 86400000;
			connexion.end();
			resultat(jours < JOURS_CERTIFICAT ? [`le certificat HTTPS expire dans ${Math.floor(jours)} jours`] : []);
		});
		connexion.on('timeout', () => connexion.destroy(new Error('délai dépassé')));
		connexion.on('error', (e) => resultat([`certificat HTTPS illisible : ${e.message}`]));
	});
}

async function alerter(problemes) {
	const adresse = process.env.DISCORD_ALERTES_URL;
	if (!adresse) return;
	const reponse = await fetch(adresse, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			content: `🚨 **Problème sur ${SITE}**\n${problemes.map((p) => `- ${p}`).join('\n')}`.slice(0, 1900),
			// Le texte peut contenir une adresse venue du site : aucune mention possible
			allowed_mentions: { parse: [] },
		}),
	});
	if (!reponse.ok) console.error(`Discord a refusé l'alerte (code ${reponse.status})`);
}

const controles = [
	...PAGES.map(controlerPage),
	...(process.env.SITE_URL ? [] : [controlerRedirection('https://www.narukla.fr/'), controlerRedirection('http://narukla.fr/')]),
	...(SITE.startsWith('https:') ? [controlerCertificat()] : []),
];
const resultats = await Promise.allSettled(controles);
const problemes = resultats.flatMap((r) => (r.status === 'fulfilled' ? r.value : [`site injoignable : ${r.reason.message}`]));

if (problemes.length) {
	console.error(problemes.join('\n'));
	await alerter(problemes);
	process.exitCode = 1;
} else {
	console.log(`✓ ${SITE} : ${PAGES.length} pages, en-têtes, scripts, redirections et certificat OK.`);
}
