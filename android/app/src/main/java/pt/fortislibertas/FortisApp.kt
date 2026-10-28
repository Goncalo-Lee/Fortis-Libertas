package pt.fortislibertas

import android.annotation.SuppressLint
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import pt.fortislibertas.core.designsystem.components.FortisBottomBar
import pt.fortislibertas.ui.navigation.DashboardRoute
import pt.fortislibertas.ui.navigation.HomeRoute
import pt.fortislibertas.ui.navigation.NewRecordRoute
import pt.fortislibertas.ui.navigation.ProfileRoute
import pt.fortislibertas.ui.navigation.TopLevelDestination
import pt.fortislibertas.ui.navigation.TransactionsRoute
import pt.fortislibertas.ui.navigation.isOn
import androidx.compose.runtime.remember
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.haze
import pt.fortislibertas.ui.home.HomeScreen
import pt.fortislibertas.ui.newrecord.NewRecordScreen
import pt.fortislibertas.ui.profile.ProfileScreen

@SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")

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
        NavHost(
            navController = navController,
            startDestination = HomeRoute,
            modifier = Modifier
                .fillMaxSize()
                .haze(hazeState),                            // Haze 1.0.0 (nos novos: hazeSource)
        ) {
            composable<HomeRoute> {
                HomeScreen(
                    contentPadding = innerPadding,
                    onOpenBanks = { /* TODO: ecrã Bancos e cartões */ },
                    onSeeAllTransactions = {
                        navController.navigateToTab(TopLevelDestination.TRANSACTIONS)
                    },
                    onSignIn = { /* TODO: ecrã de login */ },
                )
            }
            composable<DashboardRoute> { PlaceholderScreen("Dashboard", innerPadding) }
            composable<NewRecordRoute> {
                NewRecordScreen(contentPadding = innerPadding)
            }
            composable<TransactionsRoute> { PlaceholderScreen("Transações", innerPadding) }
            composable<ProfileRoute> {
                ProfileScreen(
                    contentPadding = innerPadding,
                    onNavigateToSignIn = { /* TODO: ecrã de login */ },
                )
            }
        }
    }
}

/**
 * Navegação típica de bottom bar:
 * - popUpTo(start) + saveState: não acumula ecrãs ao trocar de separador
 * - launchSingleTop: tocar 2x no mesmo item não abre o ecrã repetido
 * - restoreState: volta ao mesmo scroll/estado em que estava o separador
 */
private fun NavHostController.navigateToTab(destination: TopLevelDestination) {
    navigate(destination.route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

@Composable
private fun PlaceholderScreen(title: String, contentPadding: PaddingValues) {
    Box(
        Modifier
            .fillMaxSize()
            .padding(contentPadding),
        contentAlignment = Alignment.Center,
    ) {
        Text(title, style = MaterialTheme.typography.headlineMedium)
    }
}
