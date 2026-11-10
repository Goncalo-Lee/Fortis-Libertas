package pt.fortislibertas.data.model

import java.time.Instant

/**
 * One notification (endpoints.md §4). The API only has 2 types today; the fields of
 * "data" that the app uses are read into [dashboardId], [bankAccountId] and [role].
 */
data class AppNotification(
    val id: String,
    val type: String,
    val dashboardId: String? = null,
    val bankAccountId: String? = null,
    val role: String? = null,               // owner, editor or viewer
    val createdAt: Instant,
    val readAt: Instant? = null,
) {
    val isRead: Boolean get() = readAt != null

    companion object {
        const val TYPE_DASHBOARD_MEMBER_ADDED = "dashboard.member_added"
        const val TYPE_BANK_MEMBER_ADDED = "bank_account.member_added"
    }
}
