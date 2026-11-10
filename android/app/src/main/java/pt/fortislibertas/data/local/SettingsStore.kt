package pt.fortislibertas.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import pt.fortislibertas.data.model.ThemeMode

// Must be top-level: creates ONE DataStore for the whole app
private val Context.settingsDataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

/**
 * Settings of this phone (same for every account). Only the theme lives here:
 * the API has no field for it. The language is kept by Android (AppCompatDelegate).
 */
class SettingsStore(context: Context) {

    private val dataStore = context.applicationContext.settingsDataStore
    private val themeKey = stringPreferencesKey("theme_mode")

    val themeMode: Flow<ThemeMode> = dataStore.data
        .map { prefs -> prefs[themeKey]?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() } ?: ThemeMode.System }
        .distinctUntilChanged()

    suspend fun setThemeMode(mode: ThemeMode) {
        dataStore.edit { it[themeKey] = mode.name }
    }
}
