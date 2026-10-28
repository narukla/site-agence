// Notification Discord à chaque message reçu par le formulaire de contact.
//
// Netlify lance cette fonction tout seul quand un formulaire est envoyé et validé
// (les envois classés en spam ne la déclenchent pas) : c'est le NOM DU FICHIER
// (submission-created) qui la déclenche. Ne pas le renommer.
//
// RGPD : la notification contient les coordonnées et le message du client.
// - Le salon Discord doit rester PRIVÉ, réservé aux associés.
// - Discord est déclaré comme destinataire dans src/pages/mentions-legales.astro.
// - Les notifications sont soumises à la même durée de conservation que les messages (3 ans max).
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

// Couleur de la notification : violet du Figma (#6E2FEF) en nombre, format demandé par Discord
const VIOLET = 0x6e2fef;

// Discord refuse un champ de plus de 1 024 caractères : on coupe proprement
const couper = (texte, max) => (texte.length > max ? `${texte.slice(0, max - 1)}…` : texte);

// Valeur affichée, ou « Non renseigné » si le champ facultatif est vide
const valeur = (texte, max = 256) => couper(String(texte ?? '').trim() || 'Non renseigné', max);

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

	const donnees = payload.data ?? {};
	const besoin = BESOINS[donnees.besoin] ?? 'Non précisé';

	// Lien vers la page Forms du projet dans Netlify (adresse vérifiée le 28/10 ; SITE_NAME est fourni par Netlify)
	const projet = process.env.SITE_NAME || 'narukla';
	const lienNetlify = `https://app.netlify.com/projects/${projet}/forms`;

	const reponse = await fetch(webhook, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			embeds: [
				{
					title: `📩 Nouveau message : ${besoin}`,
					url: lienNetlify,
					color: VIOLET,
					fields: [
						{ name: 'Nom', value: valeur(donnees.nom), inline: true },
						{ name: 'Entreprise', value: valeur(donnees.entreprise), inline: true },
						{ name: 'Mail', value: valeur(donnees.mail), inline: true },
						{ name: 'Téléphone', value: valeur(donnees.telephone), inline: true },
						{ name: 'Besoin', value: besoin, inline: true },
						{ name: 'Message', value: valeur(donnees.message, 1024) },
						{ name: 'Voir dans Netlify', value: lienNetlify },
					],
					timestamp: payload.created_at,
				},
			],
			// Empêche toute mention (@everyone, @rôle) écrite par le client
			allowed_mentions: { parse: [] },
		}),
	});

	if (!reponse.ok) {
		console.error(`Discord a refusé la notification (code ${reponse.status})`);
	}

	// Toujours 200 : une panne de Discord ne doit pas bloquer le formulaire
	return { statusCode: 200 };
};
