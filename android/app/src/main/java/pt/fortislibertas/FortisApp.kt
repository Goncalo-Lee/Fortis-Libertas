package pt.fortislibertas

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.haze
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.first
import pt.fortislibertas.core.designsystem.components.FortisBottomBar
import pt.fortislibertas.ui.navigation.AuthRoute
import pt.fortislibertas.ui.navigation.CardsRoute
import pt.fortislibertas.ui.navigation.FortisNavHost
import pt.fortislibertas.ui.navigation.HomeRoute
import pt.fortislibertas.ui.navigation.TopLevelDestination
import pt.fortislibertas.ui.navigation.isOn
import pt.fortislibertas.ui.navigation.navigateToAuthClearingStack
import pt.fortislibertas.ui.navigation.navigateToTab
import pt.fortislibertas.ui.notifications.LocalUnreadNotifications

/**
 * Root of the UI: the Scaffold with the bottom bar and the [FortisNavHost].
 * The bottom bar only shows on the top level tabs and blurs the content behind it (Haze).
 * Shows the Sign in screen whenever there is no saved account (at start and after the last sign out).
 */
@Composable
fun FortisApp(navController: NavHostController = rememberNavController()) {
    val hazeState = remember { HazeState() }                 // Haze 1.0.0
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = backStackEntry?.destination
    val currentTab = TopLevelDestination.entries.firstOrNull { currentDestination.isOn(it) }
        ?: backStackEntry?.cardsOrigin()          // Cards / Banks: keep the tab it was opened from

    // First screen: Home if there is an active account, otherwise Sign in.
    // null while the saved accounts are being read (only a few milliseconds).
    val container = (LocalContext.current.applicationContext as FortisApplication).container
    val startDestination by produceState<Any?>(initialValue = null) {
        container.startup.join()
        value = if (container.accountStore.activeAccountId.first() != null) HomeRoute else AuthRoute
    }

    // While the app is open: if the last account is removed (sign out, delete…), go to Sign in
    LaunchedEffect(startDestination) {
        if (startDestination == null) return@LaunchedEffect
        container.accountStore.activeAccountId.collect { activeId ->
            val onAuth = navController.currentDestination?.hasRoute(AuthRoute::class) == true
            if (activeId == null && !onAuth) navController.navigateToAuthClearingStack()
        }
    }

    // Bell badge: refreshed when the account or the tab changes (one small request)
    val unreadNotifications by container.notificationRepository.unreadCount.collectAsStateWithLifecycle()
    val activeAccountId by container.accountStore.activeAccountId.collectAsStateWithLifecycle(initialValue = null)
    LaunchedEffect(activeAccountId, currentTab) {
        if (activeAccountId == null) return@LaunchedEffect
        try {
            container.notificationRepository.refreshUnreadCount()
        } catch (e: CancellationException) {
            throw e
        } catch (_: Exception) {
            // No network: the badge keeps the last value
        }
    }

    Scaffold(
        bottomBar = {
            if (currentTab != null) {
                FortisBottomBar(
                    current = currentTab,
                    onNavigate = { navController.navigateToTab(it) },
                    hazeState = hazeState,
                )
            }
        },
    ) { innerPadding ->
        val start = startDestination ?: return@Scaffold
        CompositionLocalProvider(LocalUnreadNotifications provides unreadNotifications) {
            FortisNavHost(
                navController = navController,
                contentPadding = innerPadding,
                startDestination = start,
                modifier = Modifier
                    .fillMaxSize()
                    .haze(hazeState),                        // Haze 1.0.0 (newer versions: hazeSource)
            )
        }
    }
}

/** The tab that opened the Cards / Banks screen, or null when this entry is another screen. */
private fun NavBackStackEntry.cardsOrigin(): TopLevelDestination? {
    if (!destination.hasRoute(CardsRoute::class)) return null
    return if (toRoute<CardsRoute>().from == "profile") TopLevelDestination.PROFILE else TopLevelDestination.HOME
}
