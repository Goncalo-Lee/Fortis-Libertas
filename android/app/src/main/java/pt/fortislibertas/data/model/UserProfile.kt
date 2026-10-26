package pt.fortislibertas.data.model

import java.math.BigDecimal

/**
 * Perfil do utilizador tal como a UI o usa.
 * Dinheiro em BigDecimal (nunca Double: 0.1 + 0.2 != 0.3 em Double).
 */
data class UserProfile(
    val id: String,
    val fullName: String,
    val userName: String?,
    val email: String,
    val imageUrl: String?,
    val accountBalance: BigDecimal,
    val amountSaved: BigDecimal,
    val currency: String = "EUR",
)
