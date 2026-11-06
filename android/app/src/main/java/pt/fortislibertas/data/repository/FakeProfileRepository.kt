package pt.fortislibertas.data.repository

import java.math.BigDecimal
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import pt.fortislibertas.data.fake.FakeAccountData
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.model.UserProfile

/**
 * Local mode: returns the data from FakeAccountData with a small delay,
 * so you can see the loading state as if it were the API.
 */
class FakeProfileRepository(
    private val accountStore: AccountStore,
) : ProfileRepository {

    override suspend fun getProfile(): UserProfile {
        delay(400)
        val activeId = accountStore.activeAccountId.first() ?: throw NotSignedInException()
        return FakeAccountData.profiles[activeId] ?: newAccountProfile(activeId)
    }

    /** Accounts created with the fake sign up have no test profile: build an empty one. */
    private suspend fun newAccountProfile(id: String): UserProfile {
        val account = accountStore.accounts.first().firstOrNull { it.id == id } ?: throw NotSignedInException()
        return UserProfile(
            id = account.id,
            fullName = account.fullName,
            userName = null,
            email = account.email,
            imageUrl = account.imageUrl,
            accountBalance = BigDecimal.ZERO,
            amountSaved = BigDecimal.ZERO,
        )
    }

    override suspend fun deactivateAccount() = delay(600)

    override suspend fun deleteAccount() = delay(600)

    override suspend fun signOut() = delay(200)
}
