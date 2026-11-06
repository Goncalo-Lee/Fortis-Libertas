package pt.fortislibertas.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import pt.fortislibertas.ui.home.HomeScreen
import pt.fortislibertas.ui.newrecord.NewRecordScreen
import pt.fortislibertas.ui.profile.ProfileScreen
import pt.fortislibertas.ui.transactions.TransactionsScreen

/**
 * Every screen of the app and how they connect.
 * To add a screen: create its route in Destinations.kt and a `composable<...>` here.
 */
@Composable
fun FortisNavHost(
    navController: NavHostController,
    contentPadding: PaddingValues,
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController = navController,
        startDestination = HomeRoute,
        modifier = modifier,
    ) {
        composable<HomeRoute> {
            HomeScreen(
                contentPadding = contentPadding,
                onOpenBanks = { /* TODO: banks and cards screen */ },
                onSeeAllTransactions = {
                    navController.navigateToTab(TopLevelDestination.TRANSACTIONS)
                },
                onSignIn = { /* TODO: sign in screen */ },
            )
        }
        composable<DashboardRoute> { PlaceholderScreen("Dashboard", contentPadding) }
        composable<NewRecordRoute> {
            NewRecordScreen(contentPadding = contentPadding)
        }
        composable<TransactionsRoute> {
            TransactionsScreen(contentPadding = contentPadding)
        }
        composable<ProfileRoute> {
            ProfileScreen(
                contentPadding = contentPadding,
                onNavigateToSignIn = { /* TODO: sign in screen */ },
            )
        }
    }
}

/**
 * Usual bottom bar navigation:
 * - popUpTo(start) + saveState: switching tabs does not pile up screens
 * - launchSingleTop: tapping the same item twice does not open it again
 * - restoreState: the tab comes back with the same scroll/state it had
 */
fun NavHostController.navigateToTab(destination: TopLevelDestination) {
    navigate(destination.route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

/** Temporary screen for tabs that are not built yet. */
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
