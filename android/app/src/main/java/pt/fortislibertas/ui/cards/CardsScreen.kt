package pt.fortislibertas.ui.cards

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AcUnit
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ConfirmDialog
import pt.fortislibertas.ui.cards.components.CardsInfoDialog

/**
 * Stateful version of the Cards / Banks screen, used by the NavHost.
 * Connects [CardsViewModel] to [CardsContent] and shows the snackbar and the dialogs.
 */
@Composable
fun CardsScreen(
    contentPadding: PaddingValues,
    initialPage: CardsPage,
    onBack: () -> Unit,
    onOpenNotifications: () -> Unit = {},
    viewModel: CardsViewModel = viewModel(factory = CardsViewModel.factory(initialPage)),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val resources = LocalContext.current.resources

    // One-time events: messages after freezing / unfreezing
    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                is CardsEvent.ShowMessage ->
                    snackbarHostState.showSnackbar(resources.getString(event.messageRes))
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        CardsContent(
            state = state,
            contentPadding = contentPadding,
            onBack = onBack,
            onOpenNotifications = onOpenNotifications,
            onTogglePage = viewModel::togglePage,
            onFilterChange = viewModel::onFilterChange,
            onRetry = viewModel::load,
            onFreeze = viewModel::requestFreeze,
            onUnfreeze = viewModel::requestUnfreeze,
            onShowInfo = viewModel::showInfo,
        )
        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(contentPadding),
        )
    }

    // Dialogs: freeze and unfreeze always ask first
    when (val dialog = state.dialog) {
        is CardsDialog.Freeze -> ConfirmDialog(
            icon = Icons.Outlined.AcUnit,
            title = stringResource(R.string.cards_freeze_title),
            message = stringResource(R.string.cards_freeze_message),
            confirmLabel = stringResource(R.string.cards_freeze_confirm),
            dismissLabel = stringResource(R.string.action_cancel),
            isWorking = state.isWorking,
            onConfirm = viewModel::confirmDialog,
            onDismiss = viewModel::closeDialog,
        )
        is CardsDialog.Unfreeze -> ConfirmDialog(
            icon = Icons.Outlined.AcUnit,
            title = stringResource(R.string.cards_unfreeze_title),
            message = stringResource(R.string.cards_unfreeze_message),
            confirmLabel = stringResource(R.string.cards_unfreeze_confirm),
            dismissLabel = stringResource(R.string.action_cancel),
            isWorking = state.isWorking,
            onConfirm = viewModel::confirmDialog,
            onDismiss = viewModel::closeDialog,
        )
        is CardsDialog.Info -> CardsInfoDialog(card = dialog.card, onDismiss = viewModel::closeDialog)
        null -> Unit
    }
}
