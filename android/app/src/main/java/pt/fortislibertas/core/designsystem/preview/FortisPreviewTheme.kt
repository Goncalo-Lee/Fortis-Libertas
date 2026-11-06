package pt.fortislibertas.core.designsystem.preview

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme

/**
 * Theme for previews only: [FortisLibertasTheme] + a [Surface] behind the content.
 * In the app the Scaffold already gives that Surface; without it, Text falls back to
 * black and is unreadable in the dark preview.
 */
@Composable
fun FortisPreviewTheme(content: @Composable () -> Unit) {
    FortisLibertasTheme {
        Surface(color = MaterialTheme.colorScheme.background, content = content)
    }
}
