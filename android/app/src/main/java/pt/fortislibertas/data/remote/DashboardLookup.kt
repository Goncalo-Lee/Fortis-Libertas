package pt.fortislibertas.data.remote

import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.data.remote.dto.CategoryApiDto
import pt.fortislibertas.data.remote.dto.FinancialRecordDto
import pt.fortislibertas.data.remote.dto.RecordTypeDto

/** Grey for a category without a colour (should not happen: the API always sends one). */
private const val DEFAULT_CATEGORY_COLOR = "#9CA3AF"

/**
 * The app has 3 fixed types (EXPENSE, INCOME, INVESTMENT); the API has record types per dashboard
 * with a kind. income → INCOME, expense → EXPENSE, neutral → INVESTMENT.
 */
val RecordTypeDto.appType: RecordType
    get() = when (kind) {
        "income" -> RecordType.INCOME
        "expense" -> RecordType.EXPENSE
        else -> RecordType.INVESTMENT
    }

/**
 * Record types and categories of one dashboard. Records only carry ids, so this turns them
 * into what the screens show (category name and colour, the app's RecordType).
 */
class DashboardLookup(
    val recordTypes: List<RecordTypeDto>,
    val categories: List<CategoryApiDto>,
) {
    private val typesById = recordTypes.associateBy { it.id.lowercase() }
    private val categoriesById = categories.associateBy { it.id.lowercase() }

    fun type(recordTypeId: String): RecordType = typesById[recordTypeId.lowercase()]?.appType ?: RecordType.EXPENSE

    /** Every record type of the dashboard that the app shows as [type] (for the type filter). */
    fun recordTypeIds(type: RecordType): List<String> = recordTypes.filter { it.appType == type }.map { it.id }

    /** The main record type of [type]: the seeded Income / Expenses (reserved colour) come first. */
    fun mainRecordTypeId(type: RecordType): String? =
        recordTypes.filter { it.appType == type }.maxByOrNull { if (it.color?.isReserved == true) 1 else 0 }?.id

    /** Record type for a new record: one of the category's types that matches [type]. */
    fun recordTypeIdFor(categoryId: String, type: RecordType): String? {
        val linked = categoriesById[categoryId.lowercase()]?.recordTypes.orEmpty()
            .mapNotNull { typesById[it.id.lowercase()] }
            .filter { it.appType == type }
        return linked.maxByOrNull { if (it.color?.isReserved == true) 1 else 0 }?.id ?: mainRecordTypeId(type)
    }

    /** The app's Category: the type is the one of its first record type. */
    fun toCategory(dto: CategoryApiDto) = Category(
        id = dto.id,
        name = dto.name,
        type = dto.recordTypes.firstOrNull()?.let { type(it.id) } ?: RecordType.EXPENSE,
        colorHex = dto.color?.codeColor ?: DEFAULT_CATEGORY_COLOR,
    )

    fun toItem(record: FinancialRecordDto): TransactionItem {
        val category = categoriesById[record.categoryId.lowercase()]
        return TransactionItem(
            id = record.id,
            name = record.name,
            categoryName = category?.name.orEmpty(),
            categoryColorHex = category?.color?.codeColor ?: DEFAULT_CATEGORY_COLOR,
            type = type(record.recordTypeId),
            amount = record.price.toBigDecimalOrNull() ?: java.math.BigDecimal.ZERO,
            currency = record.currency,
            date = record.localDate(),
        )
    }
}

/** Loads the record types and categories of the dashboard in parallel. */
suspend fun FinanceApi.loadLookup(dashboardId: String): DashboardLookup = coroutineScope {
    val types = async { getRecordTypes(dashboardId).data }
    val categories = async { getCategories(dashboardId).data }
    DashboardLookup(types.await(), categories.await())
}
