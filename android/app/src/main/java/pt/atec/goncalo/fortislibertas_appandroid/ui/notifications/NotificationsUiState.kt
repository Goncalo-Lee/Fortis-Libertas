package pt.atec.goncalo.fortislibertas_appandroid.ui.notifications

sealed interface NotificationsUiState {
    data object Loading : NotificationsUiState
    data class Success(val items: List<String> = emptyList()) : NotificationsUiState
    data class Error(val message: String) : NotificationsUiState
}
