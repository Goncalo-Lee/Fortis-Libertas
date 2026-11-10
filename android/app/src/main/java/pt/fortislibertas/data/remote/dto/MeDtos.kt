package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import pt.fortislibertas.data.model.AccountDetails
import java.time.LocalDate

/** JSON of GET /api/v1/me (endpoints.md §3.2), only what Edit account needs. */
@Serializable
data class MeDto(
    @SerialName("user_id") val id: String = "",
    @SerialName("user_name") val userName: String? = null,
    @SerialName("full_name") val fullName: String,
    val email: String,
    val image: String? = null,
    val profile: MeProfileDto? = null,
) {
    fun toAccountDetails() = AccountDetails(
        fullName = fullName,
        userName = userName,
        email = email,
        imageUrl = image,
        phone = profile?.phone,
        birthDate = profile?.birthDate?.let { runCatching { LocalDate.parse(it.take(10)) }.getOrNull() },
        currency = profile?.currency ?: "EUR",
        primaryBankAccountId = profile?.primaryBankAccountId,
    )
}

/** Embedded profile (§3.3). */
@Serializable
data class MeProfileDto(
    @SerialName("birth_date") val birthDate: String? = null,
    val phone: String? = null,
    val currency: String = "EUR",
    @SerialName("primary_bank_account_id") val primaryBankAccountId: String? = null,
)
