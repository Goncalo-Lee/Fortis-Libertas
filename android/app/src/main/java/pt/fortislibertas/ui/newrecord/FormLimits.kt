package pt.fortislibertas.ui.newrecord

/** Têm de ser iguais aos da base de dados e da validação da API. */
object FormLimits {
    const val NAME = 50
    const val DESCRIPTION = 500
    const val DESCRIPTION_VISIBLE_LINES = 5   // depois disto, scroll dentro do campo
}