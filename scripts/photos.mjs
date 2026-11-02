// Prépare les photos de L'équipe avant le commit : npm run photos
// Le repo est public : la photo d'origine est commitée telle quelle, avec ses métadonnées (position GPS,
// modèle du téléphone, date). Astro nettoie les WebP qu'il génère, pas le fichier d'origine.
//
// Pour chaque photo de src/assets/equipe/ :
// - tourne l'image dans le bon sens (orientation EXIF des téléphones), puis retire toutes les métadonnées
// - la réduit à 2 400 px de côté au plus (assez pour les 3 tailles du site, repo plus léger)
// - refuse les .heic (iPhone) : sharp ne sait pas les lire, voir LISEZMOI.md
//
// sharp est déjà installé avec Astro (dépendance facultative d'astro, utilisée pour <Image>) : aucune dépendance en plus.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { contientMetadonnees } from './metadonnees.mjs';

const DOSSIER = 'src/assets/equipe';
const COTE_MAX = 2400;

let refus = 0;
for (const nom of readdirSync(DOSSIER).sort()) {
	const chemin = join(DOSSIER, nom);
	if (/\.(heic|heif)$/i.test(nom)) {
		console.error(`✗ ${nom} : format HEIC (iPhone) non lu par Astro. Le convertir en JPG d'abord (voir LISEZMOI.md).`);
		refus++;
		continue;
	}
	if (!/\.(jpe?g|png|webp)$/i.test(nom)) continue;

	const avant = readFileSync(chemin);
	// Déjà propre et à la bonne taille : on n'y touche pas (chaque recompression perd un peu de qualité)
	const infos = await sharp(avant).metadata();
	if (!contientMetadonnees(avant) && Math.max(infos.width, infos.height) <= COTE_MAX) {
		console.log(`✓ ${nom} : déjà prête, inchangée`);
		continue;
	}
	const image = sharp(avant).rotate().resize(COTE_MAX, COTE_MAX, { fit: 'inside', withoutEnlargement: true });
	// Même format qu'à l'origine : le nom du fichier ne change pas, la page le retrouve
	const apres = /\.png$/i.test(nom)
		? await image.png().toBuffer()
		: /\.webp$/i.test(nom)
			? await image.webp({ quality: 90 }).toBuffer()
			: await image.jpeg({ quality: 90, mozjpeg: true }).toBuffer();

	if (contientMetadonnees(apres)) {
		console.error(`✗ ${nom} : métadonnées encore présentes après nettoyage, ne pas committer.`);
		refus++;
		continue;
	}
	writeFileSync(chemin, apres);
	const { width, height } = await sharp(apres).metadata();
	console.log(`✓ ${nom} : ${width}×${height}, ${Math.round(avant.length / 1024)} → ${Math.round(apres.length / 1024)} Ko, sans métadonnées`);
}

if (refus) process.exit(1);
