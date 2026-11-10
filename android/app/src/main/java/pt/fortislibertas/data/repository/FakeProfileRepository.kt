package pt.fortislibertas.data.repository

import java.math.BigDecimal
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import pt.fortislibertas.data.fake.FakeAccountData
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.model.AccountDetails
import pt.fortislibertas.data.model.AppLanguage
import pt.fortislibertas.data.model.UserProfile

/**
 * Local mode: returns the data from FakeAccountData with a small delay,
 * so you can see the loading state as if it were the API.
 */
class FakeProfileRepository(
    private val accountStore: AccountStore,
) : ProfileRepository {

    /** Changes made in Edit account (only while the app is open). */
    private val edited = mutableMapOf<String, AccountDetails>()

    override suspend fun getProfile(): UserProfile {
        delay(400)
        val activeId = accountStore.activeAccountId.first() ?: throw NotSignedInException()
        val profile = FakeAccountData.profiles[activeId] ?: newAccountProfile(activeId)
        return edited[activeId]?.let { profile.copy(fullName = it.fullName, userName = it.userName) } ?: profile
    }

    override suspend fun getAccountDetails(): AccountDetails {
        val activeId = accountStore.activeAccountId.first() ?: throw NotSignedInException()
        edited[activeId]?.let { delay(300); return it }
        val profile = getProfile()
        return AccountDetails(
            fullName = profile.fullName,
            userName = profile.userName,
            email = profile.email,
            imageUrl = profile.imageUrl,
            phone = null,
            birthDate = null,
            currency = profile.currency,
            primaryBankAccountId = null,
        )
    }

    /** Local mode: the username "taken" plays one that already exists. */
    override suspend fun updateAccount(original: AccountDetails, edited: AccountDetails) {
        delay(600)
        if (edited.userName == "taken") throw UserNameTakenException()
        val activeId = accountStore.activeAccountId.first() ?: throw NotSignedInException()
        this.edited[activeId] = edited
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

    override suspend fun updateLanguage(language: AppLanguage) = delay(200)
}
