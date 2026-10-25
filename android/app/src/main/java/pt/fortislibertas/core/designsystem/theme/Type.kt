package pt.fortislibertas.core.designsystem.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import pt.fortislibertas.R

val Montserrat = FontFamily(
    Font(R.font.montserrat_regular, FontWeight.Normal),
    Font(R.font.montserrat_medium, FontWeight.Medium),
    Font(R.font.montserrat_semibold, FontWeight.SemiBold),
    Font(R.font.montserrat_bold, FontWeight.Bold),
)

// Parte dos tamanhos por defeito do Material 3 e só troca a fonte
private val base = Typography()

val Typography = Typography(
    displayLarge   = base.displayLarge.copy(fontFamily = Montserrat),
    displayMedium  = base.displayMedium.copy(fontFamily = Montserrat),
    displaySmall   = base.displaySmall.copy(fontFamily = Montserrat),
    headlineLarge  = base.headlineLarge.copy(fontFamily = Montserrat),
    headlineMedium = base.headlineMedium.copy(fontFamily = Montserrat, fontWeight = FontWeight.Bold),
    headlineSmall  = base.headlineSmall.copy(fontFamily = Montserrat),
    titleLarge     = base.titleLarge.copy(fontFamily = Montserrat, fontWeight = FontWeight.SemiBold),
    titleMedium    = base.titleMedium.copy(fontFamily = Montserrat, fontWeight = FontWeight.SemiBold),
    titleSmall     = base.titleSmall.copy(fontFamily = Montserrat),
    bodyLarge      = base.bodyLarge.copy(fontFamily = Montserrat),
    bodyMedium     = base.bodyMedium.copy(fontFamily = Montserrat),
    bodySmall      = base.bodySmall.copy(fontFamily = Montserrat),
    labelLarge     = base.labelLarge.copy(fontFamily = Montserrat, fontWeight = FontWeight.SemiBold),
    labelMedium    = base.labelMedium.copy(fontFamily = Montserrat),
    labelSmall     = base.labelSmall.copy(fontFamily = Montserrat),
)