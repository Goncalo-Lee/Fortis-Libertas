package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.Category
import pt.fortislibertas.data.model.InstalmentPlanOption
import pt.fortislibertas.data.model.NewFinancialRecord
import pt.fortislibertas.data.model.NewInstalmentPlan
import pt.fortislibertas.data.model.RecordFormOptions
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.Tag

/** O que o ecrã Register precisa. Implementado em Fake (local) e Remote (API). */
interface RecordRepository {
    suspend fun getFormOptions(): RecordFormOptions
    suspend fun createRecord(record: NewFinancialRecord)
    suspend fun createInstalmentPlan(plan: NewInstalmentPlan): InstalmentPlanOption
    suspend fun createTag(name: String, categoryId: String?): Tag
    suspend fun createCategory(name: String, type: RecordType, colorKey: String): Category
}