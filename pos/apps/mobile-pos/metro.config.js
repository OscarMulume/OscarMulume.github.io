const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** Monorepo Turborepo : résolution des workspaces dans `packages/` et `apps/`. */
const config = getDefaultConfig(__dirname);

const repoRoot = path.resolve(__dirname, '../..');

config.watchFolders = [__dirname, repoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(repoRoot, 'node_modules'),
  path.resolve(__dirname, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

module.exports = config;