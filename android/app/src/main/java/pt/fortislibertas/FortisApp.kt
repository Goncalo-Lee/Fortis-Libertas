package pt.fortislibertas

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.haze
import pt.fortislibertas.core.designsystem.components.FortisBottomBar
import pt.fortislibertas.ui.navigation.FortisNavHost
import pt.fortislibertas.ui.navigation.TopLevelDestination
import pt.fortislibertas.ui.navigation.isOn
import pt.fortislibertas.ui.navigation.navigateToTab

/**
 * Root of the UI: the Scaffold with the bottom bar and the [FortisNavHost].
 * The bottom bar only shows on the top level tabs and blurs the content behind it (Haze).
 */
@Composable
fun FortisApp(navController: NavHostController = rememberNavController()) {
    val hazeState = remember { HazeState() }                 // Haze 1.0.0
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = backStackEntry?.destination
    val currentTab = TopLevelDestination.entries.firstOrNull { currentDestination.isOn(it) }

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
        FortisNavHost(
            navController = navController,
            contentPadding = innerPadding,
            modifier = Modifier
                .fillMaxSize()
                .haze(hazeState),                            // Haze 1.0.0 (newer versions: hazeSource)
        )
    }
}
