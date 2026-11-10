package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.FilterOptions
import pt.fortislibertas.data.model.TransactionDetail
import pt.fortislibertas.data.model.TransactionFilter
import pt.fortislibertas.data.model.TransactionItem

interface TransactionRepository {
    /** Transactions that match the filter, newest first. */
    suspend fun getTransactions(filter: TransactionFilter): List<TransactionItem>
    suspend fun getFilterOptions(): FilterOptions

    /** Full data of one record. [summary] is the list item that was tapped. */
    suspend fun getDetail(summary: TransactionItem): TransactionDetail

    /** Soft-deletes the record (it disappears from the lists). */
    suspend fun delete(recordId: String)
}