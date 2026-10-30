// Coordonnées de l'agence, à un seul endroit pour tout le site (idée de Jimmy, relecture de la #15).
// Utilisées par le pied de page, la page Contact et les mentions légales.
// Au passage au domaine en .fr : changer le mail ici, et c'est tout.
export const coordonnees = {
	mail: 'narukla@proton.me',
	// Numéro de Jimmy (commercial), donné le 28/10
	telephone: '07 88 02 16 76',
	ville: 'Troyes (10)',
};

// Lien tel: au format international (07 88… → tel:+33788…), pour appeler aussi depuis l'étranger
export const lienTelephone = (numero: string) => `tel:+33${numero.replace(/\s/g, '').slice(1)}`;
