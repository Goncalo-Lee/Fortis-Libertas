package pt.fortislibertas.core.designsystem.util

import java.math.BigDecimal
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

object MoneyFormatter {

    private val locale: Locale = Locale.forLanguageTag("pt-PT")

    /** 1250.4 → "1250,40 €" (formato português). */
    fun format(value: BigDecimal, currencyCode: String = "EUR"): String {
        val formatter = NumberFormat.getCurrencyInstance(locale)
        formatter.currency = Currency.getInstance(currencyCode)
        return formatter.format(value)
    }
}
