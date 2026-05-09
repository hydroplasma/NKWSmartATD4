/**
 * Custom Expo config plugin to fix react-native-gesture-handler AGP incompatibility.
 *
 * Root cause:
 *   - EAS Build uses AGP 8.11.0 (via AgpVersionAttr attribute matching)
 *   - react-native-gesture-handler 2.28/2.29 has its own buildscript block that
 *     hardcodes classpath("com.android.tools.build:gradle:8.10.1")
 *   - This creates an AgpVersionAttr conflict: consumer expects 8.11.0, library declares 8.10.1
 *   - Error: "Cannot query the value of this provider because it has no value available"
 *
 * Fix strategy:
 *   1. Remove the buildscript block from gesture-handler's build.gradle (it's not needed
 *      when building as part of the main project - the root project's AGP takes precedence)
 *   2. Set kotlinVersion in rootProject.ext so gesture-handler can find it without buildscript
 *
 * This plugin runs during `expo prebuild` / EAS Build prebuild phase.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withFixGestureHandlerBuild = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      // Path to gesture-handler's build.gradle in node_modules
      const gestureHandlerBuildGradle = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "react-native-gesture-handler",
        "android",
        "build.gradle"
      );

      if (!fs.existsSync(gestureHandlerBuildGradle)) {
        console.warn(
          "[withFixGestureHandlerBuild] Could not find gesture-handler build.gradle"
        );
        return config;
      }

      let contents = fs.readFileSync(gestureHandlerBuildGradle, "utf8");

      // Remove the buildscript block that hardcodes AGP 8.10.1
      // This block causes AgpVersionAttr conflict with EAS Build's AGP 8.11.0
      const buildscriptBlockRegex = /buildscript\s*\{[\s\S]*?\}\s*(?=\n(?:def|if|apply|android|dependencies|import|\/\/))/;
      
      if (buildscriptBlockRegex.test(contents)) {
        contents = contents.replace(buildscriptBlockRegex, "// buildscript block removed by withFixGestureHandlerBuild plugin\n");
        fs.writeFileSync(gestureHandlerBuildGradle, contents, "utf8");
        console.log("[withFixGestureHandlerBuild] Removed buildscript block from gesture-handler build.gradle");
      } else {
        console.log("[withFixGestureHandlerBuild] buildscript block not found or already removed");
      }

      // Also patch the app's build.gradle to ensure kotlinVersion is set in ext
      const appBuildGradle = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "build.gradle"
      );

      if (fs.existsSync(appBuildGradle)) {
        let appContents = fs.readFileSync(appBuildGradle, "utf8");
        // Ensure kotlinVersion is available in rootProject.ext for gesture-handler
        if (!appContents.includes("kotlinVersion")) {
          appContents = appContents.replace(
            /android\s*\{/,
            `// Set kotlinVersion for react-native-gesture-handler\nrootProject.ext.kotlinVersion = "2.1.20"\n\nandroid {`
          );
          fs.writeFileSync(appBuildGradle, appContents, "utf8");
          console.log("[withFixGestureHandlerBuild] Added kotlinVersion to app/build.gradle");
        }
      }

      return config;
    },
  ]);
};

module.exports = withFixGestureHandlerBuild;
