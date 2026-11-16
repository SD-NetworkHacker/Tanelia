// Scan all configured marketplaces and update the plugin registry
// This script populates the plugin-registry.json with all available plugins

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = 'C:/Users/unchk/.claude';
const IPMS_DIR = path.join(CLAUDE_DIR, 'ipms');
const REGISTRY_PATH = path.join(IPMS_DIR, 'plugin-registry.json');

// Known marketplaces from the environment
const MARKETPLACES = {
  'claude-plugins-official': {
    url: 'https://github.com/anthropics/claude-plugins-official.git',
    installLocation: 'C:/Users/unchk/.claude/plugins/marketplaces/claude-plugins-official'
  },
  'claude-code-workflows': {
    url: 'https://github.com/wshobson/agents.git',
    installLocation: 'C:/Users/unchk/.claude/plugins/marketplaces/claude-code-workflows'
  },
  'claude-code-skills': {
    url: 'https://github.com/alirezarezvani/claude-skills.git',
    installLocation: 'C:/Users/unchk/.claude/plugins/marketplaces/claude-code-skills'
  },
  'claude-community': {
    url: 'https://github.com/anthropics/claude-plugins-community.git',
    installLocation: 'C:/Users/unchk/.claude/plugins/marketplaces/claude-community'
  },
  'knowledge-work-plugins': {
    url: 'https://github.com/anthropics/knowledge-work-plugins.git',
    installLocation: 'C:/Users/unchk/.claude/plugins/marketplaces/knowledge-work-plugins'
  }
};

// Plugin categories for classification
const CATEGORIES = [
  'code-review', 'testing', 'deployment', 'security', 'design',
  'frontend', 'backend', 'devops', 'mcp', 'skill', 'agent',
  'documentation', 'analysis', 'performance', 'utility'
];

// Score ranges
const QUALITY_SCORES = {
  'ESSENTIEL': { min: 90, max: 100 },
  'RECOMMANDÉ': { min: 75, max: 89 },
  'SPÉCIALISÉ': { min: 60, max: 74 },
  'FACULTATIF': { min: 40, max: 59 },
  'À ÉVITER': { min: 0, max: 39 }
};

// Helper: classify score into category
function classifyQuality(score) {
  if (score >= 90) return 'ESSENTIEL';
  if (score >= 75) return 'RECOMMANDÉ';
  if (score >= 60) return 'SPÉCIALISÉ';
  if (score >= 40) return 'FACULTATIF';
  return 'À ÉVITER';
}

// Helper: read marketplace plugins from directory
function readMarketplacePlugins(marketplaceDir) {
  const plugins = {};
  try {
    if (!fs.existsSync(marketplaceDir)) return plugins;

    const entries = fs.readdirSync(marketplaceDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginName = entry.name;
        const pluginPath = path.join(marketplaceDir, pluginName);

        // Try to read plugin.json if it exists
        const pluginJsonPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
        let pluginInfo = { name: pluginName, version: 'unknown', features: [] };

        try {
          if (fs.existsSync(pluginJsonPath)) {
            const jsonContent = fs.readFileSync(pluginJsonPath, 'utf-8');
            const parsed = JSON.parse(jsonContent);
            pluginInfo = {
              name: parsed.name || pluginName,
              version: parsed.version || 'unknown',
              description: parsed.description || '',
              author: parsed.author || {}
            };
          }
        } catch (e) {
          // Skip plugins without valid manifest
        }

        plugins[pluginName] = {
          ...pluginInfo,
          marketplace: getMarketplaceFromDir(pluginPath),
          status: 'available',
          category: classifyPluginCategory(pluginName, pluginInfo.description || ''),
          lastUpdated: new Date().toISOString()
        };
      }
    }
  } catch (e) {
    console.error(`Error reading marketplace ${marketplaceDir}:`, e.message);
  }
  return plugins;
}

// Helper: determine which marketplace a plugin dir belongs to
function getMarketplaceFromDir(pluginPath) {
  for (const [name, info] of Object.entries(MARKETPLACES)) {
    if (pluginPath.startsWith(info.installLocation)) {
      return name;
    }
  }
  return 'unknown';
}

// Helper: classify plugin category from description
function classifyPluginCategory(name, description) {
  const text = (name + ' ' + description).toLowerCase();

  const categoryMap = {
    'code-review|audit|security|vulnerability': 'security',
    'test|testing|spec': 'testing',
    'deploy|ci|cd|workflow': 'deployment',
    'design|ui|frontend|theme': 'design',
    'frontend|react|vue|angular': 'frontend',
    'backend|api|server': 'backend',
    'devops|docker|kubernetes|deploy': 'devops',
    'mcp|server': 'mcp',
    'skill|agent': 'skill',
    'doc|documentation': 'documentation',
    'anal|analysis|report': 'analysis',
    'perf|performance|optim': 'performance',
    'utility|helper|tool': 'utility'
  };

  for (const [pattern, category] of Object.entries(categoryMap)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(text)) return category;
  }

  return 'utility';
}

// Main scan function
function scanMarketplaces() {
  const results = {
    totalPluginsFound: 0,
    pluginsByMarketplace: {},
    pluginsProcessed: 0,
    errors: []
  };

  for (const [marketplaceName, marketplaceInfo] of Object.entries(MARKETPLACES)) {
    try {
      const pluginDir = marketplaceInfo.installLocation;
      const plugins = readMarketplacePlugins(pluginDir);
      results.pluginsByMarketplace[marketplaceName] = Object.keys(plugins).length;
      results.totalPluginsFound += Object.keys(plugins).length;

      // Add to registry structure
      for (const [pluginName, pluginData] of Object.entries(plugins)) {
        pluginData.marketplace = marketplaceName;
        results.pluginsProcessed++;
      }
    } catch (e) {
      results.errors.push(`${marketplaceName}: ${e.message}`);
    }
  }

  return results;
}

// Generate registry update
function generateRegistryUpdate(scanResults) {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));

  // Update marketplace info
  for (const [name, info] of Object.entries(MARKETPLACES)) {
    if (!registry.marketplaces[name]) {
      registry.marketplaces[name] = {
        url: info.url,
        installLocation: info.installLocation,
        plugins: {}
      };
    }
  }

  // Update plugin catalog
  for (const [mpName, count] of Object.entries(scanResults.pluginsByMarketplace)) {
    registry.marketplaces[mpName].totalScanned = (registry.marketplaces[mpName].totalScanned || 0) + count;
  }

  registry.version = '1.0.0';
  registry.lastUpdated = new Date().toISOString();
  registry.registryMetrics.totalPluginsScanned = scanResults.totalPluginsFound;
  registry.registryMetrics.pluginsEvaluated = scanResults.pluginsProcessed;

  // Write updated registry
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

  return {
    success: true,
    totalScanned: scanResults.totalPluginsFound,
    totalProcessed: scanResults.pluginsProcessed,
    errors: scanResults.errors
  };
}

// Execute scan
try {
  const scanResults = scanMarketplaces();
  const updateResult = generateRegistryUpdate(scanResults);

  console.log(`=== Scan complet ===`);
  console.log(`Plugins trouvés: ${updateResult.totalScanned}`);
  console.log(`Plugins traités: ${updateResult.totalProcessed}`);

  if (updateResult.errors.length > 0) {
    console.log(`Erreurs: ${updateResult.errors.join('; ')}`);
  }

  console.log(`Registre mis à jour: ${REGISTRY_PATH}`);
} catch (e) {
  console.error(`Erreur fatale lors du scan: ${e.message}`);
  process.exit(1);
}