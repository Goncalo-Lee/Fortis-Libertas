package pt.fortislibertas.ui.navigation

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.navigation.NavDestination
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavDestination.Companion.hierarchy
import kotlinx.serialization.Serializable
import pt.fortislibertas.R

@Serializable data object AuthRoute
@Serializable data object HomeRoute
@Serializable data object DashboardRoute
@Serializable data object NewRecordRoute
@Serializable data object TransactionsRoute
@Serializable data object ProfileRoute
@Serializable data object NotificationsRoute                 // opened from the bell (no bottom bar)
@Serializable data object EditAccountRoute                   // opened from the Profile (no bottom bar)

/**
 * Cards / Banks screen (not a tab). [initialPage]: "cards" or "banks".
 * [from]: the tab that opened it ("home" or "profile"), so the bottom bar keeps it selected.
 */
@Serializable data class CardsRoute(val initialPage: String = "cards", val from: String = "home")

enum class TopLevelDestination(
    val route: Any,
    @DrawableRes val baseIcon: Int,
    @DrawableRes val accentIcon: Int?,   // null = single-colour icon
    @StringRes val labelRes: Int,
) {
    HOME(HomeRoute, R.drawable.ic_nav_home_base, R.drawable.ic_nav_home_accent, R.string.nav_home),
    DASHBOARD(DashboardRoute, R.drawable.ic_nav_dashboard_base, R.drawable.ic_nav_dashboard_accent, R.string.nav_dashboard),
    NEW_RECORD(NewRecordRoute, R.drawable.ic_nav_new_record_base, R.drawable.ic_nav_new_record_accent, R.string.nav_new_record),
    TRANSACTIONS(TransactionsRoute, R.drawable.ic_nav_transactions_base, R.drawable.ic_nav_transactions_accent, R.string.nav_transactions),
    PROFILE(ProfileRoute, R.drawable.ic_nav_profile_base, R.drawable.ic_nav_profile_accent, R.string.nav_profile),
}

fun NavDestination?.isOn(destination: TopLevelDestination): Boolean =
    this?.hierarchy?.any { it.hasRoute(destination.route::class) } == true