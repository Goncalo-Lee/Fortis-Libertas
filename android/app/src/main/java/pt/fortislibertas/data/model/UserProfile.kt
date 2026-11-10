package pt.fortislibertas.data.model

import java.math.BigDecimal

/**
 * User profile as the UI uses it.
 * Money in BigDecimal (never Double: 0.1 + 0.2 != 0.3 in Double).
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
