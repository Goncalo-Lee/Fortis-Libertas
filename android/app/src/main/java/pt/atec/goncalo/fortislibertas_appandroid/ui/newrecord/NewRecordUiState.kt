package pt.atec.goncalo.fortislibertas_appandroid.ui.newrecord

sealed interface NewRecordUiState {
    data object Loading : NewRecordUiState
    data class Success(val items: List<String> = emptyList()) : NewRecordUiState
    data class Error(val message: String) : NewRecordUiState
}
