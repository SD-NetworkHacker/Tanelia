# Intelligent Plugin Manager

## Mission Principale

Ce Skill est responsable de la gestion globale et permanente de l'écosystème des plugins de Claude Code. Il connaît les marketplaces configurées, les extensions disponibles, les extensions installées, les extensions activées et les extensions désactivées.

## Inventaire des Marketplaces

Il doit être capable de :

1. Identifier toutes les marketplaces configurées.
2. Localiser leurs répertoires réels.
3. Lire leurs manifestes.
4. Parcourir leurs catalogues.
5. Identifier les plugins disponibles.
6. Analyser leurs fonctionnalités.
7. Identifier leurs dépendances.
8. Détecter les versions disponibles.
9. Identifier les plugins abandonnés ou peu maintenus.
10. Mettre à jour son inventaire lorsque les marketplaces évoluent.

**Ne jamais supposer un chemin de stockage sans le vérifier.**

## Évaluation Intelligente des Plugins

Chaque plugin doit être évalué selon :

- La pertinence fonctionnelle.
- La qualité technique.
- La réputation de son éditeur.
- La fréquence des mises à jour.
- La compatibilité avec Claude Code.
- Les permissions nécessaires.
- Les risques de sécurité.
- Les dépendances externes.
- La consommation potentielle de contexte.
- Les fonctionnalités apportées.
- Les éventuelles redondances.

Attribuer un score de qualité et une classification :

- ESSENTIEL.
- RECOMMANDÉ.
- SPÉCIALISÉ.
- FACULTATIF.
- À ÉVITER.

## Détection des Doublons

Analyser les plugins installés et disponibles pour identifier ceux qui proposent les mêmes fonctionnalités.

**Exemples :**
- Plusieurs outils de revue de code.
- Plusieurs outils de tests automatisés.
- Plusieurs outils de documentation.
- Plusieurs serveurs MCP donnant accès aux mêmes services.
- Plusieurs Skills ayant des instructions similaires.

Lorsqu'une duplication est identifiée :

1. Comparer les capacités réelles.
2. Comparer la qualité et la fiabilité.
3. Comparer la sécurité.
4. Comparer les coûts de contexte.
5. Identifier le meilleur candidat.
6. Recommander de conserver le meilleur.
7. Désactiver ou désinstaller les doublons uniquement après autorisation.

**Ne jamais supprimer une extension sans vérifier qu'aucun autre workflow ne dépend d'elle.**

## Gestion des Installations

Lorsqu'un plugin pertinent est absent :

1. Rechercher le meilleur plugin dans les marketplaces existantes.
2. Vérifier sa compatibilité.
3. Vérifier ses dépendances.
4. Analyser son code et ses permissions.
5. Vérifier son origine.
6. Présenter son utilité et ses risques.
7. Demander une autorisation pour les nouvelles installations.
8. Installer le plugin approuvé.
9. Vérifier que l'installation a réussi.

**Ne jamais installer un plugin inconnu ou présentant des risques non résolus.**

## Gestion des Activations et Désactivations

Le système doit distinguer :

- Plugin disponible.
- Plugin installé.
- Plugin activé.
- Plugin désactivé.
- Plugin en erreur.

Il doit privilégier un fonctionnement à la demande. Les extensions nécessaires à une tâche doivent être activées uniquement lorsqu'elles sont nécessaires. Après utilisation, elles peuvent être désactivées si elles ne sont plus utiles.

**Attention :** La désactivation doit respecter les mécanismes réellement disponibles dans Claude Code. Si une extension nécessite un redémarrage ou un rechargement de session, ne prétends pas qu'elle est immédiatement désactivée.

**Ne jamais désactiver une extension utilisée par une autre tâche en cours.**

## Gestion du Catalogue

Maintenir un inventaire structuré contenant :

- Identifiant du plugin.
- Nom.
- Marketplace.
- Version.
- Fonctionnalités.
- Catégorie.
- Statut.
- Dépendances.
- Niveau de sécurité.
- Score de pertinence.
- Coût potentiel en contexte.
- Date de dernière vérification.
- Historique des installations et activations.