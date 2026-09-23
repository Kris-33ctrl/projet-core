// Sources et méthode : lexique des notions et bibliographie, avec ce que chaque référence justifie dans Core.
// Toutes les références ont été vérifiées dans Crossref ou Europe PMC le 23 septembre 2026 (DOI, auteurs, revue).

export const SOURCES_CHECKED_ON = '2026-09-23';

export const SOURCE_CATEGORIES = [
  { id: 'modele', label: 'Modèle et conception', intro: 'Le cadre général de Core et les principes qui ont guidé ses règles.' },
  { id: 'echelles', label: 'Échelles du bilan', intro: 'Les questionnaires validés dont s’inspirent les cartes du bilan. Core en reprend l’esprit sous forme de curseurs, pas les versions complètes.' },
  { id: 'reperage', label: 'Repérage et bouclier éthique', intro: 'Les seuls outils utilisés tels quels : ils décident du niveau de soutien ou de relais.' },
  { id: 'adaptatif', label: 'Bilan adaptatif', intro: 'Pour poser moins de questions sans perdre en précision.' },
  { id: 'exercices', label: 'Exercices', intro: 'Ce qui fonde le « pourquoi ça aide » de chaque exercice.' },
];

export const SOURCES = [
  // ── Modèle et conception ─────────────────────────────────────────
  { id: 'engel1977', category: 'modele', authors: 'Engel, G. L.', year: 1977, title: 'The need for a new medical model: a challenge for biomedicine', venue: 'Science, 196(4286), 129-136', doi: '10.1126/science.847460', usedFor: 'Le modèle biopsychosocial : bien-être lu à travers le corps, l’esprit, les liens et le cadre de vie (les 5 sphères).' },
  { id: 'cohen1985', category: 'modele', authors: 'Cohen, S., & Wills, T. A.', year: 1985, title: 'Stress, social support, and the buffering hypothesis', venue: 'Psychological Bulletin, 98(2), 310-357', doi: '10.1037/0033-2909.98.2.310', usedFor: 'L’effet tampon : un réseau solide amortit la charge du Pilote (+10 points).' },
  { id: 'mani2013', category: 'modele', authors: 'Mani, A., Mullainathan, S., Shafir, E., & Zhao, J.', year: 2013, title: 'Poverty impedes cognitive function', venue: 'Science, 341(6149), 976-980', doi: '10.1126/science.1238041', usedFor: 'Le drain financier : l’inquiétude d’argent consomme de la bande passante mentale.' },
  { id: 'walker2009', category: 'modele', authors: 'Walker, M. P., & van der Helm, E.', year: 2009, title: 'Overnight therapy? The role of sleep in emotional brain processing', venue: 'Psychological Bulletin, 135(5), 731-748', doi: '10.1037/a0016570', usedFor: 'L’impact du sommeil sur la régulation émotionnelle et la charge mentale.' },
  { id: 'weiner1985', category: 'modele', authors: 'Weiner, B.', year: 1985, title: 'An attributional theory of achievement motivation and emotion', venue: 'Psychological Review, 92(4), 548-573', doi: '10.1037/0033-295X.92.4.548', usedFor: 'Le bridage : attribuer une baisse à la fatigue du corps plutôt qu’à la volonté évite la culpabilité.' },
  { id: 'ryan2000', category: 'modele', authors: 'Ryan, R. M., & Deci, E. L.', year: 2000, title: 'Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being', venue: 'American Psychologist, 55(1), 68-78', doi: '10.1037/0003-066X.55.1.68', usedFor: 'Une gamification qui nourrit l’autonomie, la compétence et le lien, sans punition ni classement.' },
  { id: 'deterding2011', category: 'modele', authors: 'Deterding, S., Dixon, D., Khaled, R., & Nacke, L.', year: 2011, title: 'From game design elements to gamefulness: defining « gamification »', venue: 'Proceedings of the 15th International Academic MindTrek Conference, 9-15', doi: '10.1145/2181037.2181040', usedFor: 'La définition de la gamification retenue pour les mini-jeux.' },

  // ── Échelles du bilan ────────────────────────────────────────────
  { id: 'buysse1989', category: 'echelles', authors: 'Buysse, D. J., Reynolds, C. F., Monk, T. H., Berman, S. R., & Kupfer, D. J.', year: 1989, title: 'The Pittsburgh Sleep Quality Index: a new instrument for psychiatric practice and research', venue: 'Psychiatry Research, 28(2), 193-213', doi: '10.1016/0165-1781(89)90047-4', usedFor: 'La Machine, sommeil : endormissement, récupération, perturbations, énergie en journée.' },
  { id: 'craig2003', category: 'echelles', authors: 'Craig, C. L., et al.', year: 2003, title: 'International Physical Activity Questionnaire: 12-country reliability and validity', venue: 'Medicine & Science in Sports & Exercise, 35(8), 1381-1395', doi: '10.1249/01.MSS.0000078924.61453.FB', usedFor: 'La Machine, mouvement et récupération.' },
  { id: 'kroenke2002', category: 'echelles', authors: 'Kroenke, K., Spitzer, R. L., & Williams, J. B. W.', year: 2002, title: 'The PHQ-15: validity of a new measure for evaluating the severity of somatic symptoms', venue: 'Psychosomatic Medicine, 64(2), 258-266', doi: '10.1097/00006842-200203000-00008', usedFor: 'La Machine, tensions corporelles et leur localisation.' },
  { id: 'tylka2006', category: 'echelles', authors: 'Tylka, T. L.', year: 2006, title: 'Development and psychometric evaluation of a measure of intuitive eating', venue: 'Journal of Counseling Psychology, 53(2), 226-240', doi: '10.1037/0022-0167.53.2.226', usedFor: 'La Machine, carburant : énergie après les repas et rythme, sans jamais parler de poids ni de calories.' },
  { id: 'hart1988', category: 'echelles', authors: 'Hart, S. G., & Staveland, L. E.', year: 1988, title: 'Development of NASA-TLX (Task Load Index): results of empirical and theoretical research', venue: 'Advances in Psychology, 52, 139-183', doi: '10.1016/S0166-4115(08)62386-9', usedFor: 'Le Pilote, charge mentale : saturation et effort d’exécution.' },
  { id: 'cohen1983', category: 'echelles', authors: 'Cohen, S., Kamarck, T., & Mermelstein, R.', year: 1983, title: 'A global measure of perceived stress', venue: 'Journal of Health and Social Behavior, 24(4), 385-396', doi: '10.2307/2136404', usedFor: 'Le Pilote, sentiment de contrôle face aux imprévus.' },
  { id: 'topp2015', category: 'echelles', authors: 'Topp, C. W., Østergaard, S. D., Søndergaard, S., & Bech, P.', year: 2015, title: 'The WHO-5 Well-Being Index: a systematic review of the literature', venue: 'Psychotherapy and Psychosomatics, 84(3), 167-176', doi: '10.1159/000376585', usedFor: 'Le Pilote, météo émotionnelle formulée positivement.' },
  { id: 'spitzer2006', category: 'echelles', authors: 'Spitzer, R. L., Kroenke, K., Williams, J. B. W., & Löwe, B.', year: 2006, title: 'A brief measure for assessing generalized anxiety disorder: the GAD-7', venue: 'Archives of Internal Medicine, 166(10), 1092-1097', doi: '10.1001/archinte.166.10.1092', usedFor: 'Le Pilote, porte d’entrée du repérage (humeur lourde, perte de contrôle).' },
  { id: 'zimet1988', category: 'echelles', authors: 'Zimet, G. D., Dahlem, N. W., Zimet, S. G., & Farley, G. K.', year: 1988, title: 'The Multidimensional Scale of Perceived Social Support', venue: 'Journal of Personality Assessment, 52(1), 30-41', doi: '10.1207/s15327752jpa5201_2', usedFor: 'Le Réseau, filet de sécurité et cartographie du lien.' },
  { id: 'russell1996', category: 'echelles', authors: 'Russell, D. W.', year: 1996, title: 'UCLA Loneliness Scale (Version 3): reliability, validity, and factor structure', venue: 'Journal of Personality Assessment, 66(1), 20-40', doi: '10.1207/s15327752jpa6601_2', usedFor: 'Le Réseau, connexion aux autres (solitude ressentie).' },
  { id: 'liebowitz1987', category: 'echelles', authors: 'Liebowitz, M. R.', year: 1987, title: 'Social phobia', venue: 'Modern Problems of Pharmacopsychiatry, 22, 141-173', doi: '10.1159/000414022', usedFor: 'Le Réseau, coût énergétique des situations sociales.' },
  { id: 'steger2006', category: 'echelles', authors: 'Steger, M. F., Frazier, P., Oishi, S., & Kaler, M.', year: 2006, title: 'The Meaning in Life Questionnaire: assessing the presence of and search for meaning in life', venue: 'Journal of Counseling Psychology, 53(1), 80-93', doi: '10.1037/0022-0167.53.1.80', usedFor: 'Le Cadre, sens et projets.' },
  { id: 'whoqol1998', category: 'echelles', authors: 'The WHOQOL Group', year: 1998, title: 'Development of the World Health Organization WHOQOL-BREF quality of life assessment', venue: 'Psychological Medicine, 28(3), 551-558', doi: '10.1017/S0033291798006667', usedFor: 'Le Cadre, sécurité matérielle et cadre de vie.' },
  { id: 'carver1997', category: 'echelles', authors: 'Carver, C. S.', year: 1997, title: 'You want to measure coping but your protocol’s too long: consider the Brief COPE', venue: 'International Journal of Behavioral Medicine, 4(1), 92-100', doi: '10.1207/s15327558ijbm0401_6', usedFor: 'Les Soupapes, coping actif ou évitant et contrôle des échappatoires.' },
  { id: 'young1998', category: 'echelles', authors: 'Young, K. S.', year: 1998, title: 'Internet addiction: the emergence of a new clinical disorder', venue: 'CyberPsychology & Behavior, 1(3), 237-244', doi: '10.1089/cpb.1998.1.237', usedFor: 'Les Soupapes, usage des écrans.' },

  // ── Repérage et bouclier éthique ─────────────────────────────────
  { id: 'kroenke2003', category: 'reperage', authors: 'Kroenke, K., Spitzer, R. L., & Williams, J. B. W.', year: 2003, title: 'The Patient Health Questionnaire-2: validity of a two-item depression screener', venue: 'Medical Care, 41(11), 1284-1292', doi: '10.1097/01.MLR.0000093487.78664.3C', usedFor: 'PHQ-2 : seuil de 3 (sensibilité 83 %, spécificité 92 %), niveau soutien.' },
  { id: 'kroenke2007', category: 'reperage', authors: 'Kroenke, K., Spitzer, R. L., Williams, J. B. W., Monahan, P. O., & Löwe, B.', year: 2007, title: 'Anxiety disorders in primary care: prevalence, impairment, comorbidity, and detection', venue: 'Annals of Internal Medicine, 146(5), 317-325', doi: '10.7326/0003-4819-146-5-200703060-00004', usedFor: 'GAD-2 : seuil de 3, niveau soutien.' },
  { id: 'kroenke2009', category: 'reperage', authors: 'Kroenke, K., Spitzer, R. L., Williams, J. B. W., & Löwe, B.', year: 2009, title: 'An ultra-brief screening scale for anxiety and depression: the PHQ-4', venue: 'Psychosomatics, 50(6), 613-621', doi: '10.1176/appi.psy.50.6.613', usedFor: 'PHQ-4 : score de 9 et plus, niveau relais.' },
  { id: 'lowe2010', category: 'reperage', authors: 'Löwe, B., et al.', year: 2010, title: 'A 4-item measure of depression and anxiety: validation and standardization of the PHQ-4 in the general population', venue: 'Journal of Affective Disorders, 122(1-2), 86-95', doi: '10.1016/j.jad.2009.06.019', usedFor: 'Normes en population générale : où se situent les seuils retenus.' },
  { id: 'wicke2022', category: 'reperage', authors: 'Wicke, F. S., Krakau, L., Löwe, B., Beutel, M. E., & Brähler, E.', year: 2022, title: 'Update of the standardization of the Patient Health Questionnaire-4 (PHQ-4) in the general population', venue: 'Journal of Affective Disorders, 312, 310-314', doi: '10.1016/j.jad.2022.06.054', usedFor: 'Normes récentes du PHQ-4 en population générale.' },
  { id: 'dazzi2014', category: 'reperage', authors: 'Dazzi, T., Gribble, R., Wessely, S., & Fear, N. T.', year: 2014, title: 'Does asking about suicide and related behaviours induce suicidal ideation? What is the evidence?', venue: 'Psychological Medicine, 44(16), 3361-3363', doi: '10.1017/S0033291714001299', usedFor: 'Réflexion éthique sur les questions de détresse, sans mise en sécurité humaine possible dans l’app.' },

  // ── Bilan adaptatif ──────────────────────────────────────────────
  { id: 'gibbons2012', category: 'adaptatif', authors: 'Gibbons, R. D., et al.', year: 2012, title: 'Development of a computerized adaptive test for depression', venue: 'Archives of General Psychiatry, 69(11), 1104-1112', doi: '10.1001/archgenpsychiatry.2012.14', usedFor: 'Le principe du test adaptatif : ne poser que les questions utiles. Core applique pour l’instant des déclenchements conditionnels, la version complète viendra avec les données de l’alpha.' },

  // ── Exercices ────────────────────────────────────────────────────
  { id: 'lehrer2014', category: 'exercices', authors: 'Lehrer, P. M., & Gevirtz, R.', year: 2014, title: 'Heart rate variability biofeedback: how and why does it work?', venue: 'Frontiers in Psychology, 5, 756', doi: '10.3389/fpsyg.2014.00756', usedFor: 'Cohérence cardiaque : respirer autour de 6 cycles par minute.' },
  { id: 'hofmann2012', category: 'exercices', authors: 'Hofmann, S. G., Asnaani, A., Vonk, I. J. J., Sawyer, A. T., & Fang, A.', year: 2012, title: 'The efficacy of cognitive behavioral therapy: a review of meta-analyses', venue: 'Cognitive Therapy and Research, 36(5), 427-440', doi: '10.1007/s10608-012-9476-1', usedFor: 'Mettre une pensée à l’épreuve (restructuration cognitive issue des TCC).' },
  { id: 'masicampo2011', category: 'exercices', authors: 'Masicampo, E. J., & Baumeister, R. F.', year: 2011, title: 'Consider it done! Plan making can eliminate the cognitive effects of unfulfilled goals', venue: 'Journal of Personality and Social Psychology, 101(4), 667-683', doi: '10.1037/a0024192', usedFor: 'Fermer des onglets mentaux : écrire et planifier libère l’esprit des tâches en suspens.' },
  { id: 'neff2003', category: 'exercices', authors: 'Neff, K.', year: 2003, title: 'Self-compassion: an alternative conceptualization of a healthy attitude toward oneself', venue: 'Self and Identity, 2(2), 85-101', doi: '10.1080/15298860309032', usedFor: 'Se parler comme à un·e ami·e : les trois composantes de l’auto-compassion.' },
  { id: 'neff2013', category: 'exercices', authors: 'Neff, K. D., & Germer, C. K.', year: 2013, title: 'A pilot study and randomized controlled trial of the Mindful Self-Compassion program', venue: 'Journal of Clinical Psychology, 69(1), 28-44', doi: '10.1002/jclp.21923', usedFor: 'La pause d’auto-compassion, issue de ce programme.' },
  { id: 'bowen2009', category: 'exercices', authors: 'Bowen, S., & Marlatt, A.', year: 2009, title: 'Surfing the urge: brief mindfulness-based intervention for college student smokers', venue: 'Psychology of Addictive Behaviors, 23(4), 666-671', doi: '10.1037/a0017127', usedFor: 'Surfer sur l’envie : observer l’envie sans y répondre tout de suite.' },
  { id: 'gollwitzer1999', category: 'exercices', authors: 'Gollwitzer, P. M.', year: 1999, title: 'Implementation intentions: strong effects of simple plans', venue: 'American Psychologist, 54(7), 493-503', doi: '10.1037/0003-066X.54.7.493', usedFor: 'Décider quand et où agir : créneaux d’activité, plus petite prochaine action.' },
  { id: 'lieberman2007', category: 'exercices', authors: 'Lieberman, M. D., et al.', year: 2007, title: 'Putting feelings into words: affect labeling disrupts amygdala activity in response to affective stimuli', venue: 'Psychological Science, 18(5), 421-428', doi: '10.1111/j.1467-9280.2007.01916.x', usedFor: 'Partager la charge : mettre des mots sur une émotion en réduit l’intensité.' },
  { id: 'sandstrom2014', category: 'exercices', authors: 'Sandstrom, G. M., & Dunn, E. W.', year: 2014, title: 'Social interactions and well-being: the surprising power of weak ties', venue: 'Personality and Social Psychology Bulletin, 40(7), 910-922', doi: '10.1177/0146167214529799', usedFor: 'Un contact à faible coût : les petites interactions comptent aussi.' },
  { id: 'stothart2015', category: 'exercices', authors: 'Stothart, C., Mitchum, A., & Yehnert, C.', year: 2015, title: 'The attentional cost of receiving a cell phone notification', venue: 'Journal of Experimental Psychology: Human Perception and Performance, 41(4), 893-897', doi: '10.1037/xhp0000100', usedFor: 'Des écrans choisis : chaque notification coûte de l’attention, même sans y répondre.' },
  { id: 'bull2020', category: 'exercices', authors: 'Bull, F. C., et al.', year: 2020, title: 'World Health Organization 2020 guidelines on physical activity and sedentary behaviour', venue: 'British Journal of Sports Medicine, 54(24), 1451-1462', doi: '10.1136/bjsports-2020-102955', usedFor: '150 minutes d’activité modérée par semaine, et rompre la sédentarité.' },
  { id: 'masento2014', category: 'exercices', authors: 'Masento, N. A., Golightly, M., Field, D. T., Butler, L. T., & van Reekum, C. M.', year: 2014, title: 'Effects of hydration status on cognitive performance and mood', venue: 'British Journal of Nutrition, 111(10), 1841-1852', doi: '10.1017/S0007114513004455', usedFor: 'Le plein d’eau : hydratation, concentration et humeur.' },
  { id: 'phillips2017', category: 'exercices', authors: 'Phillips, A. J. K., et al.', year: 2017, title: 'Irregular sleep/wake patterns are associated with poorer academic performance and delayed circadian and sleep/wake timing', venue: 'Scientific Reports, 7, 3216', doi: '10.1038/s41598-017-03171-4', usedFor: 'Le sommeil, première batterie : la régularité compte autant que la durée.' },
];

// Sources de chaque exercice. L'ancrage 5-4-3-2-1 est une technique clinique courante sans étude dédiée : on le dit.
export const EXERCISE_SOURCES = {
  coherence_cardiaque: ['lehrer2014'],
  ancrage_54321: [],
  restructuration: ['hofmann2012'],
  vider_la_tete: ['masicampo2011'],
  body_first: ['walker2009', 'bull2020'],
  sommeil_batterie: ['phillips2017', 'walker2009'],
  micro_mouvement: ['bull2020'],
  objectif_activite: ['bull2020', 'gollwitzer1999'],
  hydratation: ['masento2014'],
  repas_poses: ['tylka2006'],
  exteriorisation: ['lieberman2007', 'cohen1985'],
  auto_compassion: ['neff2003', 'neff2013'],
  lien_leger: ['sandstrom2014'],
  charge_mentale: ['hart1988', 'masicampo2011'],
  budget_visuel: ['mani2013'],
  sens_projets: ['steger2006', 'gollwitzer1999'],
  reconnexion: ['bowen2009'],
  ecrans_choisis: ['stothart2015'],
};

export const NO_SOURCE_NOTE = {
  ancrage_54321: 'Technique d’ancrage courante en clinique, sans étude de validation dédiée à ce format.',
};

// Lexique : les notions qu'il faut connaître pour comprendre comment Core raisonne.
export const GLOSSARY = [
  { term: 'Modèle biopsychosocial', definition: 'Lire la santé comme l’interaction du corps, de l’esprit et de l’environnement social, plutôt que comme un seul symptôme. C’est l’origine des 5 sphères.', sources: ['engel1977'] },
  { term: 'Échelle psychométrique validée', definition: 'Questionnaire dont on a vérifié qu’il mesure bien ce qu’il prétend mesurer (validité) de façon stable (fidélité). Changer ses mots ou son échelle lui fait perdre ces garanties.' },
  { term: 'Repérage (ou dépistage)', definition: 'Signaler qu’une situation mérite l’avis d’un·e professionnel·le. Ce n’est jamais un diagnostic.', sources: ['kroenke2003'] },
  { term: 'Sensibilité et spécificité', definition: 'La sensibilité est la part des personnes concernées qu’un outil repère ; la spécificité, la part des personnes non concernées qu’il ne signale pas à tort.', sources: ['kroenke2003'] },
  { term: 'Percentile', definition: 'Position d’un score dans une population : au 95e percentile, 95 % des personnes ont un score plus bas.', sources: ['lowe2010'] },
  { term: 'Théorie de réponse aux items et test adaptatif', definition: 'Modèles qui estiment un trait à partir de quelques questions bien choisies, pour raccourcir un bilan sans perdre en précision.', sources: ['gibbons2012'] },
  { term: 'Charge mentale', definition: 'Ce qu’une tâche ou une journée exige de la mémoire de travail : exigence, effort, frustration.', sources: ['hart1988'] },
  { term: 'Stress perçu', definition: 'Le sentiment de contrôle sur les événements, plutôt que les événements eux-mêmes.', sources: ['cohen1983'] },
  { term: 'Coping', definition: 'Les stratégies pour faire face : actives (résoudre, accepter) ou évitantes (fuir, repousser, s’anesthésier).', sources: ['carver1997'] },
  { term: 'Effet tampon', definition: 'Un soutien social solide atténue l’effet du stress sur la santé.', sources: ['cohen1985'] },
  { term: 'Bande passante mentale', definition: 'Les ressources d’attention disponibles. Une préoccupation de fond, comme l’argent, en consomme en permanence.', sources: ['mani2013'] },
  { term: 'Attribution', definition: 'La cause qu’on donne à un résultat. Attribuer une baisse à la fatigue du corps plutôt qu’à soi protège la motivation.', sources: ['weiner1985'] },
  { term: 'Cohérence cardiaque', definition: 'Respiration lente, autour de 6 cycles par minute, qui augmente la variabilité de la fréquence cardiaque et active le système nerveux du repos.', sources: ['lehrer2014'] },
  { term: 'Restructuration cognitive', definition: 'Technique des TCC : examiner une pensée comme une hypothèse et chercher une version plus juste.', sources: ['hofmann2012'] },
  { term: 'Auto-compassion', definition: 'Se traiter avec la bienveillance qu’on aurait pour un·e ami·e : bienveillance, humanité partagée, pleine conscience.', sources: ['neff2003'] },
  { term: 'Surf de l’envie', definition: 'Observer une envie monter, culminer puis redescendre, sans y répondre tout de suite.', sources: ['bowen2009'] },
  { term: 'Intention de mise en œuvre', definition: 'Plan du type « quand X, je ferai Y ». Il augmente nettement les chances de passer à l’action.', sources: ['gollwitzer1999'] },
  { term: 'Étiquetage affectif', definition: 'Mettre un mot sur une émotion en diminue l’intensité.', sources: ['lieberman2007'] },
  { term: 'Théorie de l’autodétermination', definition: 'La motivation durable naît de trois besoins : autonomie, compétence et lien. Elle guide la gamification de Core.', sources: ['ryan2000'] },
  { term: 'Gamification', definition: 'Utiliser des éléments de jeu dans un contexte qui n’en est pas un. Dans Core, sans punition, sans série à ne pas briser et sans classement.', sources: ['deterding2011'] },
  { term: 'Local-first', definition: 'Les données vivent sur l’appareil de la personne et ne partent sur aucun serveur. Elle peut tout effacer à tout moment.' },
];

export const sourceById = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
export const doiUrl = (doi) => `https://doi.org/${doi}`;

// Citation courte : « Engel, 1977 », « Cohen & Wills, 1985 », « Buysse et al., 1989 ».
export function shortCite(source) {
  const tokens = source.authors.split(', ');
  const etAl = tokens.includes('et al.');
  const families = tokens
    .filter((t) => t !== 'et al.' && !/^(?:[A-ZÀ-Ý]\.\s?-?)+$/.test(t))
    .map((t) => t.replace(/^&\s*/, ''));
  const names = etAl || families.length > 2 ? `${families[0]} et al.` : families.join(' & ');
  return `${names}, ${source.year}`;
}
