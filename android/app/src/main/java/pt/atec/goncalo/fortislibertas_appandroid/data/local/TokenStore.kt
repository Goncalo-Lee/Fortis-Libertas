package pt.atec.goncalo.fortislibertas_appandroid.data.local

import android.content.Context

// TODO: considerar EncryptedSharedPreferences para guardar o token com seguranca
class TokenStore(context: Context) {

    private val prefs = context.getSharedPreferences("fortis_auth", Context.MODE_PRIVATE)

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun saveToken(token: String) {
        prefs.edit().putString(KEY_TOKEN, token).apply()
    }

    fun clear() {
        prefs.edit().remove(KEY_TOKEN).apply()
    }

    private companion object {
        const val KEY_TOKEN = "access_token"
    }
}
