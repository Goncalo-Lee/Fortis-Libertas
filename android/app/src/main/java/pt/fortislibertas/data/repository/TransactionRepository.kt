package pt.fortislibertas.data.repository

import pt.fortislibertas.data.model.FilterOptions
import pt.fortislibertas.data.model.TransactionFilter
import pt.fortislibertas.data.model.TransactionItem

interface TransactionRepository {
    /** Transactions that match the filter, newest first. */
    suspend fun getTransactions(filter: TransactionFilter): List<TransactionItem>
    suspend fun getFilterOptions(): FilterOptions
}