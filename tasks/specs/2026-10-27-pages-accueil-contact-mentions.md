# Spec — Pages Accueil, Contact et Mentions légales
Auteur : Jimmy · Date : 27/10/2026 · Statut : brouillon (à valider par le chef de projet)

## Objectif
Qu'un commerçant de Troyes comprenne en 10 secondes ce que fait Narukla, voie les prix et puisse
demander un devis ; et que le site soit en règle (LCEN, RGPD) avant la mise en ligne.

## Pour qui
Commerçants, artisans et indépendants, surtout sur téléphone, qui cherchent un site ou un logo.

## Ce qu'on construit
- Accueil : accroche, 3 offres avec prix (liens vers Services), 4 étapes, 3 arguments, appel à l'action
- Contact : formulaire Netlify Forms (nom, entreprise, mail, téléphone, besoin, message) avec champ
  piège anti-spam et mention RGPD, coordonnées affichées seulement quand elles existent
- Page /merci après l'envoi du formulaire
- Mentions légales : éditeur, hébergeur, propriété intellectuelle, données personnelles, cookies

## Hors périmètre (pour cette fois)
- CSS : il arrive avec la maquette Figma (mer. 28), dans une PR à part
- Logo dans l'en-tête (Noah, jeu. 29) ; header et footer restent ceux de Jibril
- Page 404, sitemap, Open Graph : à voir avec la checklist `livraison`

## Contenus nécessaires
| Contenu | Fourni par | Pour quand | Reçu ? |
|---|---|---|---|
| Mail, téléphone, Instagram de l'agence | Jimmy (après achat du .fr) | Avant la mise en ligne | Non |
| Capital, SIREN, siège, TVA, nom de famille du président | Jibril / Noah (Kbis) | Avant la mise en ligne | Non |
| Téléphone de l'hébergeur Netlify | Jibril | Avant la mise en ligne | Non |

## Contraintes
Mobile d'abord, un seul h1 par page, title et description uniques, labels reliés aux champs,
aucune nouvelle dépendance, aucun script ou police externe, prix identiques à la page Services.

## C'est fini quand…
- [ ] Les 3 offres et leurs prix de l'Accueil sont les mêmes que sur Services et tarifs
- [ ] Un message envoyé depuis /contact sur Netlify arrive dans l'onglet Forms et renvoie vers /merci
- [ ] Plus aucun `[À COMPLÉTER]` dans les mentions légales au moment de la mise en ligne
- [ ] Skill `verifier` passé, rendu mobile 375 px et desktop contrôlés

## Découpage
| # | Tâche | Qui | Dépend de |
|---|---|---|---|
| 1 | Structure HTML des trois pages + /merci (cette PR) | Jimmy | Layout de Jibril |
| 2 | CSS des trois pages | Jimmy | Maquette Figma |
| 3 | Compléter coordonnées et infos légales | Jimmy | Kbis, domaine |

## Questions ouvertes
- Délai de réponse annoncé « sous 48 h » : on s'y engage ? → réunion de jeudi
- Durée de conservation des messages : 3 ans, ça vous va ? → réunion de jeudi
