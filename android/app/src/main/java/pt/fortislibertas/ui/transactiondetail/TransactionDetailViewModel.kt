package pt.fortislibertas.ui.transactiondetail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.data.model.TransactionItem
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.SessionExpiredException
import pt.fortislibertas.data.repository.TransactionRepository

/** Loads the full record and deletes it (option B: details are read only, with delete). */
class TransactionDetailViewModel(
    private val repository: TransactionRepository,
    summary: TransactionItem,
) : ViewModel() {

    private val _state = MutableStateFlow(TransactionDetailUiState(summary = summary))
    val state: StateFlow<TransactionDetailUiState> = _state.asStateFlow()

    private val _events = Channel<TransactionDetailEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        viewModelScope.launch {
            try {
                val detail = repository.getDetail(summary)
                _state.update { it.copy(detail = detail, isLoading = false) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // The summary is still shown; only the extra fields are missing
                _state.update { it.copy(isLoading = false, loadError = R.string.detail_load_error) }
            }
        }
    }

    fun requestDelete() = _state.update { it.copy(confirmDelete = true, deleteError = null) }

    fun cancelDelete() {
        if (_state.value.isDeleting) return
        _state.update { it.copy(confirmDelete = false) }
    }

    fun confirmDelete() {
        if (_state.value.isDeleting) return
        viewModelScope.launch {
            _state.update { it.copy(isDeleting = true) }
            try {
                repository.delete(_state.value.summary.id)
                _events.send(TransactionDetailEvent.Deleted)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                val message = when (e) {
                    is SessionExpiredException -> R.string.error_session_expired
                    is NetworkException -> R.string.error_network
                    else -> R.string.error_generic
                }
                _state.update { it.copy(deleteError = message) }
            } finally {
                _state.update { it.copy(isDeleting = false, confirmDelete = false) }
            }
        }
    }

    companion object {
        fun factory(summary: TransactionItem): ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as FortisApplication
                TransactionDetailViewModel(app.container.transactionRepository, summary)
            }
        }
    }
}
