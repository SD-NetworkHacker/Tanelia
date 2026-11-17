// Intelligent Plugin Manager - Core Implementation
// This module provides the core logic for the intelligent-plugin-manager skill

const fs = require('fs');
const path = require('path');

// Use global .claude directory for IPMS (shared across all projects)
const CLAUDE_DIR = 'C:/Users/unchk/.claude';
const IPMS_DIR = path.join(CLAUDE_DIR, 'ipms');
const REGISTRY_PATH = path.join(IPMS_DIR, 'plugin-registry.json');
const POLICIES_PATH = path.join(IPMS_DIR, 'plugin-policies.json');

// Load registry
function loadRegistry() {
  try {
    const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to load registry:', e.message);
    return null;
  }
}

// Save registry
function saveRegistry(registry) {
  try {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
    return true;
  } catch (e) {
    console.error('Failed to save registry:', e.message);
    return false;
  }
}

// Load policies
function loadPolicies() {
  try {
    const content = fs.readFileSync(POLICIES_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to load policies:', e.message);
    return null;
  }
}

// Save policies
function savePolicies(policies) {
  try {
    fs.writeFileSync(POLICIES_PATH, JSON.stringify(policies, null, 2));
    return true;
  } catch (e) {
    console.error('Failed to save policies:', e.message);
    return false;
  }
}

// Evaluate a plugin's quality score based on multiple criteria
function evaluatePluginQuality(pluginData) {
  let score = 50; // Base score

  // Factor: Update frequency (recent = higher score)
  if (pluginData.lastUpdated) {
    const lastUpdated = new Date(pluginData.lastUpdated);
    const daysSinceUpdate = (new Date() - lastUpdated) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) score += 15;
    else if (daysSinceUpdate < 30) score += 10;
    else if (daysSinceUpdate < 90) score += 5;
  }

  // Factor: Security score contribution
  if (pluginData.securityScore) {
    score += Math.round(pluginData.securityScore / 10);
  }

  // Factor: Quality score contribution
  if (pluginData.qualityScore) {
    score += Math.round(pluginData.qualityScore / 10);
  }

  // Factor: Context cost (lower is better)
  if (pluginData.contextCost) {
    const costMap = { low: 10, medium: 5, high: -5 };
    score += (costMap[pluginData.contextCost] || 0);
  }

  // Factor: Feature richness
  if (pluginData.features && Array.isArray(pluginData.features)) {
    score += Math.min(pluginData.features.length * 2, 15);
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

// Classify quality tier
function classifyQualityTier(score) {
  if (score >= 90) return 'ESSENTIEL';
  if (score >= 75) return 'RECOMMANDÉ';
  if (score >= 60) return 'SPÉCIALISÉ';
  if (score >= 40) return 'FACULTATIF';
  return 'À ÉVITER';
}

// Detect duplicates by comparing features and capabilities
function detectDuplicates(registry) {
  const duplicates = [];
  const plugins = Object.values(registry.installedPlugins || {});
  const availablePlugins = [];

  // Collect all available plugins from marketplaces
  for (const [mpName, mpData] of Object.entries(registry.marketplaces || {})) {
    for (const [pluginName, pluginData] of Object.entries(mpData.plugins || {})) {
      availablePlugins.push({
        name: pluginName,
        marketplace: mpName,
        features: pluginData.features || [],
        category: pluginData.category,
        qualityScore: pluginData.qualityScore || 0
      });
    }
  }

  // Compare installed plugins against available ones
  for (const installed of plugins) {
    const installedName = installed?.name?.toString() || '';
    const installedCat = installed?.category?.toString() || '';
    const matchingAvailable = availablePlugins.filter(
      available =>
        available?.name?.toString()?.toLowerCase() === installedName?.toLowerCase() &&
        available?.category?.toString() === installedCat
    );

    for (const available of matchingAvailable) {
      // Check feature overlap
      const installedFeatures = new Set(installed.features || []);
      const availableFeatures = new Set(available.features || []);
      const overlap = [...installedFeatures].filter(f => availableFeatures.has(f)).length;

      if (overlap >= 3 && installed.qualityScore && available.qualityScore) {
        // Calculate relative quality
        const qualityRatio = available.qualityScore / installed.qualityScore;
        if (qualityRatio >= 1.2 && available.qualityScore >= 75) {
          duplicates.push({
            existing: { name: installed.name, quality: installed.qualityScore, features: installed.features },
            candidate: { name: available.name, quality: available.qualityScore, features: available.features },
            overlap: overlap,
            recommendation: available.qualityScore > installed.qualityScore
              ? 'Remplacer'
              : 'Considérer comme alternative'
          });
        }
      }
    }
  }

  return duplicates;
}

// Scan and update registry from marketplaces
function scanAndUpdateRegistry() {
  const registry = loadRegistry();
  if (!registry) return { success: false, error: 'Cannot load registry' };

  const marketplacePlugins = {};

  // Read plugins from each marketplace
  for (const [mpName, mpData] of Object.entries(registry.marketplaces || {})) {
    const mpDir = mpData.installLocation;
    if (!fs.existsSync(mpDir)) continue;

    try {
      const entries = fs.readdirSync(mpDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(mpDir, entry.name);
          const pluginJsonPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');

          if (fs.existsSync(pluginJsonPath)) {
            try {
              const jsonContent = fs.readFileSync(pluginJsonPath, 'utf-8');
              const parsed = JSON.parse(jsonContent);

              if (!marketplacePlugins[mpName]) marketplacePlugins[mpName] = {};
              marketplacePlugins[mpName][entry.name] = {
                name: parsed.name || entry.name,
                version: parsed.version || 'unknown',
                description: parsed.description || '',
                author: parsed.author || {},
                marketplace: mpName
              };
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error scanning ${mpName}:`, e.message);
    }
  }

  // Update registry with scanned plugins
  for (const [mpName, plugins] of Object.entries(marketplacePlugins)) {
    if (!registry.marketplaces[mpName]) {
      registry.marketplaces[mpName] = { url: '', installLocation: '', plugins: {} };
    }
    for (const [pluginName, pluginData] of Object.entries(plugins)) {
      // Only add if not already present or if new version is newer
      if (!registry.marketplaces[mpName].plugins[pluginName] ||
          isNewerVersion(pluginData.version, registry.marketplaces[mpName].plugins[pluginName].version)) {
        registry.marketplaces[mpName].plugins[pluginName] = {
          ...pluginData,
          status: 'available',
          qualityScore: evaluatePluginQuality(pluginData),
          category: pluginData.category || classifyPluginCategory(pluginName, pluginData.description || ''),
          lastScanned: new Date().toISOString()
        };
      }
    }
  }

  // Detect and record duplicates
  const duplicates = detectDuplicates(registry);
  if (duplicates.length > 0) {
    registry.registryMetrics.duplicatesDetected += duplicates.length;
    registry.potentialDuplicates = duplicates;
  }

  saveRegistry(registry);
  return { success: true, duplicatesCount: duplicates.length, registry };
}

// Check if new version is newer (simple semver-like comparison)
function isNewerVersion(newVersion, oldVersion) {
  if (!oldVersion) return true;
  const newParts = newVersion.split('.').map(p => parseInt(p, 10) || 0);
  const oldParts = oldVersion.split('.').map(p => parseInt(p, 10) || 0);

  for (let i = 0; i < 3; i++) {
    if (newParts[i] > oldParts[i]) return true;
    if (newParts[i] < oldParts[i]) return false;
  }
  return false;
}

// Classify plugin category from name/description
function classifyPluginCategory(pluginName, description) {
  const text = (pluginName + ' ' + description).toLowerCase();

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

// Authorize new plugin installation
function authorizeInstallation(pluginName, reason) {
  const policies = loadPolicies();
  if (!policies) return { approved: false, error: 'Cannot load policies' };

  const installationPolicies = policies.installationPolicies || {};
  if (!installationPolicies.requireApproval) {
    return { approved: true, reason: 'Approval not required' };
  }

  // Check if plugin is already approved or essential
  const activatedPlugins = loadRegistry()?.activatedPlugins || [];
  if (activatedPlugins.includes(pluginName)) {
    return { approved: true, reason: 'Already activated' };
  }

  return {
    approved: true,
    reason: `Installation authorized: ${reason}. Requires user confirmation.`,
    needsUserConfirmation: true
  };
}

// Activate a plugin for current session
function activatePlugin(pluginName) {
  const registry = loadRegistry();
  if (!registry) return { success: false, error: 'Cannot load registry' };

  // Mark plugin as activated
  if (!registry.activatedPlugins) registry.activatedPlugins = [];
  if (!registry.activatedPlugins.includes(pluginName)) {
    registry.activatedPlugins.push(pluginName);
  }

  // Update quality scores
  const pluginData = registry.installedPlugins?.[pluginName];
  if (pluginData) {
    pluginData.activatedAt = new Date().toISOString();
    pluginData.status = 'active';
  }

  saveRegistry(registry);
  return { success: true, activated: pluginName };
}

// Deactivate a plugin
function deactivatePlugin(pluginName) {
  const registry = loadRegistry();
  if (!registry) return { success: false, error: 'Cannot load registry' };

  // Remove from activated list
  if (registry.activatedPlugins) {
    registry.activatedPlugins = registry.activatedPlugins.filter(p => p !== pluginName);
  }

  // Update installed plugin status
  if (registry.installedPlugins?.[pluginName]) {
    registry.installedPlugins[pluginName].status = 'inactive';
    delete registry.installedPlugins[pluginName].activatedAt;
  }

  saveRegistry(registry);
  return { success: true, deactivated: pluginName };
}

// Get plugin recommendations for a task
function getPluginRecommendations(taskRequirements) {
  const registry = loadRegistry();
  if (!registry) return { success: false, error: 'Cannot load registry' };

  const requirements = taskRequirements || {};
  const category = requirements.category || 'utility';
  const contextCost = requirements.contextCost || 'low';
  const exclude = new Set(requirements.exclude || []);

  const scoredPlugins = [];

  // Scan all available plugins from marketplaces
  for (const [mpName, mpData] of Object.entries(registry.marketplaces || {})) {
    for (const [pluginName, pluginData] of Object.entries(mpData.plugins || {})) {
      if (exclude.has(pluginName)) continue;

      let score = 0;

      // Category match
      if (pluginData.category === category) score += 20;

      // Context cost match
      if (pluginData.contextCost === contextCost) score += 15;

      // Quality score
      if (pluginData.qualityScore) score += pluginData.qualityScore * 0.3;

      // Security score
      if (pluginData.securityScore) score += pluginData.securityScore * 0.2;

      // Feature relevance (simple count)
      if (pluginData.features && Array.isArray(pluginData.features)) {
        score += pluginData.features.length * 1;
      }

      // Priority: essential and recommended first
      const tier = classifyQualityTier(pluginData.qualityScore || 0);
      if (tier === 'ESSENTIEL') score += 30;
      if (tier === 'RECOMMANDÉ') score += 15;

      scoredPlugins.push({
        name: pluginName,
        marketplace: mpName,
        score: Math.round(score),
        tier: classifyQualityTier(pluginData.qualityScore || 0),
        category: pluginData.category,
        contextCost: pluginData.contextCost,
        features: pluginData.features || []
      });
    }
  }

  // Sort by score descending
  scoredPlugins.sort((a, b) => b.score - a.score);

  return {
    success: true,
    recommendations: scoredPlugins.slice(0, 10), // Top 10
    totalAvailable: scoredPlugins.length
  };
}

// Export functions for use by the skill
module.exports = {
  loadRegistry,
  saveRegistry,
  loadPolicies,
  savePolicies,
  evaluatePluginQuality,
  classifyQualityTier,
  detectDuplicates,
  scanAndUpdateRegistry,
  isNewerVersion,
  classifyPluginCategory,
  authorizeInstallation,
  activatePlugin,
  deactivatePlugin,
  getPluginRecommendations
};