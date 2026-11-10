package pt.fortislibertas.ui.navigation

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.toRoute
import pt.fortislibertas.ui.auth.AuthScreen
import pt.fortislibertas.ui.cards.CardsPage
import pt.fortislibertas.ui.cards.CardsScreen
import pt.fortislibertas.ui.dashboard.DashboardScreen
import pt.fortislibertas.ui.editaccount.EditAccountScreen
import pt.fortislibertas.ui.home.HomeScreen
import pt.fortislibertas.ui.newrecord.NewRecordScreen
import pt.fortislibertas.ui.notifications.NotificationsScreen
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
    startDestination: Any,
    modifier: Modifier = Modifier,
) {
    val openNotifications = { navController.navigate(NotificationsRoute) { launchSingleTop = true } }

    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier,
    ) {
        composable<AuthRoute> {
            AuthScreen(
                contentPadding = contentPadding,
                onSignedIn = { navController.navigateToHomeClearingStack() },
            )
        }
        composable<HomeRoute> {
            HomeScreen(
                contentPadding = contentPadding,
                onOpenBanks = { navController.navigate(CardsRoute(initialPage = "cards", from = "home")) },
                onSeeAllTransactions = {
                    navController.navigateToTab(TopLevelDestination.TRANSACTIONS)
                },
                onSignIn = { navController.navigate(AuthRoute) { launchSingleTop = true } },
                onOpenNotifications = openNotifications,
            )
        }
        composable<CardsRoute> { entry ->
            val route = entry.toRoute<CardsRoute>()
            CardsScreen(
                contentPadding = contentPadding,
                initialPage = if (route.initialPage == "banks") CardsPage.Banks else CardsPage.Cards,
                onBack = { navController.popBackStack() },
                onOpenNotifications = openNotifications,
            )
        }
        composable<DashboardRoute> {
            DashboardScreen(contentPadding = contentPadding, onOpenNotifications = openNotifications)
        }
        composable<NewRecordRoute> {
            NewRecordScreen(contentPadding = contentPadding, onOpenNotifications = openNotifications)
        }
        composable<TransactionsRoute> {
            TransactionsScreen(contentPadding = contentPadding, onOpenNotifications = openNotifications)
        }
        composable<NotificationsRoute> {
            NotificationsScreen(contentPadding = contentPadding, onBack = { navController.popBackStack() })
        }
        composable<ProfileRoute> { entry ->
            // Edit account leaves "account_saved" here so the Profile reloads and says so
            val accountSaved by entry.savedStateHandle.getStateFlow(ACCOUNT_SAVED, false).collectAsStateWithLifecycle()
            ProfileScreen(
                contentPadding = contentPadding,
                onNavigateToSignIn = { navController.navigate(AuthRoute) { launchSingleTop = true } },
                onEditProfile = { navController.navigate(EditAccountRoute) { launchSingleTop = true } },
                onOpenBanks = { navController.navigate(CardsRoute(initialPage = "banks", from = "profile")) },
                accountSaved = accountSaved,
                onAccountSavedHandled = { entry.savedStateHandle[ACCOUNT_SAVED] = false },
            )
        }
        composable<EditAccountRoute> {
            EditAccountScreen(
                contentPadding = contentPadding,
                onBack = { navController.popBackStack() },
                onSaved = {
                    navController.previousBackStackEntry?.savedStateHandle?.set(ACCOUNT_SAVED, true)
                    navController.popBackStack()
                },
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

/**
 * No account left: Auth becomes the only screen, so the tabs (and the bottom bar)
 * cannot be reached until someone signs in.
 */
fun NavHostController.navigateToAuthClearingStack() {
    navigate(AuthRoute) {
        popUpTo(graph.id) { inclusive = true }
        launchSingleTop = true
    }
}

/** After signing in: Home becomes the only screen, so back does not return to the Auth screen. */
private fun NavHostController.navigateToHomeClearingStack() {
    navigate(HomeRoute) {
        popUpTo(graph.id) { inclusive = true }
    }
}

/** Key of the "Edit account saved" result in the Profile's SavedStateHandle. */
private const val ACCOUNT_SAVED = "account_saved"
