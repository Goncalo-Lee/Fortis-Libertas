package pt.fortislibertas.data.remote.dto

import java.time.OffsetDateTime
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import pt.fortislibertas.data.model.AppNotification

/** JSON of a notification (endpoints.md §4.2). "data" is free-form, so it stays a JsonObject. */
@Serializable
data class NotificationDto(
    @SerialName("notification_id") val id: String,
    val type: String,
    val data: JsonObject = JsonObject(emptyMap()),
    @SerialName("created_at") val createdAt: String,
    @SerialName("read_at") val readAt: String? = null,
) {
    private fun field(name: String): String? = data[name]?.jsonPrimitive?.contentOrNull

    fun toModel() = AppNotification(
        id = id,
        type = type,
        dashboardId = field("dashboard_id"),
        bankAccountId = field("bank_account_id"),
        role = field("role"),
        // OffsetDateTime accepts both "...Z" and "...+00:00"
        createdAt = OffsetDateTime.parse(createdAt).toInstant(),
        readAt = readAt?.let { OffsetDateTime.parse(it).toInstant() },
    )
}

@Serializable
data class UnreadCountDto(val unread: Int)

@Serializable
data class NotificationReadRequestDto(val read: Boolean)
