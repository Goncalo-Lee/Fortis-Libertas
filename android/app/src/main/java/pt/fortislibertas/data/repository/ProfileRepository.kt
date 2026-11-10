package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.AccountDetails
import pt.fortislibertas.data.model.AppLanguage
import pt.fortislibertas.data.model.UserProfile

/**
 * What the Profile screen needs. The ViewModel only knows this interface,
 * so it does not know if the data is local (Fake) or from the API (Remote).
 */
interface ProfileRepository {
    suspend fun getProfile(): UserProfile
    suspend fun deactivateAccount()
    suspend fun deleteAccount()
    suspend fun signOut()
    /** Saves the language on the server too, so the website uses the same one. */
    suspend fun updateLanguage(language: AppLanguage)

    /** User + Profile fields for the Edit account screen. */
    suspend fun getAccountDetails(): AccountDetails

    /** Sends only what changed between [original] and [edited]. */
    suspend fun updateAccount(original: AccountDetails, edited: AccountDetails)
}

/** Errors the UI knows how to show. */
class SessionExpiredException : Exception("Session expired")
class NetworkException(cause: Throwable) : Exception("Network error", cause)
class NotSignedInException : Exception("No active account")

/** Edit account: the username already belongs to someone else (409). */
class UserNameTakenException : Exception("Username already in use")
