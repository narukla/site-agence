# Photos de L'équipe

Déposer ici une photo par associé, nommée avec le prénom en minuscules, sans accent :
`jibril.jpg`, `noah.jpg`, `ouassim.jpg` (`.jpeg`, `.png` ou `.webp` marchent aussi).

## Avant de committer : `npm run photos`

Le repo est public et la photo d'origine y est commitée telle quelle. Une photo de téléphone contient
des métadonnées : **position GPS**, modèle du téléphone, date. Astro les retire des WebP qu'il génère,
pas du fichier d'origine.

`npm run photos` retire toutes les métadonnées, remet la photo dans le bon sens et la réduit à 2 400 px.
Si on oublie, `npm run verifier` (lancé aussi par GitHub sur chaque PR) bloque la PR.

## iPhone : pas de HEIC

Astro ne lit pas le format HEIC des iPhone. Deux solutions :
- **Avant la photo** : Réglages → Appareil photo → Formats → **Le plus compatible**. Les photos sont prises en JPG.
- **Après** : sur Windows, ouvrir la photo dans l'application Photos → « Enregistrer sous » → JPG.

## Le reste

- Au build, Astro convertit la photo en WebP en 3 tailles (400, 800 et 1 200 px) : pas besoin de la réduire à la main.
- Le cadre est carré sur ordinateur, un peu plus large que haut (7/6) sur téléphone : garder le visage au centre.
- Sans photo, la carte affiche l'initiale, comme avant.
- Chaque associé doit être d'accord pour que sa photo soit en ligne (droit à l'image).
