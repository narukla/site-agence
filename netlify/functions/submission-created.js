// Notification Discord à chaque message reçu par le formulaire de contact.
//
// Netlify lance cette fonction tout seul quand un formulaire est envoyé et validé :
// c'est le NOM DU FICHIER (submission-created) qui la déclenche. Ne pas le renommer.
//
// RGPD : le message posté dans Discord ne contient AUCUNE donnée personnelle
// (ni nom, ni mail, ni téléphone, ni texte du client), seulement le type de besoin.
// Les coordonnées restent dans l'onglet Forms de Netlify.
//
// L'adresse du webhook Discord est un secret : elle est dans la variable d'environnement
// DISCORD_WEBHOOK_URL (Netlify → Environment variables), jamais dans le code.

// Mêmes valeurs que le <select id="besoin"> de src/pages/contact.astro
const BESOINS = {
	'site-vitrine': 'Site vitrine',
	'identite-visuelle': 'Identité visuelle',
	'site-et-identite': 'Site vitrine et identité visuelle',
	maintenance: "Maintenance d'un site existant",
	autre: 'Autre',
};

export const handler = async (event) => {
	const webhook = process.env.DISCORD_WEBHOOK_URL;
	if (!webhook) {
		console.log('DISCORD_WEBHOOK_URL absente : pas de notification Discord');
		return { statusCode: 200 };
	}

	const { payload } = JSON.parse(event.body);
	if (payload.form_name !== 'contact') {
		return { statusCode: 200 };
	}

	const besoin = BESOINS[payload.data?.besoin] ?? 'Non précisé';

	const reponse = await fetch(webhook, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			content: `📩 **Nouveau message sur le site**\nBesoin : ${besoin}\nÀ traiter depuis l'onglet Forms de Netlify.`,
			// Empêche toute mention (@everyone, @rôle) dans le message
			allowed_mentions: { parse: [] },
		}),
	});

	if (!reponse.ok) {
		console.error(`Discord a refusé la notification (code ${reponse.status})`);
	}

	// Toujours 200 : une panne de Discord ne doit pas bloquer le formulaire
	return { statusCode: 200 };
};
