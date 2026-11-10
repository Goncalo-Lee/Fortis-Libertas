package pt.fortislibertas

import android.graphics.Color
import android.os.Bundle
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.data.model.ThemeMode

// AppCompatActivity (not ComponentActivity) so the language chosen in the app works on every Android version
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val settingsStore = (application as FortisApplication).container.settingsStore
        setContent {
            val themeMode by settingsStore.themeMode.collectAsStateWithLifecycle(ThemeMode.System)
            val darkTheme = when (themeMode) {
                ThemeMode.System -> isSystemInDarkTheme()
                ThemeMode.Light -> false
                ThemeMode.Dark -> true
            }

            // Status bar icons follow the app theme, not only the phone theme
            DisposableEffect(darkTheme) {
                val style = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT) { darkTheme }
                enableEdgeToEdge(statusBarStyle = style, navigationBarStyle = style)
                onDispose {}
            }

            FortisLibertasTheme(darkTheme = darkTheme) {
                FortisApp()
            }
        }
    }
}
