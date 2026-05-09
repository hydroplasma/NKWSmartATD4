	string[]	

Override the default reactNativeArchitectures list of ABIs to build in gradle.properties.

Default:
["armeabi-v7a", "arm64-v8a", "x86", "x86_64"]

See: Android documentation for more information.

Example

["arm64-v8a", "x86_64"]


buildFromSource
(optional)
	boolean	

Deprecated: Use buildReactNativeFromSource instead.

Enable building React Native from source. Turning this on will significantly increase the build times.

Default:
false

buildReactNativeFromSource
(optional)
	boolean	

Enable building React Native from source. Turning this on will significantly increase the build times.

Default:
false

buildToolsVersion
(optional)
	string	

Override the default buildToolsVersion version number in build.gradle.


compileSdkVersion
(optional)
	number	

Override the default compileSdkVersion version number in build.gradle.


enableBundleCompression
(optional)
	boolean	

Enable JavaScript Bundle compression. Turning this on will result in a smaller APK size but may have slower app startup times.

Default:
false

See: Faster App Startup


enableMinifyInReleaseBuilds
(optional)
	boolean	

Enable R8 in release builds to obfuscate Java code and reduce app size.


enablePngCrunchInReleaseBuilds
(optional)
	boolean	

Enable crunchPngs in release builds to optimize PNG files. This property is enabled by default, but "might inflate PNG files that are already compressed", so you may want to disable it if you do your own PNG optimization.

Default:
true

enableShrinkResourcesInReleaseBuilds
(optional)
	boolean	

Enable shrinkResources in release builds to remove unused resources from the app. This property should be used in combination with enableMinifyInReleaseBuilds.


exclusiveMavenMirror
(optional)
	string	

Specifies a single Maven repository to be used as an exclusive mirror for all dependency resolution. When set, all other Maven repositories will be ignored and only this repository will be used to fetch dependencies.

See: Using a Maven Mirror


extraMavenRepos
(optional)
	(string | AndroidMavenRepository)[]	

Add extra maven repositories to all gradle projects.

Takes an array of objects or strings. Strings are passed as the url property of the object with no credentials or authentication scheme.

This adds the following code to android/build.gradle:

allprojects {
 repositories {
  maven {
   url "https://foo.com/maven-releases"
 }
}


By using an AndroidMavenRepository object, you can specify credentials and an authentication scheme.

allprojects {
  repositories {
    maven {
      url "https://foo.com/maven-releases"
      credentials {
       username = "bar"
       password = "baz"
      }
      authentication {
       basic(BasicAuthentication)
      }
    }
  }
}


See: Gradle documentation


extraProguardRules
(optional)
	string	

Append custom Proguard rules to android/app/proguard-rules.pro.


kotlinVersion
(optional)
	string	

Override the Kotlin version used when building the app.


manifestQueries
(optional)
	PluginConfigTypeAndroidQueries	

Specifies the set of other apps that an app intends to interact with. These other apps are specified by package name, by intent signature, or by provider authority.

See: Android documentation


minSdkVersion
(optional)
	number	

Override the default minSdkVersion version number in build.gradle.


networkInspector
(optional)
	boolean	

Enable the Network Inspector.

Default:
true

newArchEnabled
(optional)
	boolean	

Deprecated: Use newArchEnabled in app config file instead.

Enable React Native New Architecture for Android platform.


packagingOptions
(optional)
	PluginConfigTypeAndroidPackagingOptions	

Interface representing available configuration for Android Gradle plugin PackagingOptions.


reactNativeReleaseLevel
(optional)
	'stable' | 'canary' | 'experimental'	

The React Native release level to use for the project. This can be used to enable different sets of internal React Native feature flags.

Default:
'stable'

targetSdkVersion
(optional)
	number	

Override the default targetSdkVersion version number in build.gradle.