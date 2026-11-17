# IPMS — Intelligent Plugin Management System

Système intelligent de gestion des plugins pour Claude Code. Deux Skills coordonnés pour gérer l'écosystème de plugins de manière permanente et dynamique.

## Architecture

```
IPMS
├── intelligent-plugin-manager/     # Gestion permanente de l'écosystème
│   ├── SKILL.md                    # Définition du skill
│   └── skill-implementation.js     # Logique core (21 fonctions)
├── task-plugin-orchestrator/       # Gestion dynamique par tâche
│   ├── SKILL.md                    # Définition du skill
│   └── skill-implementation.js     # Logique core (13 fonctions)
├── ipms/                           # Registre central partagé
│   ├── plugin-registry.json        # Catalogue complet (148 plugins)
│   ├── plugin-policies.json        # Politiques d'installation/activation
│   ├── task-requirements.json      # Mappings tâche → plugins
│   ├── catalog/                    # Catalogues par marketplace
│   ├── references/                 # Documentation de référence
│   └── scripts/                    # Scripts utilitaires
└── README.md                       # Ce fichier
```

## Deux Skills Coordonnés

### 1. Intelligent Plugin Manager (IPM)
Gestion **permanente** et **globale** de l'écosystème :
- Inventaire des 5 marketplaces (claude-plugins-official, claude-code-workflows, claude-code-skills, claude-community, knowledge-work-plugins)
- Évaluation qualité (score 0-100, 5 tiers : ESSENTIEL/RECOMMANDÉ/SPÉCIALISÉ/FACULTATIF/À ÉVITER)
- Détection de doublons par chevauchement fonctionnel (≥3 features + écart qualité 20%)
- Autorisation d'installation avec politiques de sécurité
- Cycle activation/désactivation

### 2. Task Plugin Orchestrator (TPO)
Gestion **dynamique** par tâche :
- Analyse de la tâche (nature, technologies, capacités requises)
- Sélection des plugins pertinents via le registre IPM
- Activation automatique des plugins installés
- Demande d'installation pour plugins manquants (avec confirmation utilisateur)
- Nettoyage après tâche (releaseTaskPlugins)

## Registre Central (`ipms/plugin-registry.json`)

Source de vérité unique partagée entre les deux skills :

```json
{
  "marketplaces": { ... },           // 5 marketplaces, 148 plugins
  "installedPlugins": { ... },       // Plugins installés localement
  "activatedPlugins": [ ... ],       // Plugins actifs en session
  "pluginScores": { ... },           // Scores de qualité calculés
  "pluginCategories": { ... },       // Catégories déduites
  "pluginDependencies": { ... },     // Dépendances entre plugins
  "registryMetrics": { ... }         // Métriques (dernier scan, doublons, etc.)
}
```

## Installation

### Configuration Globale (Recommandée)

```bash
# Copier dans ~/.claude pour disponibilité cross-projet
cp -r intelligent-plugin-manager ~/.claude/skills/
cp -r task-plugin-orchestrator ~/.claude/skills/
cp -r ipms ~/.claude/
```

Les skills utilisent le chemin global `C:/Users/<user>/.claude/ipms` (Windows) ou `~/.claude/ipms` (Unix).

### Configuration Projet-Local

```bash
# Dans votre projet
mkdir -p .claude/skills
cp -r intelligent-plugin-manager .claude/skills/
cp -r task-plugin-orchestrator .claude/skills/
cp -r ipms .claude/
```

## Utilisation

### Skill Intelligent Plugin Manager

```bash
# Dans Claude Code
/intelligent-plugin-manager
```

Commandes disponibles :
- `scan` — Scanner les marketplaces et mettre à jour le registre
- `evaluate <plugin>` — Évaluer la qualité d'un plugin
- `duplicates` — Détecter les doublons installés
- `recommend <category>` — Recommander des plugins par catégorie
- `install <plugin>` — Installer un plugin (avec autorisation)
- `activate <plugin>` — Activer un plugin
- `deactivate <plugin>` — Désactiver un plugin

### Skill Task Plugin Orchestrator

```bash
# Dans Claude Code
/task-plugin-orchestrator "votre description de tâche"
```

Le skill analyse automatiquement :
1. La nature de la tâche (development, frontend, backend, testing, security, deployment, design, research, documentation)
2. Les technologies détectées (react, vue, node, python, docker, supabase, etc.)
3. Les capacités requises
4. Sélectionne et active les plugins pertinents

Exemple :
```
/task-plugin-orchestrator "Créer une application React avec Supabase, authentification et tests"
```
→ Active : superpowers, figma, supabase, playwright, code-review, etc.

## Tests (Scénarios A-H)

| Test | Description | Résultat Attendu |
|------|-------------|------------------|
| **A** | Registre charge correctement | 148 plugins, 5 marketplaces |
| **B** | Analyse tâche React + Supabase | 10 plugins recommandés |
| **C** | Score qualité plugin = 84 | Tier = RECOMMANDÉ |
| **D** | Activation superpowers/figma | 2 plugins dans activatedPlugins |
| **E** | Désactivation figma | 1 plugin retiré |
| **F** | ReleaseTaskPlugins | Plugins temporaires libérés, permanents préservés |
| **G** | Installation nouveau plugin | Autorisation demandée |
| **H** | Détection doublons | 0 doublons (configuration actuelle) |

Lancer les tests :
```bash
node -e "
const ipm = require('./intelligent-plugin-manager/skill-implementation.js');
const tpo = require('./task-plugin-orchestrator/skill-implementation.js');
// Tests A-H...
"
```

## Politiques de Sécurité (`ipms/plugin-policies.json`)

- **Installation** : `requireApproval: true`, `autoApproveEssential: false`
- **Activation** : `autoActivateForTasks: true`, `preservePermanentPlugins: true`
- **Sécurité** : `scanNewPlugins: true`, `requireCodeReview: true`, `trustedMarketplaces` listées
- **Redondance** : `detectDuplicates: true`, `resolveDuplicatesBy: 'quality'`

## Marketplaces Supportées

| Marketplace | Description | Emplacement |
|-------------|-------------|-------------|
| claude-plugins-official | Plugins officiels Anthropic | `~/.claude/plugins/official` |
| claude-code-workflows | Workflows réutilisables | `~/.claude/workflows` |
| claude-code-skills | Skills communauté | `~/.claude/skills` |
| claude-community | Plugins communauté | `~/.claude/plugins/community` |
| knowledge-work-plugins | Plugins travail connaissance | `~/.claude/plugins/knowledge` |

## Fichiers de Configuration

- `CLAUDE.md` — Instructions projet (à la racine de chaque projet utilisant IPMS)
- `.claude/settings.json` — Permissions et hooks Claude Code
- `ipms/plugin-policies.json` — Politiques globales IPMS

## Scripts Utilitaires

```bash
# Scanner les marketplaces et mettre à jour le registre
node ipms/scripts/scan-marketplaces.js

# Vérifier l'état du registre
node -e "console.log(JSON.stringify(require('./ipms/plugin-registry.json').registryMetrics, null, 2))"
```

## Contribution

1. Fork le repository
2. Créer une branche feature
3. Ajouter plugins au registre via `scan-marketplaces.js` ou manuellement
4. Mettre à jour `plugin-policies.json` si nécessaire
5. Tester avec les scénarios A-H
6. Soumettre PR

## Licence

MIT — Libre d'utilisation, modification et distribution.

---

**Auteur** : SD-NetworkHacker  
**Repository** : https://github.com/SD-NetworkHacker/Tanelia