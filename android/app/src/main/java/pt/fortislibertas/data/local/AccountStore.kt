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

// Tem de ser top-level: cria UM DataStore para toda a app
private val Context.accountsDataStore: DataStore<Preferences> by preferencesDataStore(name = "accounts")

/**
 * Guarda as contas com sessão iniciada neste dispositivo e qual está ativa.
 * Funciona igual nos modos local (fake) e API.
 *
 * Nota de segurança: na v1 os tokens ficam no DataStore (privado da app).
 * Numa versão futura, cifra-os com o Android Keystore.
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

    /** Token da conta ativa (usado pelo AuthInterceptor). */
    suspend fun activeToken(): String? {
        val prefs = dataStore.data.first()
        val activeId = prefs[Keys.ACTIVE_ID] ?: return null
        return decode(prefs[Keys.ACCOUNTS]).firstOrNull { it.id == activeId }?.token
    }

    /** Guarda (ou substitui) uma conta, por exemplo depois do login. */
    suspend fun save(account: SavedAccount, makeActive: Boolean = true) {
        dataStore.edit { prefs ->
            val list = decode(prefs[Keys.ACCOUNTS]).filterNot { it.id == account.id } + account
            prefs[Keys.ACCOUNTS] = encode(list)
            if (makeActive) prefs[Keys.ACTIVE_ID] = account.id
        }
    }

    /** Só para o modo local: cria contas de teste se ainda não houver nenhuma. */
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

    /** Remove a conta. Se era a ativa, passa para a seguinte (ou nenhuma). */
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

    /** Atualiza nome/email/foto guardados com os dados mais recentes do perfil. */
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

    /** O Better Auth pode enviar um token novo no header "set-auth-token". */
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
