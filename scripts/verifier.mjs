// Vérifications automatiques du site construit (dossier dist/), sans aucune dépendance.
// Lancement : npm run build, puis npm run verifier. GitHub le lance aussi sur chaque PR
// (.github/workflows/verifier.yml). Le script s'arrête en erreur si un point bloque la mise en ligne.
//
// Ce qu'il vérifie sur chaque page :
// - un seul titre principal <h1>, et pas de niveau de titre sauté (h2 puis h4)
// - aucun repère oublié visible ([À COMPLÉTER], lorem, TODO), sauf sur les pages en noindex
//   (cachées de Google : Réalisations tant qu'elle n'est pas prête, Merci, 404)
// - chaque lien interne mène à une page qui existe
// - chaque image a un texte alternatif (alt), même vide pour une image décorative
// - aucun id en double (sinon les ancres et les scripts visent le mauvais élément)
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
if (!existsSync(DIST)) {
	console.error('Pas de dossier dist/ : lance d\'abord « npm run build ».');
	process.exit(1);
}

// Toutes les pages HTML construites
const pages = [];
const parcourir = (dossier) => {
	for (const nom of readdirSync(dossier)) {
		const chemin = join(dossier, nom);
		if (statSync(chemin).isDirectory()) parcourir(chemin);
		else if (nom.endsWith('.html')) pages.push(chemin);
	}
};
parcourir(DIST);

// Une adresse interne existe si dist/ contient le fichier, ou le dossier avec un index.html
const existe = (adresse) => {
	const propre = decodeURI(adresse.split('#')[0].split('?')[0]).replace(/^\//, '');
	if (propre === '') return true;
	return [propre, join(propre, 'index.html'), `${propre.replace(/\/$/, '')}.html`].some((c) => existsSync(join(DIST, c)));
};

// Texte visible approximatif : sans scripts, styles, commentaires ni balises
const texteVisible = (html) =>
	html
		.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ');

let erreurs = 0;
const signaler = (page, message) => {
	erreurs++;
	console.error(`✗ ${page} : ${message}`);
};

for (const fichier of pages.sort()) {
	const page = `/${relative(DIST, fichier).replace(/\\/g, '/')}`;
	const html = readFileSync(fichier, 'utf8');
	const cachee = /<meta name="robots" content="[^"]*noindex/i.test(html);

	const h1 = (html.match(/<h1[\s>]/gi) || []).length;
	if (h1 !== 1) signaler(page, `${h1} titres <h1> (il en faut exactement 1)`);

	const niveaux = [...html.matchAll(/<h([1-6])[\s>]/gi)].map((m) => Number(m[1]));
	niveaux.forEach((n, i) => {
		if (i > 0 && n - niveaux[i - 1] > 1) signaler(page, `titre h${n} juste après un h${niveaux[i - 1]} (niveau sauté)`);
	});

	if (!cachee) {
		const texte = texteVisible(html);
		for (const repere of ['[À COMPLÉTER', 'lorem ipsum', 'TODO']) {
			if (texte.toLowerCase().includes(repere.toLowerCase())) signaler(page, `repère « ${repere} » visible`);
		}
	}

	for (const [, adresse] of html.matchAll(/<a\s[^>]*href="(\/[^"]*)"/gi)) {
		if (!adresse.startsWith('//') && !existe(adresse)) signaler(page, `lien interne cassé : ${adresse}`);
	}

	for (const [img] of html.matchAll(/<img\s[^>]*>/gi)) {
		if (!/\salt="/i.test(img)) signaler(page, `image sans alt : ${img.slice(0, 80)}`);
	}

	const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
	const doublons = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
	if (doublons.length) signaler(page, `id en double : ${doublons.join(', ')}`);
}

if (erreurs) {
	console.error(`\n${erreurs} problème(s) sur ${pages.length} pages.`);
	process.exit(1);
}
console.log(`✓ ${pages.length} pages vérifiées : aucun problème.`);
