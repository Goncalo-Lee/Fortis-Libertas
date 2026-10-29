package pt.fortislibertas.core.designsystem.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import pt.fortislibertas.R
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

/** "Hoje", "Ontem" ou a data curta ("24 out"). Usado nos grupos de transações. */
@Composable
fun dayLabel(date: LocalDate): String {
    val today = LocalDate.now()
    return when (date) {
        today -> stringResource(R.string.today)
        today.minusDays(1) -> stringResource(R.string.yesterday)
        else -> date.format(DateTimeFormatter.ofPattern("d MMM", Locale.getDefault()))
    }
}
