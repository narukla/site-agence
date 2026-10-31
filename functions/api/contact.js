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

import { coordonnees } from '../../src/config/coordonnees';

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
const MAX_MESSAGE = 5000;

// Discord refuse un champ de plus de 1 024 caractères : on coupe proprement
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
			},
		},
	);

export const onRequestPost = async ({ request, env }) => {
	const adresse = new URL(request.url);
	const merci = new URL('/merci/', adresse).toString();

	// Refuse un envoi lancé depuis un autre site
	const origine = request.headers.get('Origin');
	if (origine && new URL(origine).host !== adresse.host) {
		return pageErreur("L'envoi ne vient pas de notre site.", 403);
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
	const message = lire('message');

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
						color: VIOLET,
						fields: [
							{ name: 'Nom', value: valeur(nom), inline: true },
							{ name: 'Entreprise', value: valeur(entreprise), inline: true },
							{ name: 'Mail', value: valeur(mail), inline: true },
							{ name: 'Téléphone', value: valeur(telephone), inline: true },
							{ name: 'Besoin', value: besoin, inline: true },
							{ name: 'Message', value: valeur(message, 1024) },
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

	return Response.redirect(merci, 303);
};
