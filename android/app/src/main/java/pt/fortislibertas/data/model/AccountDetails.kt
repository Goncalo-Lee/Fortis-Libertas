package pt.fortislibertas.data.model

import java.time.LocalDate

/** What the Edit account screen shows and changes (User + Profile in the API). */
data class AccountDetails(
    val fullName: String,
    val userName: String?,
    val email: String,                      // read only: changed on the website (Better Auth)
    val imageUrl: String?,                  // read only: no upload in the API yet
    val phone: String?,
    val birthDate: LocalDate?,
    val currency: String,
    val primaryBankAccountId: String?,
)

/** Currencies of the API catalog (GET /currencies). */
val SUPPORTED_CURRENCIES = listOf("EUR", "USD", "GBP", "BRL")
