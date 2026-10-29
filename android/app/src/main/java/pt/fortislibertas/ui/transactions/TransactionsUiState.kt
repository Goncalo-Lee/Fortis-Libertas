package pt.fortislibertas.ui.transactions

import androidx.annotation.StringRes
import pt.fortislibertas.data.model.FilterOptions
import pt.fortislibertas.data.model.TransactionFilter
import pt.fortislibertas.data.model.TransactionItem

data class TransactionsUiState(
    val filter: TransactionFilter = TransactionFilter(),
    val items: List<TransactionItem> = emptyList(),
    val isLoading: Boolean = true,
    val hasLoaded: Boolean = false,          // já houve pelo menos um resultado
    @StringRes val errorMessage: Int? = null,
    val options: FilterOptions? = null,
    val showFilter: Boolean = false,
    val userName: String? = null,
    val avatarUrl: String? = null,
)
