package pt.fortislibertas.ui.notifications

import androidx.compose.runtime.compositionLocalOf

/**
 * Number of unread notifications for the bell badge of every top bar.
 * Provided once in FortisApp, so each screen does not need its own ViewModel code for it.
 */
val LocalUnreadNotifications = compositionLocalOf { 0 }
