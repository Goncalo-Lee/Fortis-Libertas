package pt.fortislibertas.data.model

import java.math.BigDecimal

/** Tudo o que restringe a lista de transações. Vazio = mostra tudo. */
data class TransactionFilter(
    val query: String = "",
    val type: RecordType? = null,
    val categoryIds: Set<String> = emptySet(),
    val tagIds: Set<String> = emptySet(),
    val minAmount: BigDecimal? = null,
    val maxAmount: BigDecimal? = null,
) {
    /** Quantos filtros do diálogo estão ativos (para o número no botão). */
    val activeCount: Int
        get() = listOf(
            categoryIds.isNotEmpty(),
            tagIds.isNotEmpty(),
            minAmount != null || maxAmount != null,
        ).count { it }
}

/** O que o diálogo de filtros precisa para se desenhar. */
data class FilterOptions(
    val categories: List<Category>,
    val tags: List<Tag>,
    val maxAmount: BigDecimal,         // valor mais alto entre as transações (fim do slider)
)
