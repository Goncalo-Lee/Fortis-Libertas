package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.UserProfile
import java.math.BigDecimal

/**
 * JSON from GET /api/v1/me.
 * Money values come as String: Drizzle returns MySQL decimal(10,2)
 * columns as text, so no precision is lost.
 */
@Serializable
data class ProfileDto(
    val id: String,
    val fullName: String,
    val userName: String? = null,
    val email: String,
    val image: String? = null,
    val accountBalance: String = "0",
    val amountSaved: String = "0",
    val currency: String = "EUR",
) {
    fun toModel() = UserProfile(
        id = id,
        fullName = fullName,
        userName = userName,
        email = email,
        imageUrl = image,
        accountBalance = accountBalance.toBigDecimalOrNull() ?: BigDecimal.ZERO,
        amountSaved = amountSaved.toBigDecimalOrNull() ?: BigDecimal.ZERO,
        currency = currency,
    )
}
