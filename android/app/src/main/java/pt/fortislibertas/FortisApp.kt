package pt.fortislibertas

import android.annotation.SuppressLint
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
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
import dev.chrisbanes.haze.hazeSource
import dev.chrisbanes.haze.rememberHazeState

@SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")

@Composable
fun FortisApp(navController: NavHostController = rememberNavController()) {
    // Observa o ecrã atual para saber que item da barra pintar
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = backStackEntry?.destination
    val currentTab = TopLevelDestination.entries.firstOrNull { currentDestination.isOn(it) }
    val hazeState = rememberHazeState()

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
                .hazeSource(hazeState),
        ) {
            // Placeholders: troca cada um pelo ecrã verdadeiro quando o criares
            composable<HomeRoute> { PlaceholderScreen("Home") }
            composable<DashboardRoute> { PlaceholderScreen("Dashboard") }
            composable<NewRecordRoute> { PlaceholderScreen("Novo registo") }
            composable<TransactionsRoute> { PlaceholderScreen("Transações") }
            composable<ProfileRoute> { PlaceholderScreen("Perfil") }
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
private fun PlaceholderScreen(title: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(title, style = MaterialTheme.typography.headlineMedium)
    }
}
