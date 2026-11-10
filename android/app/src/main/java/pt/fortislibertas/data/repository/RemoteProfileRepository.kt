package pt.fortislibertas.data.repository

import java.io.IOException
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import pt.fortislibertas.data.model.AccountDetails
import pt.fortislibertas.data.model.AppLanguage
import pt.fortislibertas.data.model.UserProfile
import pt.fortislibertas.data.remote.FortisApi
import retrofit2.HttpException

/** API mode: talks to Next.js using the active account's Bearer token. */
class RemoteProfileRepository(
    private val api: FortisApi,
) : ProfileRepository {

    override suspend fun getProfile(): UserProfile = call { api.getMe().toModel() }

    override suspend fun deactivateAccount() = call { api.deactivateMe() }

    override suspend fun deleteAccount() = call { api.deleteMe() }

    override suspend fun updateLanguage(language: AppLanguage) =
        call { api.updateMyProfile(buildJsonObject { put("language", language.tag) }) }

    override suspend fun getAccountDetails(): AccountDetails = call { api.getMeDetails().data.toAccountDetails() }

    override suspend fun updateAccount(original: AccountDetails, edited: AccountDetails) {
        // User fields (PATCH /me)
        val user = buildJsonObject {
            if (edited.fullName != original.fullName) put("full_name", edited.fullName)
            if (edited.userName != original.userName) put("user_name", edited.userName)
        }
        // Profile fields (PATCH /me/profile)
        val profile = buildJsonObject {
            if (edited.phone != original.phone) put("phone", edited.phone)
            if (edited.birthDate != original.birthDate) put("birth_date", edited.birthDate?.toString())
            if (edited.currency != original.currency) put("currency", edited.currency)
            if (edited.primaryBankAccountId != original.primaryBankAccountId) {
                put("primary_bank_account_id", edited.primaryBankAccountId)
            }
        }
        try {
            if (user.isNotEmpty()) call { api.updateMe(user) }
        } catch (e: HttpException) {
            if (e.code() == 409) throw UserNameTakenException() else throw e
        }
        if (profile.isNotEmpty()) call { api.updateMyProfile(profile) }
    }

    /** Signs out even without network: the token is deleted locally anyway. */
    override suspend fun signOut() {
        try {
            api.signOut()
        } catch (e: CancellationException) {
            throw e
        } catch (_: Exception) {
            // No network or session already expired: does not block the local sign out
        }
    }

    /** Turns Retrofit/OkHttp errors into the errors the UI knows. */
    private suspend fun <T> call(block: suspend () -> T): T =
        try {
            block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}
