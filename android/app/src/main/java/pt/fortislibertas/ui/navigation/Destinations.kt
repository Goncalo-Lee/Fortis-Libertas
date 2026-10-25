package pt.fortislibertas.ui.navigation

import androidx.annotation.StringRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PostAdd
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.PostAdd
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavDestination.Companion.hierarchy
import kotlinx.serialization.Serializable
import pt.fortislibertas.R

// Rotas type-safe: cada ecrã é um objeto, em vez de uma string "home"
@Serializable data object HomeRoute
@Serializable data object DashboardRoute
@Serializable data object NewRecordRoute
@Serializable data object TransactionsRoute
@Serializable data object ProfileRoute

// Os 5 itens da barra inferior, pela ordem do wireframe
enum class TopLevelDestination(
    val route: Any,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    @StringRes val labelRes: Int,
) {
    HOME(HomeRoute, Icons.Filled.Home, Icons.Outlined.Home, R.string.nav_home),
    DASHBOARD(DashboardRoute, Icons.Filled.Dashboard, Icons.Outlined.Dashboard, R.string.nav_dashboard),
    NEW_RECORD(NewRecordRoute, Icons.Filled.PostAdd, Icons.Outlined.PostAdd, R.string.nav_new_record),
    TRANSACTIONS(TransactionsRoute, Icons.Filled.SwapHoriz, Icons.Outlined.SwapHoriz, R.string.nav_transactions),
    PROFILE(ProfileRoute, Icons.Filled.Person, Icons.Outlined.Person, R.string.nav_profile),
}

// true se o ecrã atual pertence a este destino (inclui sub-ecrãs dentro dele)
fun NavDestination?.isOn(destination: TopLevelDestination): Boolean =
    this?.hierarchy?.any { it.hasRoute(destination.route::class) } == true
