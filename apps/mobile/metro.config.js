// Monorepo fix: the workspace root hoists React 18 (web frontend) while this
// app needs React 19. Force every `react*` import to this app's own copies.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
const mobileRoot = __dirname;
const origResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "react" ||
    moduleName === "react-dom" ||
    moduleName === "scheduler" ||
    moduleName === "react-native" ||
    moduleName.startsWith("react/")
  ) {
    try {
      return {
        filePath: require.resolve(moduleName, { paths: [mobileRoot] }),
        type: "sourceFile",
      };
    } catch {
      // fall through
    }
  }
  if (origResolve) return origResolve(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
