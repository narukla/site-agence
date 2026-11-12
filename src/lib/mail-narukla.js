// Gabarit des mails de Narukla. Design d'Ouassim (Figma « Narukla Studio », page « Mail Narukla », 7/11) :
// en-tête noir avec le logo, bandeau titre noir, tableau récap à bordure, bouton à bord du bas épais, pied noir.
// Mis à jour d'après sa maquette du 8/11 : titres en Impact, tableau empilé sur mobile, signature et pied de contact.
// Copie identique dans le repo admin (src/lib/mail.ts) : garder les deux pareilles.
//
// Les messageries ne lisent qu'une partie du CSS : mise en page en tableaux, styles écrits sur chaque balise.
// Titres en Impact puis Arial Black (Figma, 8/11) : Anton n'est plus demandée, presque aucune messagerie ne la chargeait.
// Les titres sont écrits en majuscules dans le texte (Outlook gère mal text-transform).
// Mode sombre (Apple Mail, Outlook sur Mac) : classes + @media (prefers-color-scheme: dark), valeurs du Figma.
//
// SÉCURITÉ : tout texte passé ici est échappé (un nom « <script> » s'affiche tel quel, sans rien exécuter).
// Seuls les liens des boutons ne le sont pas : ils doivent venir de notre code, jamais d'un formulaire.

// Variables Figma « Mail — couleurs », thème Narukla
const ACCENT = '#6e2fef';
const NOIR = '#000000';
const BLANC = '#ffffff';
const DISCRET = '#595959'; // contraste 7:1 sur blanc
const ENCADRE = '#f2f2f2';
const TITRE = "Impact, 'Arial Black', sans-serif";
const TEXTE = 'Arial, Helvetica, sans-serif';
const SITE = 'https://narukla.fr';

export const echapper = (texte) =>
	String(texte ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Texte sur plusieurs lignes (message d'un client, réponse d'un associé) : échappé, retours à la ligne gardés
const multiligne = (texte) => echapper(texte).replace(/\r?\n/g, '<br>');
const majuscules = (texte) => String(texte ?? '').toLocaleUpperCase('fr-FR');

// Une ligne du mail = une cellule pleine largeur, marges de 32 px (20 px sous 480 px de large, classe « marge »)
const bloc = (haut, bas, contenu) =>
	`<tr><td class="marge carte" style="padding:${haut}px 32px ${bas}px;background:${BLANC};">${contenu}</td></tr>`;

/**
 * @param {object} m
 * @param {string} m.apercu       texte gris affiché après le sujet dans la boîte de réception
 * @param {string} m.titre        gros titre du bandeau (mis en majuscules ici)
 * @param {string[]} [m.paragraphes]
 * @param {{nom: string, valeur: string}[]} [m.lignes]   tableau récapitulatif
 * @param {string} [m.citation]   long texte encadré (message du client)
 * @param {string} [m.etiquetteCitation]   petit titre de l'encadré
 * @param {{texte: string, lien: string}} [m.bouton]
 * @param {{nom: string, fonction: string}} [m.signature]  qui signe (« Cordialement, » puis nom en gras et fonction)
 * @param {string} [m.mention]    petite ligne grise en bas (pourquoi on reçoit ce mail)
 * @returns {{ html: string, text: string }}
 */
export function mailNarukla({ apercu, titre, paragraphes = [], lignes = [], citation, etiquetteCitation = 'Message', bouton, signature, mention }) {
	const blocs = [];

	paragraphes.forEach((t) =>
		blocs.push(bloc(12, 12, `<p class="texte" style="margin:0;font-family:${TEXTE};font-size:16px;line-height:24px;color:${NOIR};">${multiligne(t)}</p>`)),
	);

	// Cadre de 3 px et traits de 2 px : fond noir + cellspacing="2" + bordure de 1 px
	if (lignes.length)
		blocs.push(
			bloc(
				12,
				12,
				`<table role="presentation" class="bordure" width="100%" cellpadding="0" cellspacing="2" style="background:${NOIR};border:1px solid ${NOIR};">${lignes
					.map(
						(l) =>
							`<tr><td class="encadre discret etiquette" width="150" style="width:118px;padding:14px 16px;background:${ENCADRE};font-family:${TEXTE};font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.6px;color:${DISCRET};vertical-align:middle;">${echapper(majuscules(l.nom))}</td><td class="carte texte valeur" style="padding:14px 16px;background:${BLANC};font-family:${TEXTE};font-size:16px;line-height:24px;color:${NOIR};vertical-align:middle;overflow-wrap:anywhere;word-break:break-word;">${multiligne(l.valeur || '—')}</td></tr>`,
					)
					.join('')}</table>`,
			),
		);

	if (citation)
		blocs.push(
			bloc(
				12,
				28,
				`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td class="encadre accent-gauche" style="padding:20px;background:${ENCADRE};border-left:6px solid ${ACCENT};overflow-wrap:anywhere;word-break:break-word;"><p class="discret" style="margin:0 0 8px;font-family:${TEXTE};font-size:12px;line-height:16px;font-weight:700;letter-spacing:1px;color:${DISCRET};">${echapper(majuscules(etiquetteCitation))}</p><p class="texte" style="margin:0;font-family:${TEXTE};font-size:16px;line-height:24px;color:${NOIR};">${multiligne(citation)}</p></td></tr></table>`,
			),
		);

	// Bouton : cellule colorée + lien, bord du bas de 8 px à la place de l'ombre (au moins 56 px de haut)
	if (bouton)
		blocs.push(
			bloc(
				16,
				16,
				`<table role="presentation" cellpadding="0" cellspacing="0"><tr><td class="bouton" style="background:${ACCENT};border:3px solid ${NOIR};border-bottom-width:8px;"><a href="${bouton.lien}" style="display:inline-block;padding:16px 28px;font-family:${TITRE};font-size:20px;line-height:24px;letter-spacing:0.8px;color:${BLANC};text-decoration:none;">${echapper(majuscules(bouton.texte))}</a></td></tr></table>`,
			),
		);

	if (signature)
		blocs.push(
			bloc(
				12,
				28,
				`<p class="texte" style="margin:0 0 4px;font-family:${TEXTE};font-size:16px;line-height:24px;color:${NOIR};">Cordialement,</p><p class="texte" style="margin:0 0 4px;font-family:${TEXTE};font-size:16px;line-height:24px;font-weight:700;color:${NOIR};">${echapper(signature.nom)}</p><p class="discret" style="margin:0;font-family:${TEXTE};font-size:14px;line-height:20px;color:${DISCRET};">${echapper(signature.fonction)}</p>`,
			),
		);

	if (mention)
		blocs.push(bloc(16, 20, `<p class="discret" style="margin:0;font-family:${TEXTE};font-size:12px;line-height:18px;color:${DISCRET};">${echapper(mention)}</p>`));

	// Le dernier bloc ne doit pas coller au pied : 28 px sous un paragraphe ou un tableau
	if (blocs.length && !citation && !bouton && !signature && !mention) blocs[blocs.length - 1] = blocs[blocs.length - 1].replace(/padding:12px 32px 12px/, 'padding:12px 32px 28px');

	const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${echapper(titre)}</title>
<style>
@media (max-width: 480px) {
	.marge { padding-left: 20px !important; padding-right: 20px !important; }
	.titre { font-size: 30px !important; }
	/* Tableau récap : étiquette au-dessus de la valeur, séparées par un trait de 2 px */
	.etiquette, .valeur { display: block !important; width: auto !important; }
	.etiquette { padding: 10px 16px !important; border-bottom: 2px solid #000000 !important; }
	.valeur { padding: 12px 16px !important; }
}
@media (prefers-color-scheme: dark) {
	.carte, body { background: #121212 !important; }
	.texte { color: #ffffff !important; }
	.discret { color: #b8b8b8 !important; }
	.encadre { background: #1f1f1f !important; }
	.bordure { background: #5a5a5a !important; border-color: #5a5a5a !important; }
	.bandeau { background: ${ACCENT} !important; }
	.accent-gauche { border-left-color: #a98bff !important; }
	.accent-bas { border-bottom-color: #a98bff !important; }
	.accent-haut { border-top-color: #a98bff !important; }
	.bouton { border-color: #ffffff !important; }
	.etiquette { border-bottom-color: #5a5a5a !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background:${BLANC};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="carte" style="background:${BLANC};">
<tr><td align="center" style="padding:0;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
		<tr><td class="marge accent-bas" style="padding:22px 32px;background:${NOIR};border-bottom:6px solid ${ACCENT};">
			<a href="${SITE}/" style="text-decoration:none;"><img src="${SITE}/mail/narukla-logo.png" width="140" height="52" alt="Narukla" style="display:block;border:0;width:140px;height:auto;"></a>
		</td></tr>
		<tr><td class="marge bandeau" style="padding:36px 32px;background:${NOIR};">
			<h1 class="titre" style="margin:0;font-family:${TITRE};font-weight:400;font-size:40px;line-height:1.05;color:${BLANC};overflow-wrap:anywhere;">${echapper(majuscules(titre))}</h1>
		</td></tr>
		${blocs.join('\n\t\t')}
		<tr><td class="marge accent-haut" style="padding:28px 32px 32px;background:${NOIR};border-top:6px solid ${ACCENT};font-family:${TEXTE};font-size:13px;line-height:20px;color:${BLANC};">
			<strong>Narukla · Agence web à Troyes</strong><br>
			<a href="mailto:contact@narukla.fr" style="color:${BLANC};text-decoration:none;white-space:nowrap;">contact@narukla.fr</a> · <a href="tel:+33788021676" style="color:${BLANC};text-decoration:none;white-space:nowrap;">07 88 02 16 76</a> · <a href="https://www.instagram.com/narukla_studio/" style="color:${BLANC};text-decoration:none;white-space:nowrap;">Instagram @narukla_studio</a><br>
			<a href="${SITE}/" style="color:${BLANC};text-decoration:none;white-space:nowrap;">narukla.fr</a> · <a href="${SITE}/mentions-legales/" style="color:${BLANC};text-decoration:none;white-space:nowrap;">Mentions légales</a>
		</td></tr>
	</table>
</td></tr>
</table>
</body>
</html>`;

	// Version texte : lue par les messageries sans HTML, et elle évite d'être classé en spam
	const text = [
		majuscules(titre),
		'',
		...paragraphes.flatMap((t) => [t, '']),
		...lignes.map((l) => `${l.nom} : ${l.valeur || '—'}`),
		...(lignes.length ? [''] : []),
		...(citation ? [`${etiquetteCitation} :`, citation, ''] : []),
		...(bouton ? [`${bouton.texte} : ${bouton.lien}`, ''] : []),
		...(signature ? ['Cordialement,', signature.nom, signature.fonction, ''] : []),
		...(mention ? [mention, ''] : []),
		'--',
		'Narukla · Agence web à Troyes',
		'contact@narukla.fr · 07 88 02 16 76 · Instagram @narukla_studio',
		'narukla.fr',
	].join('\n');

	return { html, text };
}
