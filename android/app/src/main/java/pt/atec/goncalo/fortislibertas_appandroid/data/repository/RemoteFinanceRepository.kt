package pt.atec.goncalo.fortislibertas_appandroid.data.repository

import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.FortisApi
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto.toDomain
import pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto.toDto

class RemoteFinanceRepository(
    private val api: FortisApi
) : FinanceRepository {

    override suspend fun getRecords(): List<FinancialRecord> =
        api.getRecords().map { it.toDomain() }

    override suspend fun getCategories(): List<Category> =
        api.getCategories().map { it.toDomain() }

    override suspend fun createRecord(record: FinancialRecord): Result<Unit> =
        runCatching { api.createRecord(record.toDto()); Unit }

    override suspend fun updateRecord(record: FinancialRecord): Result<Unit> =
        runCatching { api.updateRecord(record.id, record.toDto()); Unit }

    override suspend fun deleteRecord(id: Long): Result<Unit> =
        runCatching { api.deleteRecord(id) }
}
