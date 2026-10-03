// Adopts the UIScene life cycle, which apps built with the iOS 27 SDK need to
// launch at all. Expo 57 ships the ExpoAppSceneDelegate class, but its iOS
// template doesn't use it yet (the SDK 58 template does). This plugin applies
// the SDK 58 template changes: a SceneDelegate, a scene manifest in
// Info.plist, and an AppDelegate that leaves window creation to the scene.
// Remove it after upgrading to an SDK whose template includes SceneDelegate.
const fs = require('fs');
const path = require('path');
const {
  IOSConfig,
  withAppDelegate,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');

const SCENE_DELEGATE = `internal import Expo

@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  // Extension point for config plugins.
}
`;

const WINDOW_SETUP =
  /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };

    return config;
  });
}

function withSceneAwareAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('ExpoReactNativeFactoryProvider')) {
      return config;
    }

    if (!WINDOW_SETUP.test(contents)) {
      throw new Error(
        'withSceneDelegate: AppDelegate.swift has an unexpected shape; update the plugin.'
      );
    }

    contents = contents
      .replace(
        'class AppDelegate: ExpoAppDelegate {',
        'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
      )
      .replace(
        WINDOW_SETUP,
        '\n    // The window is created and React Native is started by `SceneDelegate`\n    // under the scene-based life cycle (required by the iOS 27 SDK).\n'
      );

    config.modResults.contents = contents;

    return config;
  });
}

function withSceneDelegateFile(config) {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectName = IOSConfig.XcodeUtils.getProjectName(
        config.modRequest.projectRoot
      );
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        projectName,
        'SceneDelegate.swift'
      );
      fs.writeFileSync(filePath, SCENE_DELEGATE);

      return config;
    },
  ]);

  return withXcodeProject(config, (config) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(
      config.modRequest.projectRoot
    );
    const filepath = `${projectName}/SceneDelegate.swift`;

    if (!config.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath,
        groupName: projectName,
        project: config.modResults,
      });
    }

    return config;
  });
}

module.exports = function withSceneDelegate(config) {
  config = withSceneManifest(config);
  config = withSceneAwareAppDelegate(config);
  config = withSceneDelegateFile(config);

  return config;
};
