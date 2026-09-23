# Core

Application web (mobile-first) pour cartographier, comprendre et améliorer son bien-être global, sans score punitif.
Spécification de référence : `Projet Core - Synthèse et Feuille de Route.pdf`.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests du moteur et du service
```

Version compilée : `npm run build && npm start`, puis http://localhost:4173.

### Mode développement

Avec `npm run dev`, un bouton **DEV** apparaît en bas à gauche (il n'existe pas dans la version compilée) :

- **Scénarios de démo** : remplace les données du navigateur par 3 semaines d'historique (bilans il y a 16, 9 et 2 jours, check-ins, exercices), générées par le vrai moteur avec une horloge simulée. Cinq cas : équilibre qui progresse, Machine épuisée (bridage), surcharge persistante (relais), soupapes en tension, réseau solide avec charge élevée.
- **Bilan express** / **Check-in express** : réponses automatiques façon scénario choisi, on arrive directement au résultat.
- **Dernier bilan**, **Tout effacer**.

Les scénarios sont définis dans `engine/src/demo.js` et testés comme le reste du moteur.

**Local-first** : tout tourne dans le navigateur. Les bilans, check-ins et exercices sont stockés dans IndexedDB, sur l'appareil ; aucune donnée de santé ne part sur un serveur. L'app compilée (`client/dist`) peut être hébergée comme un simple site statique. Prérequis : Node.js ≥ 20 pour développer.

## Organisation

| Dossier   | Rôle |
|-----------|------|
| `engine/` | Moteur pur, sans dépendance : questions, flux adaptatif, jauges, impacts croisés, triage, check-in, comparaison entre bilans, exercices, et le **service** applicatif (indépendant du stockage). Testé avec `node:test`. |
| `client/` | Front Vite en HTML/CSS/JS natif + Three.js : bilan en cartes, check-in, tableau de bord, comparaison, forme 3D, boîte à outils. Stockage IndexedDB (`src/idb.js`). |

## Où modifier quoi

- **Seuils, pondérations, amplitudes des impacts** : `engine/src/config.js`. Les valeurs marquées « À VALIDER » ne viennent pas du PDF et doivent être arbitrées (phase 1).
- **Textes des questions** : `engine/src/questions.js` (repris du Document Maître).
- **Formules des jauges et impacts croisés** : `engine/src/scoring.js`.
- **Seuils de triage** : `engine/src/config.js` (`TRIAGE`) ; logique et ressources d'aide : `engine/src/triage.js` (numéros à revérifier avant toute mise en ligne).
- **Repérage PHQ-4** : `engine/src/screening.js`. **Check-in quotidien** : `engine/src/checkin.js`.
- **Exercices** (contenu, étapes, déclencheurs) : `engine/src/recommendations.js`. Lecteur interactif : `client/src/components/exercise.js`.
- **Comparaison entre bilans** : `engine/src/comparison.js` (seuil de variation dans `config.js`, `COMPARISON`).
- **Logique applicative** (profil, bilan, check-in, bouclier, effacement) : `engine/src/service.js`.

## Choix d'interprétation du PDF

- Les jauges de sphère utilisent les formules pondérées du PDF. Elles s'écrivent comme une moyenne pondérée des sous-jauges : Cognition = 0,4·Charge + 0,3·Stress + 0,3·Humeur.
- Convention : une jauge va de 0 à 100 et **plus elle est haute, plus la ressource est disponible**. Aucune valeur n'est affichée à l'utilisateur.
- Machine sous 40 : **bridage** plutôt que malus. Pilote et Réseau sont plafonnés à 80 (zone hachurée), sans retrait de points. Entre 40 et 50, le malus de 10 % s'applique.
- Tampon Réseau à +10 points. Les impacts croisés ne retirent jamais plus de 20 points au Pilote.
- Le Score Core pondère les 5 sphères à parts égales en attendant les données de l'alpha. Il n'est jamais affiché comme une note.
- Triage v2 (doc « Protocole de triage Core ») : PHQ-4 tous les 14 jours, seuls PHQ-2, GAD-2 et PHQ-4 font monter le niveau (soutien, relais). Les signaux maison (porte d'entrée, vulnérabilité, 7 jours d'alerte sur 14 au check-in) ne font qu'avancer le repérage. Relecture professionnelle prévue avant toute ouverture au public.
- Rythme : un bilan complet par semaine, un check-in quotidien de 4 cartes (3 fixes + 1 tirée de la sphère la plus basse).
- La CAT/IRT complète n'est pas encore implémentée. Le flux adaptatif actuel suit les déclenchements conditionnels du PDF : 21 à 28 cartes.
