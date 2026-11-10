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

/** The active dashboard, or an error when none was chosen yet (the Dashboard tab picks one). */
internal suspend fun requireDashboard(activeDashboardId: suspend () -> String?): String =
    activeDashboardId() ?: throw IllegalStateException("No active dashboard yet")
