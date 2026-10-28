package pt.fortislibertas.ui.home

import androidx.annotation.StringRes
import pt.fortislibertas.data.model.HomeSummary

data class HomeUiState(
    val isLoading: Boolean = true,
    val summary: HomeSummary? = null,
    @StringRes val errorMessage: Int? = null,
    val isSignedIn: Boolean = true,
    val userName: String? = null,
    val avatarUrl: String? = null,
)
