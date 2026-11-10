package pt.fortislibertas.ui.transactiondetail

import androidx.annotation.StringRes
import pt.fortislibertas.data.model.TransactionDetail
import pt.fortislibertas.data.model.TransactionItem

/**
 * Details dialog of one transaction. [summary] (the tapped list item) shows straight away;
 * [detail] fills in the rest when it arrives.
 */
data class TransactionDetailUiState(
    val summary: TransactionItem,
    val detail: TransactionDetail? = null,
    val isLoading: Boolean = true,
    @StringRes val loadError: Int? = null,
    val confirmDelete: Boolean = false,
    val isDeleting: Boolean = false,
    @StringRes val deleteError: Int? = null,
)

/** Things that happen only once. */
sealed interface TransactionDetailEvent {
    data object Deleted : TransactionDetailEvent
}
