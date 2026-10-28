package pt.fortislibertas.core.designsystem.util

import java.math.BigDecimal

object MoneyParser {

    /**
     * Converte o que o utilizador escreveu num valor.
     * Aceita vírgula ou ponto: "12,5" e "12.50" → 12.50
     * Devolve null se não for um número ou tiver mais de 2 casas decimais.
     */
    fun parse(input: String): BigDecimal? {
        val normalized = input.trim().replace(" ", "").replace(',', '.')
        if (normalized.isEmpty()) return null
        val value = normalized.toBigDecimalOrNull() ?: return null
        return if (value.scale() > 2) null else value
    }
}