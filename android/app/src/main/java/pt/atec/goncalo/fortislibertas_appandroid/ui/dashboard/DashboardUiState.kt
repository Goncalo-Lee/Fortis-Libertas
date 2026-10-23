package pt.atec.goncalo.fortislibertas_appandroid.ui.dashboard

sealed interface DashboardUiState {
    data object Loading : DashboardUiState
    data class Success(val items: List<String> = emptyList()) : DashboardUiState
    data class Error(val message: String) : DashboardUiState
}
