package pt.atec.goncalo.fortislibertas_appandroid.ui.home

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Success(val items: List<String> = emptyList()) : HomeUiState
    data class Error(val message: String) : HomeUiState
}
