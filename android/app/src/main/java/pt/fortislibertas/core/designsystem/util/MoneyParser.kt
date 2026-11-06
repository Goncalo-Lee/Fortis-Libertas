package pt.fortislibertas.core.designsystem.util

import java.math.BigDecimal

object MoneyParser {

    /**
     * Turns what the user typed into an amount.
     * Accepts comma or dot: "12,5" and "12.50" → 12.50
     * Returns null if it is not a number or has more than 2 decimals.
     */
    fun parse(input: String): BigDecimal? {
        val normalized = input.trim().replace(" ", "").replace(',', '.')
        if (normalized.isEmpty()) return null
        val value = normalized.toBigDecimalOrNull() ?: return null
        return if (value.scale() > 2) null else value
    }
}