package pt.fortislibertas.ui.navigation

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.ui.graphics.Color
import androidx.navigation.NavDestination
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavDestination.Companion.hierarchy
import kotlinx.serialization.Serializable
import pt.fortislibertas.R

@Serializable data object HomeRoute
@Serializable data object DashboardRoute
@Serializable data object NewRecordRoute
@Serializable data object TransactionsRoute
@Serializable data object ProfileRoute

enum class TopLevelDestination(
    val route: Any,
    @DrawableRes val baseIcon: Int,
    @DrawableRes val accentIcon: Int?,   // null = ícone de uma só cor
    val accentColor: Color,
    @StringRes val labelRes: Int,
) {
    HOME(HomeRoute, R.drawable.ic_nav_home_base, R.drawable.ic_nav_home_accent,
        Color(0xFF3B82F6), R.string.nav_home),
    DASHBOARD(DashboardRoute, R.drawable.ic_nav_dashboard_base, R.drawable.ic_nav_dashboard_accent,
        Color(0xFF7C3AED), R.string.nav_dashboard),
    NEW_RECORD(NewRecordRoute, R.drawable.ic_nav_new_record_base, R.drawable.ic_nav_new_record_accent,
        Color(0xFF16A34A), R.string.nav_new_record),
    TRANSACTIONS(TransactionsRoute, R.drawable.ic_nav_transactions_base, R.drawable.ic_nav_transactions_accent,
        Color(0xFFF97316), R.string.nav_transactions),
    PROFILE(ProfileRoute, R.drawable.ic_nav_profile_base, R.drawable.ic_nav_profile_accent,
        Color(0xFF06B6D4), R.string.nav_profile),
}

fun NavDestination?.isOn(destination: TopLevelDestination): Boolean =
    this?.hierarchy?.any { it.hasRoute(destination.route::class) } == true