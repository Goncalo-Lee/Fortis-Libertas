package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.UserProfile

/**
 * O que o ecrã Profile precisa. O ViewModel só conhece esta interface,
 * por isso não sabe se os dados são locais (Fake) ou da API (Remote).
 */
interface ProfileRepository {
    suspend fun getProfile(): UserProfile
    suspend fun deactivateAccount()
    suspend fun deleteAccount()
    suspend fun signOut()
}

/** Erros que a UI sabe mostrar. */
class SessionExpiredException : Exception("Session expired")
class NetworkException(cause: Throwable) : Exception("Network error", cause)
class NotSignedInException : Exception("No active account")
