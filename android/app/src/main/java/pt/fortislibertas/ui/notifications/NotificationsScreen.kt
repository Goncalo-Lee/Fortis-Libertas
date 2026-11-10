package pt.fortislibertas.ui.notifications

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

/** Stateful version used in the NavHost (opened from the bell of any top bar). */
@Composable
fun NotificationsScreen(
    contentPadding: PaddingValues,
    onBack: () -> Unit,
    viewModel: NotificationsViewModel = viewModel(factory = NotificationsViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val resources = LocalContext.current.resources

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                is NotificationsEvent.ShowMessage -> snackbarHostState.showSnackbar(resources.getString(event.messageRes))
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        NotificationsContent(
            state = state,
            contentPadding = contentPadding,
            onBack = onBack,
            onRetry = viewModel::load,
            onOnlyUnreadChange = viewModel::setOnlyUnread,
            onMarkAllRead = viewModel::markAllRead,
            onOpen = viewModel::open,
            onDelete = viewModel::delete,
        )
        SnackbarHost(snackbarHostState, Modifier.align(Alignment.BottomCenter).padding(contentPadding))
    }
}
