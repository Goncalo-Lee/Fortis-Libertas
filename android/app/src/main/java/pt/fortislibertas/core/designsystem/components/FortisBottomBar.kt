package pt.fortislibertas.core.designsystem.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import pt.fortislibertas.ui.navigation.TopLevelDestination

/**
 * Barra inferior "flutuante" do wireframe: cartão com cantos redondos,
 * afastado das margens do ecrã, com ícone + texto em todos os itens.
 *
 * Não sabe nada de navegação: recebe o destino atual e avisa quando
 * um item é tocado. Quem navega é o FortisApp.
 */
@Composable
fun FortisBottomBar(
    current: TopLevelDestination?,
    onNavigate: (TopLevelDestination) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()            // não fica por baixo da barra de gestos do Android
            .padding(horizontal = 16.dp, vertical = 12.dp),
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surfaceContainer,
            tonalElevation = 3.dp,
        ) {
            NavigationBar(
                containerColor = Color.Transparent, // a cor vem do Surface (para os cantos redondos)
                tonalElevation = 0.dp,
                windowInsets = androidx.compose.foundation.layout.WindowInsets(0),
            ) {
                TopLevelDestination.entries.forEach { destination ->
                    val selected = destination == current
                    NavigationBarItem(
                        selected = selected,
                        onClick = { onNavigate(destination) },
                        icon = {
                            Icon(
                                imageVector = if (selected) destination.selectedIcon else destination.unselectedIcon,
                                contentDescription = null, // o texto por baixo já descreve o item
                            )
                        },
                        label = {
                            Text(
                                text = stringResource(destination.labelRes),
                                style = MaterialTheme.typography.labelSmall,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        },
                        alwaysShowLabel = true,
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.onPrimary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primary,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        ),
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun FortisBottomBarPreview() {
    MaterialTheme {
        FortisBottomBar(current = TopLevelDestination.HOME, onNavigate = {})
    }
}
