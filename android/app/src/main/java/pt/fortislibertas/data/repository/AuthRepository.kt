package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.SavedAccount

/**
 * What the Auth screen needs. Returns the account to save in AccountStore;
 * saving it is the ViewModel's job, so Fake and Remote behave the same.
 */
interface AuthRepository {
    suspend fun signIn(email: String, password: String, remember: Boolean): SavedAccount
    suspend fun signUp(name: String, email: String, password: String, remember: Boolean): SavedAccount

    /** Changes the password of the active account. [revokeOtherSessions] signs out the other devices. */
    suspend fun changePassword(currentPassword: String, newPassword: String, revokeOtherSessions: Boolean)
}

/** Wrong email or password. */
class InvalidCredentialsException : Exception("Invalid email or password")

/** Change password: the current password is not right. */
class WrongPasswordException : Exception("Wrong current password")

/** Sign up with an email that already has an account. */
class EmailTakenException : Exception("Email already in use")
