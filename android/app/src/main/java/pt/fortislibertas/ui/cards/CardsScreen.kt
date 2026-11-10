package pt.fortislibertas.ui.cards

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AcUnit
import androidx.compose.material.icons.outlined.DeleteForever
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ConfirmDialog
import pt.fortislibertas.ui.cards.components.CardsAddBankForm
import pt.fortislibertas.ui.cards.components.CardsAddCardForm
import pt.fortislibertas.ui.cards.components.CardsBankDetailDialog
import pt.fortislibertas.ui.cards.components.CardsEditCardForm
import pt.fortislibertas.ui.cards.components.CardsInfoDialog

/**
 * Stateful version of the Cards / Banks screen, used by the NavHost.
 * Connects [CardsViewModel] to [CardsContent] and shows the snackbar and the dialogs.
 */
@OptIn(ExperimentalMaterial3Api::class)
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
            onEdit = viewModel::openEdit,
            onOpenBank = viewModel::openBank,
            onAdd = viewModel::openAdd,
        )
        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(contentPadding),
        )
    }

    // ── Edit card: sheet that slides up from the bottom, like the New record form ──
    state.editForm?.let { form ->
        ModalBottomSheet(
            onDismissRequest = viewModel::closeEdit,
            sheetState = rememberModalBottomSheetState(
                skipPartiallyExpanded = true,
                confirmValueChange = { !state.isWorking },   // cannot be dragged closed while saving
            ),
        ) {
            CardsEditCardForm(
                form = form,
                isSaving = state.isWorking,
                onUpdate = viewModel::updateEdit,
                onCancel = viewModel::closeEdit,
                onSave = viewModel::saveEdit,
                onDelete = viewModel::requestDelete,
                modifier = Modifier
                    .fillMaxWidth()
                    .imePadding()                             // the keyboard does not cover the fields
                    .verticalScroll(rememberScrollState())
                    .padding(start = 24.dp, end = 24.dp, bottom = 32.dp),
            )
        }
    }

    // ── Add card / Add bank: same kind of sheet as Edit card ──
    if (state.addCardForm != null || state.addBankForm != null) {
        ModalBottomSheet(
            onDismissRequest = viewModel::closeAdd,
            sheetState = rememberModalBottomSheetState(
                skipPartiallyExpanded = true,
                confirmValueChange = { !state.isWorking },
            ),
        ) {
            val sheetModifier = Modifier
                .fillMaxWidth()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(start = 24.dp, end = 24.dp, bottom = 32.dp)
            state.addCardForm?.let { form ->
                CardsAddCardForm(
                    form = form,
                    banks = state.banks,
                    isSaving = state.isWorking,
                    onUpdate = viewModel::updateAddCard,
                    onCancel = viewModel::closeAdd,
                    onSave = viewModel::saveAddCard,
                    modifier = sheetModifier,
                )
            }
            state.addBankForm?.let { form ->
                CardsAddBankForm(
                    form = form,
                    isSaving = state.isWorking,
                    onUpdate = viewModel::updateAddBank,
                    onCancel = viewModel::closeAdd,
                    onSave = viewModel::saveAddBank,
                    modifier = sheetModifier,
                )
            }
        }
    }

    // ── Bank details (members are read only) ──
    state.bankDetail?.let { detail ->
        CardsBankDetailDialog(
            state = detail,
            cardCount = state.cards.count { it.bankId == detail.bank.id },
            onDismiss = viewModel::closeBank,
        )
    }

    // Dialogs: freeze, unfreeze and delete always ask first
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
        is CardsDialog.Delete -> ConfirmDialog(
            icon = Icons.Outlined.DeleteForever,
            title = stringResource(R.string.cards_delete_title),
            message = stringResource(R.string.cards_delete_message),
            confirmLabel = stringResource(R.string.action_delete),
            dismissLabel = stringResource(R.string.action_cancel),
            destructive = true,
            isWorking = state.isWorking,
            onConfirm = viewModel::confirmDialog,
            onDismiss = viewModel::closeDialog,
        )
        null -> Unit
    }
}
