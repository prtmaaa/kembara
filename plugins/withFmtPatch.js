const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Workaround for Xcode 26.4+: fmt 11.0.2 uses consteval that breaks with Apple Clang.
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
    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      content = File.read(fmt_base)
      unless content.include?('Xcode 26 workaround')
        patched = content.gsub(
          /^(#elif defined\\(__cpp_consteval\\)\\n#  define FMT_USE_CONSTEVAL) 1/,
          "// Xcode 26 workaround: disable consteval\\n\\\\1 0"
        )
        if patched != content
          File.chmod(0644, fmt_base)
          File.write(fmt_base, patched)
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
