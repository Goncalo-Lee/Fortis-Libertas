package pt.fortislibertas.data.model

/** Light/dark mode chosen in the Profile. System = follow the phone. */
enum class ThemeMode { System, Light, Dark }

/** Languages of the app. [tag] is the Android locale and also the API code (Profile.language). */
enum class AppLanguage(val tag: String) {
    Portuguese("pt-PT"),
    English("en"),
}
