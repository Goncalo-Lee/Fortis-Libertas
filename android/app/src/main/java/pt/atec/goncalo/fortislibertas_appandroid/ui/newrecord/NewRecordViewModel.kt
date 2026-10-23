package pt.atec.goncalo.fortislibertas_appandroid.ui.newrecord

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class NewRecordViewModel : ViewModel() {

    private val _uiState = MutableStateFlow<NewRecordUiState>(NewRecordUiState.Loading)
    val uiState: StateFlow<NewRecordUiState> = _uiState.asStateFlow()

    // TODO: ligar ao FinanceRepository
}
