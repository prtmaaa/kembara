const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Workaround for Xcode 26.4+: fmt 11.0.2 uses consteval that breaks with Apple Clang.
// The fmt/base.h header checks #ifdef FMT_USE_CONSTEVAL first, so pre-defining it to 0
// via GCC_PREPROCESSOR_DEFINITIONS disables consteval for all pods that use fmt headers.
// https://github.com/expo/expo/issues/44229
module.exports = function withFmtPatch(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let contents = fs.readFileSync(podfilePath, "utf8");

      const fmtPatch = `
    # Workaround for Xcode 26.4+: fmt 11.0.2 consteval breaks with Apple Clang.
    # https://github.com/expo/expo/issues/44229
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS']
        defs = defs ? Array(defs) : ['$(inherited)']
        unless defs.any? { |d| d.to_s.include?('FMT_USE_CONSTEVAL') }
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs + ['FMT_USE_CONSTEVAL=0']
        end
      end
    end
`;

      const insertionPoint = contents.lastIndexOf("  end\nend");
      if (insertionPoint === -1) {
        console.warn("[withFmtPatch] Could not find post_install end in Podfile — skipping patch.");
        return config;
      }

      contents =
        contents.slice(0, insertionPoint) +
        fmtPatch +
        "  end\nend";

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
