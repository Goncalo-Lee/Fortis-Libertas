package pt.fortislibertas.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import pt.fortislibertas.data.model.SavedAccount
import pt.fortislibertas.data.model.UserProfile

// Must be top-level: creates ONE DataStore for the whole app
private val Context.accountsDataStore: DataStore<Preferences> by preferencesDataStore(name = "accounts")

/**
 * Stores the signed-in accounts on this device and which one is active.
 * Works the same in local (fake) and API modes.
 *
 * Security note: in v1 the tokens stay in DataStore (private to the app).
 * In a future version, encrypt them with the Android Keystore.
 */
class AccountStore(context: Context) {

    private val dataStore = context.applicationContext.accountsDataStore
    private val json = Json { ignoreUnknownKeys = true }
    private val listSerializer = ListSerializer(SavedAccount.serializer())

    private object Keys {
        val ACCOUNTS = stringPreferencesKey("accounts_json")
        val ACTIVE_ID = stringPreferencesKey("active_account_id")
    }

    val accounts: Flow<List<SavedAccount>> = dataStore.data
        .map { prefs -> decode(prefs[Keys.ACCOUNTS]) }
        .distinctUntilChanged()

    val activeAccountId: Flow<String?> = dataStore.data
        .map { prefs -> prefs[Keys.ACTIVE_ID] }
        .distinctUntilChanged()

    /** Token of the active account (used by AuthInterceptor). */
    suspend fun activeToken(): String? {
        val prefs = dataStore.data.first()
        val activeId = prefs[Keys.ACTIVE_ID] ?: return null
        return decode(prefs[Keys.ACCOUNTS]).firstOrNull { it.id == activeId }?.token
    }

    /** Saves (or replaces) an account, for example after sign in. */
    suspend fun save(account: SavedAccount, makeActive: Boolean = true) {
        dataStore.edit { prefs ->
            val list = decode(prefs[Keys.ACCOUNTS]).filterNot { it.id == account.id } + account
            prefs[Keys.ACCOUNTS] = encode(list)
            if (makeActive) prefs[Keys.ACTIVE_ID] = account.id
        }
    }

    /** Local mode only: creates test accounts if there are none yet. */
    suspend fun seedIfEmpty(seed: List<SavedAccount>) {
        dataStore.edit { prefs ->
            if (decode(prefs[Keys.ACCOUNTS]).isEmpty() && seed.isNotEmpty()) {
                prefs[Keys.ACCOUNTS] = encode(seed)
                prefs[Keys.ACTIVE_ID] = seed.first().id
            }
        }
    }

    suspend fun switchTo(accountId: String) {
        dataStore.edit { prefs ->
            if (decode(prefs[Keys.ACCOUNTS]).any { it.id == accountId }) {
                prefs[Keys.ACTIVE_ID] = accountId
            }
        }
    }

    /** Removes the account. If it was the active one, switches to the next (or none). */
    suspend fun remove(accountId: String) {
        dataStore.edit { prefs ->
            val list = decode(prefs[Keys.ACCOUNTS]).filterNot { it.id == accountId }
            prefs[Keys.ACCOUNTS] = encode(list)
            if (prefs[Keys.ACTIVE_ID] == accountId) {
                val next = list.firstOrNull()
                if (next != null) prefs[Keys.ACTIVE_ID] = next.id else prefs.remove(Keys.ACTIVE_ID)
            }
        }
    }

    /** Updates the saved name/email/photo with the latest profile data. */
    suspend fun updateDetails(profile: UserProfile) {
        dataStore.edit { prefs ->
            val list = decode(prefs[Keys.ACCOUNTS]).map {
                if (it.id == profile.id) {
                    it.copy(fullName = profile.fullName, email = profile.email, imageUrl = profile.imageUrl)
                } else it
            }
            prefs[Keys.ACCOUNTS] = encode(list)
        }
    }

    /** Better Auth may send a new token in the "set-auth-token" header. */
    suspend fun updateActiveToken(newToken: String) {
        dataStore.edit { prefs ->
            val activeId = prefs[Keys.ACTIVE_ID] ?: return@edit
            val list = decode(prefs[Keys.ACCOUNTS]).map {
                if (it.id == activeId) it.copy(token = newToken) else it
            }
            prefs[Keys.ACCOUNTS] = encode(list)
        }
    }

    private fun decode(raw: String?): List<SavedAccount> =
        if (raw.isNullOrBlank()) emptyList()
        else runCatching { json.decodeFromString(listSerializer, raw) }.getOrDefault(emptyList())

    private fun encode(list: List<SavedAccount>): String = json.encodeToString(listSerializer, list)
}
