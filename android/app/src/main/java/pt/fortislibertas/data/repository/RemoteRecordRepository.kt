package pt.fortislibertas.data.repository

import java.time.LocalTime
import java.time.ZoneId
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.ColorOption
import pt.fortislibertas.data.model.InstalmentPlanOption
import pt.fortislibertas.data.model.NewFinancialRecord
import pt.fortislibertas.data.model.NewInstalmentPlan
import pt.fortislibertas.data.model.PaymentMethod
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.Tag
import pt.fortislibertas.data.remote.FinanceApi
import pt.fortislibertas.data.remote.loadLookup
import pt.fortislibertas.data.remote.dto.CreateCategoryDto
import pt.fortislibertas.data.remote.dto.CreateFinancialRecordDto
import pt.fortislibertas.data.remote.dto.CreateInstallmentPlanDto
import pt.fortislibertas.data.remote.dto.CreatePaymentMethodRequestDto
import pt.fortislibertas.data.remote.dto.CreateTagDto

/** API mode: everything under /api/v1/dashboards/{active dashboard}/... */
class RemoteRecordRepository(
    private val api: FinanceApi,
    /** Active dashboard (from DashboardStore); null until one is chosen. */
    private val activeDashboardId: suspend () -> String?,
) : RecordRepository {

    /** The lists of the form, all in parallel. */
    override suspend fun getFormOptions(): RecordFormOptions = apiCall {
        val dashboardId = requireDashboard(activeDashboardId)
        coroutineScope {
            val lookup = async { api.loadLookup(dashboardId) }
            val tags = async { api.getTags(dashboardId).data }
            val methods = async { api.getPaymentMethods(dashboardId).data }
            val plans = async { api.getInstallmentPlans(dashboardId).data }
            val colors = async { api.getColors(dashboardId).data }
            val currencies = async { api.getCurrencies().data }
            val types = lookup.await()
            RecordFormOptions(
                categories = types.categories.map { types.toCategory(it) },
                tags = tags.await().map { it.toModel() },
                paymentMethods = methods.await().map { it.toModel() },
                instalmentPlans = plans.await().map { InstalmentPlanOption(it.id, it.name) },
                // A colour can only be used by one category, and the 2 reserved ones by none
                colors = colors.await().filter { !it.isReserved && !it.inUse }.map { ColorOption(it.id, it.codeColor) },
                currencies = currencies.await().map { it.code }.ifEmpty { listOf("EUR") },
            )
        }
    }

    override suspend fun createRecord(record: NewFinancialRecord) = apiCall {
        val dashboardId = requireDashboard(activeDashboardId)
        val paymentMethodId = record.paymentMethodId
            ?: throw IllegalArgumentException("The API needs a payment method")
        val inPlan = record.instalmentPlanId != null
        // In a plan the record inherits the plan's type and category, so they are not sent
        val recordTypeId = if (inPlan) null else {
            api.loadLookup(dashboardId).recordTypeIdFor(record.categoryId, record.type)
                ?: throw IllegalStateException("No record type for ${record.type}")
        }
        api.createRecord(
            dashboardId,
            CreateFinancialRecordDto(
                recordTypeId = recordTypeId,
                categoryId = if (inPlan) null else record.categoryId,
                paymentMethodId = paymentMethodId,
                installmentPlanId = record.instalmentPlanId,
                name = record.name,
                description = record.description,
                price = record.price.toPlainString(),
                currency = record.currency,
                // Midday local time: the date stays the same in any time zone
                paymentDate = record.paymentDate.atTime(LocalTime.NOON).atZone(ZoneId.systemDefault()).toInstant().toString(),
                status = record.status.name.lowercase(),
                tagIds = record.tagIds.toList(),
            ),
        )
    }

    /** The API keeps the final due date of the plan: first due date + (instalments − 1) months. */
    override suspend fun createInstalmentPlan(plan: NewInstalmentPlan): InstalmentPlanOption = apiCall {
        val created = api.createInstallmentPlan(
            requireDashboard(activeDashboardId),
            CreateInstallmentPlanDto(
                name = plan.name,
                description = plan.description,
                categoryId = plan.categoryId,
                currency = plan.currency,
                tagIds = plan.tagIds.toList(),
                totalAmount = plan.totalAmount.toPlainString(),
                totalInstallments = plan.totalInstalments,
                dueDate = plan.firstDueDate.plusMonths((plan.totalInstalments - 1).toLong()).toString(),
            ),
        ).data
        InstalmentPlanOption(created.id, created.name)
    }

    /** Creates the tag and, when a category is chosen, links it to that category. */
    override suspend fun createTag(name: String, categoryId: String?): Tag = apiCall {
        val dashboardId = requireDashboard(activeDashboardId)
        val tag = api.createTag(dashboardId, CreateTagDto(name.trim())).data
        if (categoryId != null) api.linkTagToCategory(dashboardId, categoryId, tag.id)
        Tag(id = tag.id, name = tag.name, categoryIds = setOfNotNull(categoryId))
    }

    /** [colorKey] is the color_id. The icon is not chosen in the app: "category" or the first one. */
    override suspend fun createCategory(name: String, type: RecordType, colorKey: String): Category = apiCall {
        val dashboardId = requireDashboard(activeDashboardId)
        val lookup = api.loadLookup(dashboardId)
        val recordTypeId = lookup.mainRecordTypeId(type) ?: throw IllegalStateException("No record type for $type")
        val icon = api.getIcons("category").data.firstOrNull() ?: api.getIcons().data.first()
        val created = api.createCategory(
            dashboardId,
            CreateCategoryDto(name = name.trim(), recordTypeIds = listOf(recordTypeId), colorId = colorKey, iconId = icon.id),
        ).data
        lookup.toCategory(created)
    }

    override suspend fun createPaymentMethod(name: String, cardId: String?): PaymentMethod = apiCall {
        api.createPaymentMethod(requireDashboard(activeDashboardId), CreatePaymentMethodRequestDto(name.trim(), cardId))
            .data.toModel()
    }
}
