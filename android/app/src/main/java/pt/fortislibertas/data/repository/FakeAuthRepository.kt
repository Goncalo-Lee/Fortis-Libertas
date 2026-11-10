package pt.fortislibertas.data.repository

import kotlinx.coroutines.delay
import pt.fortislibertas.data.fake.FakeAccountData
import pt.fortislibertas.data.model.SavedAccount
import java.util.UUID

/**
 * Local mode: any password works for the FakeAccountData emails.
 * Sign up creates a new local account (with no real data behind it).
 */
class FakeAuthRepository : AuthRepository {

    override suspend fun signIn(email: String, password: String, remember: Boolean): SavedAccount {
        delay(600)
        val account = FakeAccountData.accounts.firstOrNull { it.email.equals(email.trim(), ignoreCase = true) }
            ?: throw InvalidCredentialsException()
        return account.copy(remember = remember)
    }

    override suspend fun signUp(name: String, email: String, password: String, remember: Boolean): SavedAccount {
        delay(600)
        if (FakeAccountData.accounts.any { it.email.equals(email.trim(), ignoreCase = true) }) {
            throw EmailTakenException()
        }
        val id = UUID.randomUUID().toString()
        return SavedAccount(
            id = id,
            fullName = name.trim(),
            email = email.trim(),
            token = "fake-token-$id",
            remember = remember,
        )
    }

    /** Local mode: "wrongpass" plays the wrong current password, anything else works. */
    override suspend fun changePassword(currentPassword: String, newPassword: String, revokeOtherSessions: Boolean) {
        delay(600)
        if (currentPassword == "wrongpass") throw WrongPasswordException()
    }
}
