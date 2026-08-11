LOCPILOT — VERSION GITHUB PAGES

Cette version utilise des chemins relatifs pour les CSS, JavaScript, images et liens internes.
Elle fonctionne donc :
- sur un domaine racine (ex. https://locpilotbyr4.fr/) ;
- sur un dépôt GitHub Pages de projet (ex. https://utilisateur.github.io/nom-du-depot/).

IMPORTANT
1. Envoyer LE CONTENU de ce dossier à la racine du dépôt publié, pas le dossier parent lui-même.
2. Vérifier dans Settings > Pages que la source publiée est bien la branche/dossier contenant index.html.
3. Le fichier .nojekyll est volontairement présent.

Cause corrigée : les versions précédentes utilisaient des chemins absolus tels que /css/platform-v2.css, /js/platform-v2.js et /images/logo.webp. Sur un GitHub Pages de projet, ces chemins pointaient vers https://utilisateur.github.io/css/... au lieu de https://utilisateur.github.io/nom-du-depot/css/... ; le HTML s'affichait donc sans styles ni scripts.
