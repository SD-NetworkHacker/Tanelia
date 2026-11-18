<!-- Author: Sidy -unchk | Date: 2026-11-18 -->
---
name: task-plugin-orchestrator
description: Gestion dynamique des plugins par tâche. Analyse la nature de la tâche, les technologies et capacités requises, puis active les plugins pertinents depuis le registre IPM.
---

# Task Plugin Orchestrator

## Mission Principale

Ce Skill intervient lorsqu'une nouvelle tâche est confiée à Claude Code. Son rôle est d'identifier les extensions nécessaires à l'exécution optimale de cette tâche et de les rendre disponibles à Claude. Il constitue le gestionnaire dynamique des outils.

## Analyse de chaque tâche

Avant de commencer une mission importante, analyser :

1. La nature de la tâche.
2. Les technologies concernées.
3. Les compétences nécessaires.
4. Les outils spécialisés nécessaires.
5. Les tests à effectuer.
6. Les éventuelles recherches documentaires.
7. Les besoins de sécurité.
8. Les besoins de déploiement.

Établir une liste des capacités nécessaires.

## Sélection des plugins

Comparer les besoins identifiés avec le catalogue du premier Skill (Intelligent Plugin Manager). Classer les extensions :

- Déjà disponibles et activées.
- Installées mais désactivées.
- Disponibles dans une marketplace mais non installées.
- Non disponibles.

**Éviter les plugins inutiles et les doublons.**

**Ne jamais charger une extension simplement parce qu'elle existe.**

## Mise à disposition des outils

Lorsqu'un plugin nécessaire est déjà installé :

- Vérifier son statut.
- L'activer si nécessaire.
- Vérifier que ses outils sont réellement accessibles.
- Informer Claude des capacités disponibles.

Lorsqu'un plugin manque :

- Solliciter le premier Skill (Intelligent Plugin Manager).
- Identifier un candidat adapté.
- Demander l'autorisation d'installation.
- Vérifier son installation.
- Le rendre disponible après chargement.

**Ne jamais annoncer qu'un outil est disponible tant que son chargement n'a pas été confirmé.**

## Exécution intelligente

Pendant la tâche :

- Utiliser uniquement les extensions pertinentes.
- Éviter les appels inutiles.
- Ne pas multiplier les agents sans raison.
- Privilégier les outils les plus adaptés.
- Éviter les serveurs MCP redondants.
- Ne pas utiliser un plugin si une capacité native suffit.

Si une nouvelle compétence devient nécessaire pendant la mission, réévaluer les besoins.

## Nettoyage après la tâche

À la fin :

1. Identifier les extensions activées temporairement.
2. Vérifier si elles sont encore utilisées.
3. Désactiver celles qui ne sont plus nécessaires.
4. Conserver les extensions permanentes.
5. Préserver les extensions utilisées par d'autres tâches.
6. Mettre à jour l'historique.