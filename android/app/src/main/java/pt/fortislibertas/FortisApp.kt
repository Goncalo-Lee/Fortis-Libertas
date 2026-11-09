package pt.fortislibertas

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.haze
import kotlinx.coroutines.flow.first
import pt.fortislibertas.core.designsystem.components.FortisBottomBar
import pt.fortislibertas.ui.navigation.AuthRoute
import pt.fortislibertas.ui.navigation.FortisNavHost
import pt.fortislibertas.ui.navigation.HomeRoute
import pt.fortislibertas.ui.navigation.TopLevelDestination
import pt.fortislibertas.ui.navigation.isOn
import pt.fortislibertas.ui.navigation.navigateToTab

/**
 * Root of the UI: the Scaffold with the bottom bar and the [FortisNavHost].
 * The bottom bar only shows on the top level tabs and blurs the content behind it (Haze).
 * Starts on the Sign in screen when there is no saved account.
 */
@Composable
fun FortisApp(navController: NavHostController = rememberNavController()) {
    val hazeState = remember { HazeState() }                 // Haze 1.0.0
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = backStackEntry?.destination
    val currentTab = TopLevelDestination.entries.firstOrNull { currentDestination.isOn(it) }

    // First screen: Home if there is an active account, otherwise Sign in.
    // null while the saved accounts are being read (only a few milliseconds).
    val container = (LocalContext.current.applicationContext as FortisApplication).container
    val startDestination by produceState<Any?>(initialValue = null) {
        container.startup.join()
        value = if (container.accountStore.activeAccountId.first() != null) HomeRoute else AuthRoute
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
        FortisNavHost(
            navController = navController,
            contentPadding = innerPadding,
            startDestination = start,
            modifier = Modifier
                .fillMaxSize()
                .haze(hazeState),                            // Haze 1.0.0 (newer versions: hazeSource)
        )
    }
}
