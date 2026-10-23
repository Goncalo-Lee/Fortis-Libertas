package pt.atec.goncalo.fortislibertas_appandroid.ui.transactions

sealed interface TransactionsUiState {
    data object Loading : TransactionsUiState
    data class Success(val items: List<String> = emptyList()) : TransactionsUiState
    data class Error(val message: String) : TransactionsUiState
}
