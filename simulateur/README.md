# Simulateur OTA LocPilot — V39 correction champ message

# Simulateur OTA LocPilot — V38 design premium

Version V38 refondue pour une meilleure ergonomie :

- Design premium plus aéré et plus lisible.
- Résultat masqué avant simulation pour éviter les chiffres prématurés.
- Parcours simple en 3 étapes : nuitée type, plateforme, stratégie directe.
- Résultat central : prix direct conseillé, budget voyageur OTA, économie voyageur, gain par nuit, gain projeté.
- FR / EN / ES avec drapeaux, sans rechargement de page.
- Airbnb conservé en logique 2026 : frais hôte unique par défaut, sans frais voyageur séparé.
- Booking conservé sans frais voyageur séparé.
- Gestion exclue du calcul public et analysée uniquement en audit.
- Tracking UTM + message WhatsApp conservés.

## Déploiement GitHub Pages

Remplacer les fichiers du dépôt par :

- `index.html`
- `logo.jpg`
- `og-locpilot-simulateur.png`
- `README.md`


## V39

- Correction du champ "Message complémentaire" : le textarea occupe maintenant toute la largeur du bloc.
- Suppression de l'encadré bleu interne affiché par défaut par le navigateur.
- Conservation du design premium V38, du multilingue FR/EN/ES et du tracking UTM WhatsApp.
