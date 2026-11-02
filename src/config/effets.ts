// Effets du labo d'effets actifs sur le site. Pour enlever un effet : supprimer (ou commenter) sa ligne.
// Chaque effet ajoute la classe avec-<nom> sur <html> (posée au build par Layout.astro, sans script)
// et son code vit dans src/components/Effets.astro. Tous sont coupés si « réduire les animations » est activé.
// Testés le 31/10 avec la CSP stricte (PR #24) : aucun script bloqué.
export const effetsActifs = [
	// Partout
	'curseur', // curseur flèche brutaliste (natif, en SVG)
	'barre', // barre de lecture violette en haut de l'écran
	'entete', // en-tête collant qui rétrécit (ordinateur)
	'menu-glisse', // menu : fond violet qui glisse d'un lien à l'autre
	'menu-roule', // menu : texte qui roule au survol
	'couches', // boutons à couches empilées
	'onde', // onde au clic sur les boutons
	'haut', // bouton retour en haut avec progression
	// 'melange' retiré le 2/11 (Jibril) : les lettres mélangées au survol du pied de page faisaient un effet gênant

	// Accueil
	'contour', // titres en contour qui se remplissent au défilement
	'projecteur', // lumière qui suit la souris sur les offres
	'etiquette-curseur', // étiquette « Voir » qui suit le curseur sur les offres
	'aimant', // bouton « Demander un devis » aimanté
	'vague', // lettres en vague sur « Un projet en tête ? »

	// L'équipe
	'incline', // cartes inclinées en 3D au survol
	'allume', // texte « Notre façon de travailler » qui s'allume mot à mot

	// Contact
	'tremble', // champ qui tremble s'il est refusé
	'compteur', // compteur de caractères du message (limite : maxlength du champ, 2 000)
	'envoi', // bouton « Envoi… » pendant l'envoi
	'copier', // bouton « Copier » à côté du mail

	// Merci et 404
	'confettis', // confettis sur la page Merci
	'glitch', // glitch sur le titre de la 404
] as const;
