package pt.atec.goncalo.fortislibertas_appandroid.data.repository

import pt.atec.goncalo.fortislibertas_appandroid.data.local.FakeData
import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord

class FakeFinanceRepository : FinanceRepository {

    private val records = FakeData.records.toMutableList()

    override suspend fun getRecords(): List<FinancialRecord> = records.toList()

    override suspend fun getCategories(): List<Category> = FakeData.categories

    override suspend fun createRecord(record: FinancialRecord): Result<Unit> {
        records.add(record)
        return Result.success(Unit)
    }

    override suspend fun updateRecord(record: FinancialRecord): Result<Unit> {
        val index = records.indexOfFirst { it.id == record.id }
        if (index == -1) {
            return Result.failure(NoSuchElementException("Registo ${record.id} nao existe"))
        }
        records[index] = record
        return Result.success(Unit)
    }

    override suspend fun deleteRecord(id: Long): Result<Unit> {
        records.removeAll { it.id == id }
        return Result.success(Unit)
    }
}
