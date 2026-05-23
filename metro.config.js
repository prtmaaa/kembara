const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force @supabase/supabase-js to use its CJS build.
// The ESM build (index.mjs) uses import(variable) for optional OpenTelemetry support,
// which Hermes rejects. The CJS build uses require() instead, which works fine.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@supabase/supabase-js') {
    return {
      filePath: require.resolve('@supabase/supabase-js/dist/index.cjs'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
