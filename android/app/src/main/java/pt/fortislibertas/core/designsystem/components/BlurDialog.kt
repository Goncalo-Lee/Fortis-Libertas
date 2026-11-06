package pt.fortislibertas.core.designsystem.components

import android.os.Build
import android.view.WindowManager
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.window.DialogWindowProvider
import pt.fortislibertas.core.designsystem.preview.FortisPreviews
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme

/**
 * Dialog with a blurred background. Tapping outside the card closes it.
 *
 * The blur comes from Android itself (no Haze needed), because the dialog
 * opens in a window on top of everything, including the form sheet.
 * - Android 12+ (API 31): real blur + a light dim
 * - Older versions, or blur turned off on the device: only dims
 */
@Composable
fun BlurDialog(
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    blurRadius: Dp = 24.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(
            dismissOnClickOutside = true,
            dismissOnBackPress = true,
        ),
    ) {
        val view = LocalView.current
        val blurPx = with(LocalDensity.current) { blurRadius.roundToPx() }

        LaunchedEffect(view, blurPx) {
            val window = (view.parent as? DialogWindowProvider)?.window ?: return@LaunchedEffect
            window.setDimAmount(0.3f)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                window.addFlags(WindowManager.LayoutParams.FLAG_BLUR_BEHIND)
                window.attributes = window.attributes.apply { blurBehindRadius = blurPx }
            }
        }

        Surface(
            modifier = modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 2.dp,
        ) {
            Column(Modifier.padding(20.dp), content = content)
        }
    }
}

@FortisPreviews
@Composable
private fun BlurDialogPreview() {
    FortisLibertasTheme {
        BlurDialog(
            onDismissRequest = {},
        ) {
            Text(
                text = "Título do Diálogo",
                style = MaterialTheme.typography.titleLarge,
            )
            Text(
                text = "Este é um exemplo de conteúdo para o diálogo com fundo desfocado.",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 8.dp),
            )
        }
    }
}

