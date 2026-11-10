package pt.fortislibertas.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

// Must be top-level: creates ONE DataStore for the whole app
private val Context.cardColorsDataStore: DataStore<Preferences> by preferencesDataStore(name = "card_colors")

/**
 * TEMPORARY: card colours chosen in the app, saved on this phone.
 * The API has no color for cards yet (see plano-api-cartoes). When it has, the colour
 * goes in PATCH /cards/{id} and this class can be deleted.
 */
class CardColorStore(context: Context) {

    private val dataStore = context.applicationContext.cardColorsDataStore

    /** cardId → "#RRGGBB" */
    suspend fun all(): Map<String, String> =
        dataStore.data.first().asMap().mapKeys { it.key.name }.mapValues { it.value.toString() }

    suspend fun set(cardId: String, hex: String) {
        dataStore.edit { it[stringPreferencesKey(cardId)] = hex }
    }

    suspend fun remove(cardId: String) {
        dataStore.edit { it.remove(stringPreferencesKey(cardId)) }
    }
}
