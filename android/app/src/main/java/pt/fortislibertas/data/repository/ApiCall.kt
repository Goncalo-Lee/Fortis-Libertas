package pt.fortislibertas.data.repository

import java.io.IOException
import retrofit2.HttpException

/** Turns Retrofit/OkHttp errors into the errors the UI knows (401 → session expired, no network). */
internal suspend fun <T> apiCall(block: suspend () -> T): T =
    try {
        block()
    } catch (e: HttpException) {
        if (e.code() == 401) throw SessionExpiredException() else throw e
    } catch (e: IOException) {
        throw NetworkException(e)
    }

/** The account has no dashboard yet: the screens show the "create your first dashboard" state. */
class NoDashboardException : Exception("The account has no dashboard")

/** The active dashboard (AppContainer picks the first one when none was chosen). */
internal suspend fun requireDashboard(activeDashboardId: suspend () -> String?): String =
    activeDashboardId() ?: throw NoDashboardException()
