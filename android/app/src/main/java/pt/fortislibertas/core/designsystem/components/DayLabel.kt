package pt.fortislibertas.core.designsystem.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import pt.fortislibertas.R
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

/** "Today", "Yesterday" or the short date ("24 Oct"). Used in the transaction groups. */
@Composable
fun dayLabel(date: LocalDate): String {
    val today = LocalDate.now()
    return when (date) {
        today -> stringResource(R.string.today)
        today.minusDays(1) -> stringResource(R.string.yesterday)
        else -> date.format(DateTimeFormatter.ofPattern("d MMM", Locale.getDefault()))
    }
}
