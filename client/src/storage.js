// Préférences locales (profil anonyme, bilan en cours). Tout est protégé : le stockage peut être bloqué.
export const storage = {
  get(key) {
    try {
      return localStorage.getItem(`core.${key}`);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      if (value === null) localStorage.removeItem(`core.${key}`);
      else localStorage.setItem(`core.${key}`, value);
    } catch {
      /* stockage indisponible : on continue sans */
    }
  },
};
