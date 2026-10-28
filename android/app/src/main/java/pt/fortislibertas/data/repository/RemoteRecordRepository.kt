package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.InstalmentPlanOption
import pt.fortislibertas.data.model.NewFinancialRecord
import pt.fortislibertas.data.model.NewInstalmentPlan
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.Tag
import pt.fortislibertas.data.remote.RecordApi
import pt.fortislibertas.data.remote.dto.CreateCategoryRequest
import pt.fortislibertas.data.remote.dto.CreateInstalmentPlanRequest
import pt.fortislibertas.data.remote.dto.CreateRecordRequest
import pt.fortislibertas.data.remote.dto.CreateTagRequest
import retrofit2.HttpException
import java.io.IOException

/** Modo API: envia os formulários para o Next.js com o token Bearer. */
class RemoteRecordRepository(
    private val api: RecordApi,
) : RecordRepository {

    override suspend fun getFormOptions(): RecordFormOptions =
        call { api.getFormOptions().toModel() }

    override suspend fun createRecord(record: NewFinancialRecord) = call {
        api.createRecord(
            CreateRecordRequest(
                name = record.name,
                description = record.description,
                type = record.type.name.lowercase(),
                price = record.price.toPlainString(),
                currency = record.currency,
                paymentMethodId = record.paymentMethodId,
                paymentDate = record.paymentDate.toString(),   // ISO: 2026-10-27
                status = record.status.name.lowercase(),
                categoryId = record.categoryId,
                tagIds = record.tagIds.toList(),
                instalmentPlanId = record.instalmentPlanId,
            ),
        )
    }

    override suspend fun createInstalmentPlan(plan: NewInstalmentPlan): InstalmentPlanOption = call {
        val dto = api.createInstalmentPlan(
            CreateInstalmentPlanRequest(
                name = plan.name,
                description = plan.description,
                totalAmount = plan.totalAmount.toPlainString(),
                currency = plan.currency,
                totalInstalments = plan.totalInstalments,
                firstDueDate = plan.firstDueDate.toString(),
                paymentMethodId = plan.paymentMethodId,
                categoryId = plan.categoryId,
                tagIds = plan.tagIds.toList(),
            ),
        )
        InstalmentPlanOption(dto.id, dto.name)
    }

    override suspend fun createTag(name: String, categoryId: String?): Tag =
        call { api.createTag(CreateTagRequest(name, categoryId)).toModel() }

    override suspend fun createCategory(name: String, type: RecordType, colorKey: String): Category =
        call { api.createCategory(CreateCategoryRequest(name, type.name.lowercase(), colorKey)).toModel() }

    private suspend fun <T> call(block: suspend () -> T): T =
        try {
            block()
        } catch (e: HttpException) {
            if (e.code() == 401) throw SessionExpiredException() else throw e
        } catch (e: IOException) {
            throw NetworkException(e)
        }
}