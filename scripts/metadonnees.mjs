// Détecte les métadonnées d'une image (EXIF : position GPS, téléphone, date ; XMP), sans dépendance.
// Utilisé par npm run photos (contrôle après nettoyage) et npm run verifier (contrôle avant mise en ligne).
// On cherche les signatures des blocs de métadonnées dans le fichier :
// - JPEG : segment APP1 « Exif » ou XMP
// - PNG : bloc eXIf, ou XMP dans un bloc iTXt
// - WebP : blocs EXIF ou XMP du conteneur RIFF
const SIGNATURES = ['Exif\0\0', 'http://ns.adobe.com/xap/1.0/', 'eXIf', 'XML:com.adobe.xmp'];

export const contientMetadonnees = (contenu) => {
	if (SIGNATURES.some((signature) => contenu.includes(Buffer.from(signature, 'latin1')))) return true;
	// WebP : les blocs ont un nom de 4 lettres suivi de leur taille
	if (contenu.subarray(0, 4).toString('latin1') === 'RIFF' && contenu.subarray(8, 12).toString('latin1') === 'WEBP') {
		for (let i = 12; i + 8 <= contenu.length; ) {
			const bloc = contenu.subarray(i, i + 4).toString('latin1');
			if (bloc === 'EXIF' || bloc === 'XMP ') return true;
			i += 8 + contenu.readUInt32LE(i + 4) + (contenu.readUInt32LE(i + 4) % 2);
		}
	}
	return false;
};
