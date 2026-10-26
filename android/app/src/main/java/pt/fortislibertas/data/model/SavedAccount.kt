package pt.fortislibertas.data.model

import kotlinx.serialization.Serializable

/**
 * Conta guardada no dispositivo, para poder trocar de conta sem novo login.
 * O token Bearer de cada conta fica aqui; nunca é mostrado na UI.
 */
@Serializable
data class SavedAccount(
    val id: String,
    val fullName: String,
    val email: String,
    val imageUrl: String? = null,
    val token: String,
)
