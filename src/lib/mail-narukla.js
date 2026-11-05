// Gabarit des mails de Narukla (demande de Jibril, 5/11) : même style que le site (noir, violet #6E2FEF, Anton,
// bordures épaisses façon néo-brutaliste). Copie identique dans le repo admin (src/lib/mail.ts) : garder les deux pareilles.
//
// Les messageries ne lisent qu'une partie du CSS : mise en page en tableaux, styles écrits sur chaque balise,
// pas de box-shadow (l'ombre noire du site est imitée par une bordure plus épaisse à droite et en bas).
// Anton est demandée depuis narukla.fr ; les messageries qui ne la chargent pas prennent Impact puis Arial Black.
//
// SÉCURITÉ : tout texte passé ici est échappé (un nom « <script> » s'affiche tel quel, sans rien exécuter).
// Seuls les liens des boutons ne le sont pas : ils doivent venir de notre code, jamais d'un formulaire.

const VIOLET = '#6e2fef';
const NOIR = '#000000';
const BLANC = '#ffffff';
const FOND = '#f1edfc';
const TITRE = "Anton, Impact, 'Arial Black', sans-serif";
const TEXTE = "Archivo, 'Segoe UI', Helvetica, Arial, sans-serif";
const SITE = 'https://narukla.fr';

export const echapper = (texte) =>
	String(texte ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Texte sur plusieurs lignes (message d'un client, réponse d'un associé) : échappé, retours à la ligne gardés
const multiligne = (texte) => echapper(texte).replace(/\r?\n/g, '<br>');

/**
 * @param {object} m
 * @param {string} m.apercu       texte gris affiché après le sujet dans la boîte de réception
 * @param {string} m.titre        gros titre dans le bandeau violet
 * @param {string[]} [m.paragraphes]
 * @param {{nom: string, valeur: string}[]} [m.lignes]   petit tableau récapitulatif
 * @param {string} [m.citation]   long texte encadré (message du client, réponse d'un associé)
 * @param {{texte: string, lien: string}} [m.bouton]
 * @param {string} [m.mention]    petite ligne grise tout en bas (pourquoi on reçoit ce mail)
 * @returns {{ html: string, text: string }}
 */
export function mailNarukla({ apercu, titre, paragraphes = [], lignes = [], citation, bouton, mention }) {
	const p = (t) => `<p style="margin:0 0 16px;font-family:${TEXTE};font-size:16px;line-height:1.6;color:${NOIR};">${multiligne(t)}</p>`;

	const tableau = lignes.length
		? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;border-collapse:collapse;">${lignes
				.map(
					(l) =>
						`<tr><td style="padding:8px 12px 8px 0;border-bottom:2px solid ${FOND};font-family:${TEXTE};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:${VIOLET};white-space:nowrap;vertical-align:top;">${echapper(l.nom)}</td><td style="padding:8px 0;border-bottom:2px solid ${FOND};font-family:${TEXTE};font-size:15px;color:${NOIR};">${multiligne(l.valeur || '—')}</td></tr>`,
				)
				.join('')}</table>`
		: '';

	const encadre = citation
		? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td style="padding:16px 18px;background:${FOND};border-left:6px solid ${VIOLET};font-family:${TEXTE};font-size:15px;line-height:1.6;color:${NOIR};">${multiligne(citation)}</td></tr></table>`
		: '';

	const lienBouton = bouton
		? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="background:${VIOLET};border:3px solid ${NOIR};border-right-width:6px;border-bottom-width:6px;"><a href="${bouton.lien}" style="display:inline-block;padding:13px 24px;font-family:${TITRE};font-size:17px;letter-spacing:0.04em;text-transform:uppercase;color:${BLANC};text-decoration:none;">${echapper(bouton.texte)}</a></td></tr></table>`
		: '';

	const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${echapper(titre)}</title>
<style>
@font-face { font-family: Anton; src: url('${SITE}/fonts/anton-400.woff2') format('woff2'); }
@font-face { font-family: Archivo; src: url('${SITE}/fonts/archivo-400.woff2') format('woff2'); }
@media (max-width: 620px) { .carte { padding: 24px 20px !important; } .titre { font-size: 30px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:${FOND};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FOND};">
<tr><td align="center" style="padding:28px 12px;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border:3px solid ${NOIR};border-right-width:10px;border-bottom-width:10px;background:${BLANC};">
		<tr><td style="background:${NOIR};padding:22px 28px;">
			<a href="${SITE}/" style="text-decoration:none;"><img src="${SITE}/mail/narukla-logo.png" width="170" height="63" alt="Narukla" style="display:block;border:0;width:170px;height:auto;"></a>
		</td></tr>
		<tr><td style="background:${VIOLET};padding:22px 28px;border-top:3px solid ${NOIR};border-bottom:3px solid ${NOIR};">
			<h1 class="titre" style="margin:0;font-family:${TITRE};font-weight:400;font-size:36px;line-height:1.05;text-transform:uppercase;color:${BLANC};">${echapper(titre)}</h1>
		</td></tr>
		<tr><td class="carte" style="padding:30px 28px;">
			${paragraphes.map(p).join('\n\t\t\t')}
			${tableau}
			${encadre}
			${lienBouton}
		</td></tr>
		<tr><td style="background:${NOIR};padding:18px 28px;font-family:${TEXTE};font-size:13px;line-height:1.6;color:#cfc8dc;">
			<strong style="font-family:${TITRE};font-weight:400;font-size:15px;letter-spacing:0.04em;text-transform:uppercase;color:${BLANC};">Narukla</strong> · Agence web à Troyes<br>
			<a href="mailto:contact@narukla.fr" style="color:${BLANC};">contact@narukla.fr</a> · <a href="tel:+33788021676" style="color:${BLANC};">07 88 02 16 76</a> · <a href="${SITE}/" style="color:${BLANC};">narukla.fr</a>
		</td></tr>
	</table>
	${mention ? `<p style="max-width:600px;margin:16px auto 0;font-family:${TEXTE};font-size:12px;line-height:1.5;color:#6b6478;">${echapper(mention)}</p>` : ''}
</td></tr>
</table>
</body>
</html>`;

	// Version texte : lue par les messageries sans HTML, et elle évite d'être classé en spam
	const text = [
		titre.toUpperCase(),
		'',
		...paragraphes.flatMap((t) => [t, '']),
		...lignes.map((l) => `${l.nom} : ${l.valeur || '—'}`),
		...(lignes.length ? [''] : []),
		...(citation ? [citation, ''] : []),
		...(bouton ? [`${bouton.texte} : ${bouton.lien}`, ''] : []),
		'--',
		'Narukla · Agence web à Troyes',
		'contact@narukla.fr · 07 88 02 16 76 · narukla.fr',
		...(mention ? ['', mention] : []),
	].join('\n');

	return { html, text };
}
