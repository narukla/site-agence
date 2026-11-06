// Reçoit le formulaire de contact (POST /api/contact) et le transmet au salon Discord de l'équipe.
//
// Cloudflare Pages lance ce fichier tout seul : son emplacement (functions/api/contact.js) donne l'adresse.
// Cloudflare ne stocke pas les messages : le salon Discord en est la seule copie.
// Si Discord refuse, le visiteur en est donc informé et reçoit notre adresse mail : aucun message perdu en silence.
//
// RGPD : la notification contient les coordonnées et le message du client.
// - Le salon Discord doit rester PRIVÉ, réservé aux associés.
// - Discord est déclaré comme destinataire dans src/pages/mentions-legales.astro.
// - Les notifications sont soumises à la même durée de conservation que les messages (3 ans max).
//
// L'adresse du webhook Discord est un secret : elle est dans la variable d'environnement
// DISCORD_WEBHOOK_URL (Cloudflare → Settings → Variables and Secrets), jamais dans le code.
//
// Copie dans l'admin (admin.narukla.fr) : si la base D1 de l'admin est reliée au projet Pages sous le nom
// DB_ADMIN (Settings → Bindings), la demande y est aussi enregistrée, APRÈS l'envoi réussi sur Discord.
// Discord reste la copie principale : si l'écriture dans l'admin échoue, le visiteur n'est pas bloqué (erreur notée
// dans les journaux de Cloudflare). Requête préparée, jamais de valeur collée dans le SQL.
//
// Mails (5/11, gabarit aux couleurs de l'agence : src/lib/mail-narukla.js), envoyés par Resend si le secret
// RESEND_API_KEY existe dans le projet Pages, APRÈS la réponse au visiteur (waitUntil : il n'attend pas) :
// - accusé de réception au client. Anti-abus : un robot pourrait taper l'adresse d'un inconnu ; le mail ne contient
//   donc AUCUN texte écrit dans le formulaire (ni nom ni message), seulement le besoin choisi dans la liste et la date.
//   La limite Cloudflare (3 envois / 10 s par adresse IP) et le piège à robots s'appliquent avant.
// - copie de la demande à l'équipe (MAIL_EQUIPE, par défaut contact@narukla.fr) : « Répondre » écrit directement au client.
// Un échec d'envoi est noté dans les journaux de Cloudflare et ne bloque jamais le visiteur.

import { coordonnees } from '../../src/config/coordonnees';
import { mailNarukla } from '../../src/lib/mail-narukla.js';

// Mêmes valeurs que le <select id="besoin"> de src/pages/contact.astro
const BESOINS = {
	'site-vitrine': 'Site vitrine',
	'identite-visuelle': 'Identité visuelle',
	'site-et-identite': 'Site vitrine et identité visuelle',
	maintenance: "Maintenance d'un site existant",
	autre: 'Autre',
};

// Couleur de la notification : violet du Figma (#6E2FEF) en nombre, format demandé par Discord
const VIOLET = 0x6e2fef;

// Tailles maximales acceptées : au-delà, l'envoi est refusé (protection contre les envois abusifs)
const MAX_CHAMP = 200;
// Même valeur que le maxlength du champ dans src/pages/contact.astro. Une fois la mise en forme neutralisée,
// le message peut doubler de taille : 4 000 caractères tiennent dans la description d'un embed Discord (4 096 au plus)
const MAX_MESSAGE = 2000;
// Taille maximale de tout l'envoi, vérifiée avant de lire le formulaire : refuse un gros fichier envoyé exprès
const MAX_ENVOI = 64 * 1024;

// Discord refuse un champ de plus de 1 024 caractères : on coupe proprement les champs courts.
// Le message, lui, n'est jamais coupé : Discord en est la seule copie
const couper = (texte, max) => (texte.length > max ? `${texte.slice(0, max - 1)}…` : texte);

// Sécurité : le texte du client est affiché tel quel, sans mise en forme Discord.
// Sans ça, un message contenant [Facture](https://site-pirate.com) s'afficherait comme un lien
// propre « Facture » dans le salon : un piège à clic (hameçonnage). Une barre oblique devant chaque
// caractère de mise en forme le rend inactif ; une adresse écrite en clair reste visible.
const sansMiseEnForme = (texte) => texte.replace(/[\\`*_~|>#[\]()<]/g, '\\$&');

// Valeur affichée, ou « Non renseigné » si le champ facultatif est vide
const valeur = (texte, max = 256) => couper(sansMiseEnForme(texte) || 'Non renseigné', max);

// Page de secours quand l'envoi échoue : le visiteur garde un moyen de nous joindre
const pageErreur = (raison, statut) =>
	new Response(
		`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Message non envoyé | Narukla</title><h1>Votre message n'a pas été envoyé</h1><p>${raison}</p><p>Écrivez-nous directement à <a href="mailto:${coordonnees.mail}">${coordonnees.mail}</a>.</p><p><a href="/contact/">Revenir au formulaire</a></p></html>`,
		{
			status: statut,
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'X-Content-Type-Options': 'nosniff',
				'Cache-Control': 'no-store',
				// public/_headers ne s'applique pas aux réponses d'une fonction : cette page a donc ses propres en-têtes
				'Content-Security-Policy': "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
				'X-Frame-Options': 'DENY',
				'Referrer-Policy': 'strict-origin-when-cross-origin',
				'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
			},
		},
	);

// Origin peut valoir « null » (page isolée, certains navigateurs) : new URL() planterait et le visiteur verrait une erreur Cloudflare
const vientDuSite = (origine, hote) => {
	try {
		return new URL(origine).host === hote;
	} catch {
		return false;
	}
};

// Envoi d'un mail par l'API de Resend (https://resend.com/docs/api-reference/emails/send-email)
const envoyer = async (env, mail) => {
	const r = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ from: env.MAIL_EXPEDITEUR || `Narukla <${coordonnees.mail}>`, ...mail }),
	});
	if (!r.ok) console.error(`Resend a refusé un mail (code ${r.status}) : ${mail.subject}`);
};

const dateFr = () => new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric' });

function mails(env, d) {
	const accuse = mailNarukla({
		apercu: 'Votre demande est bien arrivée : on vous répond sous 2 jours ouvrés.',
		titre: 'Bien reçu, merci !',
		paragraphes: [
			'Bonjour,',
			// Retour de Noah (5/11) : « la lit » accrochait ; « l'a lue » serait faux (le mail part avant que quelqu'un l'ait lue)
			"Votre demande est bien arrivée chez Narukla. Un membre de l'équipe va la lire et vous répondra sous 2 jours ouvrés, par mail ou par téléphone.",
			"En attendant, vous pouvez déjà regarder nos offres. Et si c'est urgent, appelez-nous directement.",
		],
		lignes: [
			{ nom: 'Votre besoin', valeur: d.besoin },
			{ nom: 'Reçue le', valeur: dateFr() },
		],
		bouton: { texte: 'Voir nos offres', lien: 'https://narukla.fr/services/' },
		mention: "Vous recevez ce mail parce que cette adresse a été saisie dans le formulaire de contact de narukla.fr. Si ce n'est pas vous, ignorez-le : vous ne recevrez rien d'autre.",
	});
	const equipe = mailNarukla({
		apercu: `${d.besoin} · ${d.entreprise || d.nom}`,
		titre: 'Nouvelle demande',
		paragraphes: ["Une demande vient d'arriver par le formulaire de narukla.fr. « Répondre » écrit directement au client."],
		lignes: [
			{ nom: 'Nom', valeur: d.nom },
			{ nom: 'Entreprise', valeur: d.entreprise },
			{ nom: 'Mail', valeur: d.mail },
			{ nom: 'Téléphone', valeur: d.telephone },
			{ nom: 'Besoin', valeur: d.besoin },
		],
		citation: d.message,
		bouton: { texte: "Ouvrir dans l'admin", lien: 'https://admin.narukla.fr/demandes/' },
	});
	// Le sujet ne doit contenir aucun retour à la ligne (sinon on pourrait ajouter des en-têtes au mail)
	const qui = (d.entreprise || d.nom).replace(/[\r\n]+/g, ' ').slice(0, 60);
	return Promise.allSettled([
		envoyer(env, { to: [d.mail], reply_to: coordonnees.mail, subject: 'Narukla : nous avons bien reçu votre demande', html: accuse.html, text: accuse.text }),
		envoyer(env, { to: [env.MAIL_EQUIPE || coordonnees.mail], reply_to: d.mail, subject: `Nouvelle demande : ${d.besoin} · ${qui}`, html: equipe.html, text: equipe.text }),
	]);
}

export const onRequestPost = async ({ request, env, waitUntil }) => {
	const adresse = new URL(request.url);
	const merci = new URL('/merci/', adresse).toString();

	// Refuse un envoi lancé depuis un autre site
	const origine = request.headers.get('Origin');
	if (origine && !vientDuSite(origine, adresse.host)) {
		return pageErreur("L'envoi ne vient pas de notre site.", 403);
	}

	if (Number(request.headers.get('Content-Length')) > MAX_ENVOI) {
		return pageErreur('Votre message est trop long.', 413);
	}

	let formulaire;
	try {
		formulaire = await request.formData();
	} catch {
		return pageErreur('Le formulaire est illisible.', 400);
	}
	const lire = (nom) => String(formulaire.get(nom) ?? '').trim();

	// Piège à robots rempli : on fait croire à un succès, sans rien envoyer
	if (lire('champ-robot')) {
		return Response.redirect(merci, 303);
	}

	const nom = lire('nom');
	const entreprise = lire('entreprise');
	const mail = lire('mail');
	const telephone = lire('telephone');
	const besoin = BESOINS[lire('besoin')];
	// Un formulaire envoie ses retours à la ligne en CRLF, alors que le maxlength du navigateur les compte pour 1
	const message = lire('message').replace(/\r\n/g, '\n');

	const mailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
	const taillesValides =
		[nom, entreprise, mail, telephone].every((champ) => champ.length <= MAX_CHAMP) &&
		message.length <= MAX_MESSAGE;
	if (!nom || !mailValide || !besoin || !message || !taillesValides) {
		return pageErreur('Un champ obligatoire est vide, trop long ou mal rempli.', 400);
	}

	if (!env.DISCORD_WEBHOOK_URL) {
		console.error('DISCORD_WEBHOOK_URL absente : message non transmis');
		return pageErreur('Un problème technique nous empêche de le recevoir.', 500);
	}

	let reponse;
	try {
		reponse = await fetch(env.DISCORD_WEBHOOK_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				embeds: [
					{
						title: `📩 Nouveau message : ${besoin}`,
						description: sansMiseEnForme(message),
						color: VIOLET,
						fields: [
							{ name: 'Nom', value: valeur(nom), inline: true },
							{ name: 'Entreprise', value: valeur(entreprise), inline: true },
							{ name: 'Mail', value: valeur(mail), inline: true },
							{ name: 'Téléphone', value: valeur(telephone), inline: true },
							{ name: 'Besoin', value: besoin, inline: true },
						],
						timestamp: new Date().toISOString(),
					},
				],
				// Empêche toute mention (@everyone, @rôle) écrite par le client
				allowed_mentions: { parse: [] },
			}),
		});
	} catch (erreur) {
		console.error(`Discord injoignable : ${erreur}`);
		return pageErreur('Un problème technique nous empêche de le recevoir.', 502);
	}

	if (!reponse.ok) {
		console.error(`Discord a refusé la notification (code ${reponse.status})`);
		return pageErreur('Un problème technique nous empêche de le recevoir.', 502);
	}

	if (env.DB_ADMIN) {
		try {
			const recueLe = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
			await env.DB_ADMIN.prepare(
				'INSERT INTO demandes (recue_le, nom, entreprise, mail, telephone, besoin, message) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
			)
				.bind(recueLe, nom, entreprise, mail, telephone, besoin, message)
				.run();
		} catch (erreur) {
			console.error(`Demande non copiée dans l'admin : ${erreur}`);
		}
	}

	if (env.RESEND_API_KEY) {
		waitUntil(mails(env, { nom, entreprise, mail, telephone, besoin, message }));
	}

	return Response.redirect(merci, 303);
};
