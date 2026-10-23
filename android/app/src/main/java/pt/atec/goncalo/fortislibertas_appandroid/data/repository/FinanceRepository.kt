package pt.atec.goncalo.fortislibertas_appandroid.data.repository

import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord

interface FinanceRepository {
    suspend fun getRecords(): List<FinancialRecord>
    suspend fun getCategories(): List<Category>
    suspend fun createRecord(record: FinancialRecord): Result<Unit>
    suspend fun updateRecord(record: FinancialRecord): Result<Unit>
    suspend fun deleteRecord(id: Long): Result<Unit>
}
