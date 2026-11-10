package pt.fortislibertas.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first

// Must be top-level: creates ONE DataStore for the whole app
private val Context.dashboardsDataStore: DataStore<Preferences> by preferencesDataStore(name = "dashboards")

/**
 * The active dashboard of each signed-in account (switching account keeps each one's choice).
 * Every screen that reads records asks this class which dashboard to use.
 */
class DashboardStore(context: Context, private val accountStore: AccountStore) {

    private val dataStore = context.applicationContext.dashboardsDataStore

    private fun key(accountId: String) = stringPreferencesKey("active_dashboard_$accountId")

    /** Active dashboard of the active account, or null when none was chosen yet. */
    val activeDashboardId: Flow<String?> =
        combine(accountStore.activeAccountId, dataStore.data) { accountId, prefs ->
            accountId?.let { prefs[key(it)] }
        }.distinctUntilChanged()

    suspend fun current(): String? = activeDashboardId.first()

    suspend fun setActive(dashboardId: String) {
        val accountId = accountStore.activeAccountId.first() ?: return
        dataStore.edit { it[key(accountId)] = dashboardId }
    }
}
