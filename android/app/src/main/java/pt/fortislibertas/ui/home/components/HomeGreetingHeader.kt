package pt.fortislibertas.ui.home.components

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import java.time.LocalTime
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme

/** "Good afternoon," + first name, based on the phone's time. */
@Composable
fun HomeGreetingHeader(fullName: String?, modifier: Modifier = Modifier) {
    val hour = remember { LocalTime.now().hour }
    val greeting = when (hour) {
        in 5..11 -> R.string.greeting_morning
        in 12..19 -> R.string.greeting_afternoon
        else -> R.string.greeting_evening
    }

    Column(modifier) {
        Text(stringResource(greeting), style = MaterialTheme.typography.headlineSmall)
        if (!fullName.isNullOrBlank()) {
            Text(
                text = fullName.trim().substringBefore(' '),
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun HomeGreetingHeaderPreview() {
    FortisLibertasTheme {
        HomeGreetingHeader(fullName = "Ana Silva")
    }
}
