package pt.fortislibertas.data.model

import kotlinx.serialization.Serializable

/**
 * Account saved on the device, to switch accounts without signing in again.
 * Each account's Bearer token lives here; it is never shown in the UI.
 */
@Serializable
data class SavedAccount(
    val id: String,
    val fullName: String,
    val email: String,
    val imageUrl: String? = null,
    val token: String,
    val remember: Boolean = true,   // false = only for this session ("Remember me" off)
)
