package pt.atec.goncalo.fortislibertas_appandroid

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import pt.atec.goncalo.fortislibertas_appandroid.core.designsystem.theme.FortisTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FortisTheme {
                FortisApp()
            }
        }
    }
}
