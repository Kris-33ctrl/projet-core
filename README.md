# Core

Application web (mobile-first) pour cartographier, comprendre et améliorer son bien-être global, sans score punitif.
Spécification de référence : `Projet Core - Synthèse et Feuille de Route.pdf`.

## Lancer en local

```bash
npm install
npm run dev        # API sur :3001 + front Vite sur http://localhost:5173
npm test           # tests du moteur et de l'API
```

Mode « production » local : `npm run build && npm start`, puis http://localhost:3001.

Prérequis : Node.js ≥ 22.13 (SQLite intégré via `node:sqlite`, aucune dépendance native).

## Organisation

| Dossier   | Rôle |
|-----------|------|
| `engine/` | Moteur algorithmique pur, sans dépendance : banque de questions, flux adaptatif, jauges, impacts croisés, triage, recommandations. Testé avec `node:test`. |
| `server/` | API Express + SQLite. Profils anonymes, bilans, réponses horodatées (utiles aux mesures IHM). |
| `client/` | Front Vite en HTML/CSS/JS natif + Three.js : bilan en cartes, tableau de bord, forme 3D organique, cohérence cardiaque. |

## Où modifier quoi

- **Seuils, pondérations, amplitudes des impacts** : `engine/src/config.js`. Les valeurs marquées « À VALIDER » ne viennent pas du PDF et doivent être arbitrées (phase 1).
- **Textes des questions** : `engine/src/questions.js` (repris du Document Maître).
- **Formules des jauges et impacts croisés** : `engine/src/scoring.js`.
- **Seuils de triage** : `engine/src/config.js` (`TRIAGE`) ; logique et ressources d'aide : `engine/src/triage.js` (numéros à revérifier avant toute mise en ligne).
- **Repérage PHQ-4** : `engine/src/screening.js`. **Check-in quotidien** : `engine/src/checkin.js`.
- **Micro-aides (nudges)** : `engine/src/recommendations.js`.

## Choix d'interprétation du PDF

- Les jauges de sphère utilisent les formules pondérées du PDF. Elles s'écrivent comme une moyenne pondérée des sous-jauges : Cognition = 0,4·Charge + 0,3·Stress + 0,3·Humeur.
- Convention : une jauge va de 0 à 100 et **plus elle est haute, plus la ressource est disponible**. Aucune valeur n'est affichée à l'utilisateur.
- Machine sous 40 : **bridage** plutôt que malus. Pilote et Réseau sont plafonnés à 80 (zone hachurée), sans retrait de points. Entre 40 et 50, le malus de 10 % s'applique.
- Tampon Réseau à +10 points. Les impacts croisés ne retirent jamais plus de 20 points au Pilote.
- Le Score Core pondère les 5 sphères à parts égales en attendant les données de l'alpha. Il n'est jamais affiché comme une note.
- Triage v2 (doc « Protocole de triage Core ») : PHQ-4 tous les 14 jours, seuls PHQ-2, GAD-2 et PHQ-4 font monter le niveau (soutien, relais). Les signaux maison (porte d'entrée, vulnérabilité, 7 jours d'alerte sur 14 au check-in) ne font qu'avancer le repérage. Relecture professionnelle prévue avant toute ouverture au public.
- Rythme : un bilan complet par semaine, un check-in quotidien de 4 cartes (3 fixes + 1 tirée de la sphère la plus basse).
- La CAT/IRT complète n'est pas encore implémentée. Le flux adaptatif actuel suit les déclenchements conditionnels du PDF : 21 à 28 cartes.
