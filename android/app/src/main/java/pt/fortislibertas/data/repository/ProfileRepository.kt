package pt.fortislibertas.data.repository

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
}

/** Errors the UI knows how to show. */
class SessionExpiredException : Exception("Session expired")
class NetworkException(cause: Throwable) : Exception("Network error", cause)
class NotSignedInException : Exception("No active account")
