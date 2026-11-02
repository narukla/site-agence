// Défilement fluide, comme sur le site de travail de Jibril (BUT2/site de travail/assets/motion.js, sections 1 et 4 bis) :
// - « amorti » : Lenis lisse la molette sur tout le site (le tactile garde le défilement natif du téléphone)
// - « etapes-epinglees » : sur l'Accueil, la section « Comment ça se passe » se fige et les 4 étapes défilent de côté
//   (GSAP + ScrollTrigger), sur ordinateur seulement
// Chargé par Effets.astro seulement si l'un des deux effets est actif et si la personne accepte les animations.
// Les librairies viennent de npm et sont servies par le site : aucun CDN (RGPD), compatible avec la CSP.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

interface Options {
	amorti: boolean;
	// La section des étapes, si l'effet est actif et que la page en a une
	etapes: HTMLElement | null;
}

// Même condition que l'épinglage plus bas : testée AVANT de télécharger GSAP (remarque de Jimmy, 2/11),
// pour que les téléphones ne chargent pas 110 Ko pour rien. Une fenêtre agrandie après coup s'active au rechargement.
const EPINGLAGE = '(min-width: 64rem) and (prefers-reduced-motion: no-preference)';

export async function demarrerDefilement({ amorti, etapes: section }: Options) {
	const etapes = section && window.matchMedia(EPINGLAGE).matches ? section : null;
	if (!etapes) {
		// Pas d'étapes sur cette page : Lenis seul, avec sa propre boucle d'animation
		if (amorti) new Lenis({ lerp: 0.09, autoRaf: true });
		return;
	}

	const { gsap } = await import('gsap');
	const { ScrollTrigger } = await import('gsap/ScrollTrigger');
	gsap.registerPlugin(ScrollTrigger);

	// Lenis et ScrollTrigger doivent avancer au même rythme, sinon l'épinglage tremble
	if (amorti) {
		const lenis = new Lenis({ lerp: 0.09 });
		lenis.on('scroll', ScrollTrigger.update);
		gsap.ticker.add((temps) => lenis.raf(temps * 1000));
		gsap.ticker.lagSmoothing(0);
	}

	const liste = etapes.querySelector<HTMLElement>('.accueil__liste-etapes');
	if (!liste) return;

	// Seulement sur ordinateur et si les animations sont acceptées ; sinon (ou si la fenêtre rétrécit)
	// la liste reste verticale, avec ses cartes qui s'empilent en CSS
	gsap.matchMedia().add(EPINGLAGE, () => {
		etapes.classList.add('accueil__etapes--epinglee');
		const longueur = () => liste.scrollWidth - document.documentElement.clientWidth;

		const defilement = gsap.to(liste, {
			x: () => -longueur(),
			ease: 'none',
			scrollTrigger: {
				trigger: etapes,
				start: 'top top',
				end: () => '+=' + longueur(),
				pin: true,
				scrub: 0.6,
				invalidateOnRefresh: true,
			},
		});

		// Chaque étape monte en arrivant vers le centre de l'écran (la 1re est déjà en place)
		gsap.utils.toArray<HTMLElement>('.accueil__etape', liste).forEach((etape) => {
			gsap.from(etape, {
				y: 60,
				opacity: 0.2,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: etape,
					containerAnimation: defilement,
					start: 'left 85%',
					end: 'left 45%',
					scrub: true,
				},
			});
		});

		// Les polices changent la hauteur des cartes : on recalcule une fois qu'elles sont là
		document.fonts?.ready.then(() => ScrollTrigger.refresh());

		return () => etapes.classList.remove('accueil__etapes--epinglee');
	});
}
