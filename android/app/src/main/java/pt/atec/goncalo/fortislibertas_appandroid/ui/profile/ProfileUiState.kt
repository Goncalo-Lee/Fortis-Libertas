package pt.atec.goncalo.fortislibertas_appandroid.ui.profile

sealed interface ProfileUiState {
    data object Loading : ProfileUiState
    data class Success(val items: List<String> = emptyList()) : ProfileUiState
    data class Error(val message: String) : ProfileUiState
}
