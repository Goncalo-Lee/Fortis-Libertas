package pt.fortislibertas.data.repository

import java.util.UUID
import kotlinx.coroutines.delay
import pt.fortislibertas.data.fake.FakeRecordData
import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.InstalmentPlanOption
import pt.fortislibertas.data.model.NewFinancialRecord
import pt.fortislibertas.data.model.NewInstalmentPlan
import pt.fortislibertas.data.model.PaymentMethod
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.Tag

/**
 * Local mode: keeps everything in memory while the app is open.
 * When the app closes, it goes back to the FakeRecordData data.
 */
class FakeRecordRepository : RecordRepository {

    private var options: RecordFormOptions = FakeRecordData.options()
    private val savedRecords = mutableListOf<NewFinancialRecord>()

    override suspend fun getFormOptions(): RecordFormOptions {
        delay(300)
        return options
    }

    override suspend fun createRecord(record: NewFinancialRecord) {
        delay(500)
        savedRecords += record
    }

    override suspend fun createInstalmentPlan(plan: NewInstalmentPlan): InstalmentPlanOption {
        delay(500)
        val created = InstalmentPlanOption(
            id = UUID.randomUUID().toString(),
            name = "${plan.name} (${plan.totalInstalments}x)",
        )
        options = options.copy(instalmentPlans = options.instalmentPlans + created)
        return created
    }

    override suspend fun createTag(name: String, categoryId: String?): Tag {
        delay(250)
        val created = Tag(
            id = UUID.randomUUID().toString(),
            name = name,
            categoryIds = setOfNotNull(categoryId),
        )
        options = options.copy(tags = options.tags + created)
        return created
    }

    override suspend fun createCategory(name: String, type: RecordType, colorKey: String): Category {
        delay(250)
        val hex = options.colors.firstOrNull { it.key == colorKey }?.hex ?: "#94A3B8"
        val created = Category(
            id = UUID.randomUUID().toString(),
            name = name,
            type = type,
            colorHex = hex,
        )
        options = options.copy(categories = options.categories + created)
        return created
    }

    override suspend fun createPaymentMethod(name: String, cardId: String?): PaymentMethod {
        delay(250)
        val created = PaymentMethod(id = UUID.randomUUID().toString(), name = name)
        options = options.copy(paymentMethods = options.paymentMethods + created)
        return created
    }
}
