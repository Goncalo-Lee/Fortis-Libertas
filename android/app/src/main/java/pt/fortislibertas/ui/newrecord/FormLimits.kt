package pt.fortislibertas.ui.newrecord

/** Must match the database and the API validation. */
object FormLimits {
    const val NAME = 50
    const val DESCRIPTION = 500
    const val DESCRIPTION_VISIBLE_LINES = 5   // after this, the field scrolls inside
}