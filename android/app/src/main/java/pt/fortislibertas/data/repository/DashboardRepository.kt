package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.CategoryTotal
import pt.fortislibertas.data.model.Dashboard
import pt.fortislibertas.data.model.RecordKind
import pt.fortislibertas.data.model.RecordTypeTotal
import java.time.LocalDate

/** What the Dashboard tab needs. Implemented as Fake (local) and Remote (API). */
interface DashboardRepository {

    suspend fun getDashboards(): List<Dashboard>

    /** Total of each record type between [from] and [to] (inclusive). */
    suspend fun getRecordTypeTotals(dashboardId: String, from: LocalDate, to: LocalDate): List<RecordTypeTotal>

    /**
     * Total of each category between [from] and [to], biggest first.
     * [kind]: only categories of that kind. ⚠️ The API cannot filter yet (see plano-api-cartoes),
     * so in API mode all categories come back.
     */
    suspend fun getCategoryTotals(dashboardId: String, from: LocalDate, to: LocalDate, kind: RecordKind): List<CategoryTotal>
}
