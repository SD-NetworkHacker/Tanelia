// Task Plugin Orchestrator - Core Implementation
// This module provides the core logic for the task-plugin-orchestrator skill

const fs = require('fs');
const path = require('path');

// Use global .claude directory for IPMS (shared across all projects)
const CLAUDE_DIR = 'C:/Users/unchk/.claude';
const IPMS_DIR = path.join(CLAUDE_DIR, 'ipms');
const REGISTRY_PATH = path.join(IPMS_DIR, 'plugin-registry.json');
const POLICIES_PATH = path.join(IPMS_DIR, 'plugin-policies.json');

// Load registry helper
function loadRegistry() {
  try {
    const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to load registry:', e.message);
    return null;
  }
}

// Save registry helper
function saveRegistry(registry) {
  try {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
    return true;
  } catch (e) {
    console.error('Failed to save registry:', e.message);
    return false;
  }
}

// Load policies helper
function loadPolicies() {
  try {
    const content = fs.readFileSync(POLICIES_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to load policies:', e.message);
    return null;
  }
}

// Analyze a task to determine required capabilities
function analyzeTask(taskDescription) {
  if (!taskDescription) {
    return { success: false, error: 'Task description required' };
  }

  const analysis = {
    nature: classifyTaskNature(taskDescription),
    technologies: extractTechnologies(taskDescription),
    requiredCapabilities: [],
    suggestedPlugins: [],
    securityNeeds: false,
    deploymentNeeds: false
  };

  // Map task nature to required capabilities
  const natureToCapabilities = {
    'development': ['code-generation', 'debugging', 'testing'],
    'frontend': ['frontend-design', 'ui-components', 'styling'],
    'backend': ['api-design', 'database-design', 'security'],
    'testing': ['testing', 'code-review', 'debugging'],
    'security': ['security', 'vulnerability-scanning'],
    'deployment': ['deployment', 'ci-cd', 'environment-config'],
    'design': ['design', 'ui-components', 'design-systems'],
    'research': ['research', 'analysis', 'documentation'],
    'documentation': ['documentation', 'knowledge-management']
  };

  const capabilities = natureToCapabilities[analysis.nature] || ['utility'];
  analysis.requiredCapabilities = [...new Set(capabilities)];

  // Extract technologies
  const techPatterns = {
    'react': ['react', 'frontend-design'],
    'vue': ['vue', 'frontend-design'],
    'angular': ['angular', 'frontend-design'],
    'node': ['node', 'backend-development'],
    'python': ['python', 'huggingface-skills'],
    'typescript': ['typescript-lsp', 'code-simplifier'],
    'docker': ['docker', 'devops'],
    'kubernetes': ['kubernetes', 'devops'],
    'supabase': ['supabase', 'deployment'],
    'api': ['api-testing-observability', 'backend-api-security']
  };

  for (const [tech, plugins] of Object.entries(techPatterns)) {
    if (/\\b${tech}\\b/i.test(taskDescription)) {
      analysis.technologies.push(tech);
      analysis.requiredCapabilities.push(...plugins);
    }
  }

  // Deduplicate capabilities
  analysis.requiredCapabilities = [...new Set(analysis.requiredCapabilities)];

  // Detect if skill orchestration is needed
  if (analysis.requiredCapabilities.length > 3) {
    analysis.skillOrchestrationNeeded = true;
  }

  return { success: true, analysis };
}

// Classify task nature from description
function classifyTaskNature(description) {
  const lower = description.toLowerCase();

  const natureMap = {
    development: ['development', 'code', 'program', 'implement', 'feature', 'build'],
    frontend: ['frontend', 'ui', 'interface', 'react', 'vue', 'angular', 'design', 'layout'],
    backend: ['backend', 'api', 'server', 'database', 'auth', 'node', 'python', 'ruby'],
    testing: ['test', 'spec', 'quality', 'bug', 'verify', 'validate'],
    security: ['security', 'vulnerability', 'auth', 'permissions', 'protect'],
    deployment: ['deploy', 'release', 'ci', 'cd', 'pipeline', 'server'],
    design: ['design', 'ux', 'ui', 'wireframe', 'prototype', 'visual'],
    research: ['research', 'analyze', 'investigate', 'study'],
    documentation: ['document', 'write', 'manual', 'readme', 'knowledge']
  };

  for (const [nature, patterns] of Object.entries(natureMap)) {
    if (patterns.some(p => lower.includes(p))) return nature;
  }

  return 'utility';
}

// Extract technologies from task description
function extractTechnologies(description) {
  const lower = description.toLowerCase();
  const technologies = [];

  const techKeywords = {
    react: ['react', 'reactjs'],
    vue: ['vue', 'nuxt'],
    angular: ['angular', 'ng'],
    node: ['node', 'nodejs'],
    python: ['python', 'py'],
    typescript: ['typescript', 'ts'],
    docker: ['docker', 'container'],
    kubernetes: ['kubernetes', 'k8s'],
    supabase: ['supabase'],
    api: ['api', 'endpoint'],
    sql: ['sql', 'database'],
    git: ['git', 'repository'],
    aws: ['aws', 'amazon'],
    azure: ['azure', 'microsoft'],
    docker: ['docker']
  };

  for (const [tech, keywords] of Object.entries(techKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      technologies.push(tech);
    }
  }

  return technologies;
}

// Select plugins based on task requirements and available inventory
function selectPlugins(taskDescription, options = {}) {
  const registry = loadRegistry();
  if (!registry) return { success: false, error: 'Cannot load registry' };

  const { exclude = [], preferInstalled = true, minQualityScore = 0 } = options;

  // Analyze task requirements
  const analysis = analyzeTask(taskDescription);
  if (!analysis.success) return analysis;

  // Get plugin recommendations based on analyzed requirements
  const recommendations = getPluginRecommendationsForTask(
    analysis.requiredCapabilities,
    analysis.technologies,
    exclude,
    minQualityScore
  );

  // Filter to only installed plugins if preferred
  let filteredPlugins = recommendations.recommendations;
  if (preferInstalled) {
    const installedPlugins = registry.installedPlugins || {};
    filteredPlugins = filteredPlugins.filter(rec =>
      installedPlugins[rec.name] ? true : false
    );
  }

  // Activate installed plugins that are selected
  for (const pluginName of filteredPlugins.map(r => r.name)) {
    const pluginData = registry.installedPlugins?.[pluginName];
    if (pluginData && !registry.activatedPlugins?.includes(pluginName)) {
      activatePlugin(pluginName);
    }
  }

  return {
    success: true,
    taskAnalysis: analysis,
    selectedPlugins: filteredPlugins,
    activatedPlugins: (registry.activatedPlugins || []).filter(
      p => filteredPlugins.some(r => r.name === p)
    ),
    recommendations: {
      ...recommendations,
      plugins: filteredPlugins
    }
  };
}

// Get plugin recommendations for task based on capabilities and technologies
function getPluginRecommendationsForTask(capabilities, technologies, exclude = [], minQualityScore = 0) {
  const registry = loadRegistry();
  if (!registry) return { success: false, error: 'Cannot load registry' };

  const scoredPlugins = [];

  // Scan all available plugins from marketplaces
  for (const [mpName, mpData] of Object.entries(registry.marketplaces || {})) {
    for (const [pluginName, pluginData] of Object.entries(mpData.plugins || {})) {
      if (exclude.includes(pluginName)) continue;
      if (minQualityScore > 0 && (pluginData.qualityScore || 0) < minQualityScore) continue;

      let score = 0;

      // Match capabilities
      const pluginCapabilities = pluginData.features || [];
      const capsArray = Array.isArray(capabilities) ? capabilities : [capabilities];
      for (const cap of capsArray) {
        const capLower = String(cap).toLowerCase();
        for (const feat of pluginCapabilities) {
          if (feat && feat.toLowerCase().includes(capLower)) {
            score += 10;
          }
        }
      }

      // Match technologies
      const techMap = {
        'react': ['frontend-design', 'figma', 'superpowers'],
        'vue': ['frontend-design', 'superpowers'],
        'angular': ['frontend-design'],
        'node': ['backend-development', 'code-simplifier'],
        'python': ['huggingface-skills', 'code-simplifier'],
        'typescript': ['typescript-lsp', 'code-simplifier'],
        'docker': ['agent-orchestration', 'backend-development'],
        'supabase': ['supabase', 'backend-development'],
        'sql': ['database-design'],
        'testing': ['playwright', 'code-review', 'api-testing-observability']
      };

      for (const [tech, relatedPlugins] of Object.entries(techMap)) {
        const techsArray = Array.isArray(technologies) ? technologies : [technologies || ''];
        if (techsArray.includes(tech)) {
          for (const related of relatedPlugins) {
            if (related === pluginName) {
              score += 15;
            }
          }
        }
      }

      // Quality tier bonus (inline classification)
      const qualityScore = pluginData.qualityScore || 0;
      let tierScore = 0;
      if (qualityScore >= 90) tierScore = 30; // ESSENTIEL
      else if (qualityScore >= 75) tierScore = 20; // RECOMMANDÉ
      else if (qualityScore >= 60) tierScore = 10; // SPÉCIALISÉ
      else if (qualityScore >= 40) tierScore = 5; // FACULTATIF
      else tierScore = 0; // À ÉVITER
      score += tierScore;

      // Security priority
      if (pluginData.securityScore && pluginData.securityScore >= 85) {
        score += 10;
      }

      // Determine tier label
      let tierLabel;
      if (qualityScore >= 90) tierLabel = 'ESSENTIEL';
      else if (qualityScore >= 75) tierLabel = 'RECOMMANDÉ';
      else if (qualityScore >= 60) tierLabel = 'SPÉCIALISÉ';
      else if (qualityScore >= 40) tierLabel = 'FACULTATIF';
      else tierLabel = 'À ÉVITER';

      scoredPlugins.push({
        name: pluginName,
        marketplace: mpName,
        score: Math.round(score),
        tier: tierLabel,
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

// Release plugins after task completion
function releaseTaskPlugins(preserveEssential = true) {
  const registry = loadRegistry();
  if (!registry) return { success: false, error: 'Cannot load registry' };

  const pluginsToRelease = [];

  // Find temporarily activated plugins
  if (registry.activatedPlugins) {
    for (const pluginName of registry.activatedPlugins) {
      const pluginData = registry.installedPlugins?.[pluginName];
      if (pluginData) {
        // Check if this is a permanent plugin (part of core setup)
        const isPermanent = pluginData.permanent === true ||
                           ['superpowers', 'agent-orchestration', 'agent-harness', 'agent-memory'].includes(pluginName);

        if (!isPermanent && !preserveEssential) {
          // Release this plugin
          pluginsToRelease.push(pluginName);
        } else if (isPermanent && !preserveEssential) {
          // Still release permanent ones if explicitly asked
          pluginsToRelease.push(pluginName);
        }
      }
    }
  }

  // Deactivate released plugins
  for (const pluginName of pluginsToRelease) {
    deactivatePlugin(pluginName);
  }

  return {
    success: true,
    released: pluginsToRelease,
    stillActivated: (registry.activatedPlugins || []).filter(
      p => !pluginsToRelease.includes(p)
    )
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

  // Update installed plugin status
  const installedPlugin = registry.installedPlugins?.[pluginName];
  if (installedPlugin) {
    installedPlugin.activatedAt = new Date().toISOString();
    installedPlugin.status = 'active';
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

// Export functions for use by the skill
module.exports = {
  analyzeTask,
  classifyTaskNature,
  extractTechnologies,
  selectPlugins,
  getPluginRecommendationsForTask,
  releaseTaskPlugins,
  activatePlugin,
  deactivatePlugin,
  loadRegistry,
  saveRegistry
};