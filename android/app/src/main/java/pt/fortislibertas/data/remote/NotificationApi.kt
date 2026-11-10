package pt.fortislibertas.data.remote

import pt.fortislibertas.data.remote.dto.ItemResponseDto
import pt.fortislibertas.data.remote.dto.ListResponseDto
import pt.fortislibertas.data.remote.dto.NotificationDto
import pt.fortislibertas.data.remote.dto.NotificationReadRequestDto
import pt.fortislibertas.data.remote.dto.UnreadCountDto
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/** Notifications of the signed-in user (endpoints.md §4). */
interface NotificationApi {

    @GET("api/v1/me/notifications")
    suspend fun getNotifications(@Query("per_page") perPage: Int = 50): ListResponseDto<NotificationDto>

    @GET("api/v1/me/notifications/unread-count")
    suspend fun getUnreadCount(): ItemResponseDto<UnreadCountDto>

    @PATCH("api/v1/me/notifications/{notification_id}")
    suspend fun setRead(@Path("notification_id") id: String, @Body body: NotificationReadRequestDto)

    @POST("api/v1/me/notifications/read-all")
    suspend fun markAllRead()

    @DELETE("api/v1/me/notifications/{notification_id}")
    suspend fun delete(@Path("notification_id") id: String)
}
