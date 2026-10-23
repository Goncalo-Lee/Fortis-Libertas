package pt.atec.goncalo.fortislibertas_appandroid

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import pt.atec.goncalo.fortislibertas_appandroid.core.designsystem.components.FortisBottomBar
import pt.atec.goncalo.fortislibertas_appandroid.core.designsystem.components.FortisTopBar
import pt.atec.goncalo.fortislibertas_appandroid.ui.home.HomeScreen
import pt.atec.goncalo.fortislibertas_appandroid.ui.navigation.DESTINATION_HOME

@Composable
fun FortisApp() {
    val navController = rememberNavController()

    Scaffold(
        topBar = { FortisTopBar() },
        bottomBar = { FortisBottomBar() }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = DESTINATION_HOME,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(DESTINATION_HOME) {
                HomeScreen()
            }
            // TODO: adicionar os restantes destinos (dashboard, newrecord, ...)
        }
    }
}
