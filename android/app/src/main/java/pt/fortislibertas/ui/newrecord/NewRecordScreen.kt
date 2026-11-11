package pt.fortislibertas.ui.newrecord

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.ui.newrecord.components.NewRecordCategoryPickerDialog
import pt.fortislibertas.ui.newrecord.components.NewRecordFinancialRecordForm
import pt.fortislibertas.ui.newrecord.components.NewRecordInstalmentPlanForm
import pt.fortislibertas.ui.newrecord.components.NewRecordTagPickerDialog

/**
 * Stateful version of the Register tab, used by the NavHost.
 * Shows [NewRecordContent] and, on top of it, the form sheet and the category/tag pickers.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewRecordScreen(
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit = {},
    viewModel: NewRecordViewModel = viewModel(factory = NewRecordViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val resources = LocalContext.current.resources

    // When coming back to this tab, refresh the lists (they may have changed in another tab)
    LaunchedEffect(Unit) { viewModel.onScreenShown() }

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                is NewRecordEvent.ShowMessage ->
                    snackbarHostState.showSnackbar(resources.getString(event.messageRes))
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        NewRecordContent(
            avatarName = state.avatarName,
            avatarUrl = state.avatarUrl,
            contentPadding = contentPadding,
            onOpenNotifications = onOpenNotifications,
            onNewRecord = { viewModel.openSheet(RegisterSheet.FinancialRecord) },
            onNewPlan = { viewModel.openSheet(RegisterSheet.InstalmentPlan) },
        )
        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(contentPadding),
        )
    }

    // ── Form sheet (slides up from the bottom, like "Switch account") ──
    val sheet = state.openSheet
    if (sheet != null) {
        ModalBottomSheet(
            onDismissRequest = viewModel::closeSheet,
            sheetState = rememberModalBottomSheetState(
                skipPartiallyExpanded = true,
                // While saving, the sheet cannot be dragged closed
                confirmValueChange = { !state.isSaving },
            ),
        ) {
            val options = state.options
            Box(
                Modifier
                    .fillMaxWidth()
                    .imePadding()                                  // the keyboard does not cover the fields
                    .verticalScroll(rememberScrollState())
                    .padding(start = 24.dp, end = 24.dp, bottom = 32.dp),
            ) {
                when {
                    options != null -> when (sheet) {
                        RegisterSheet.FinancialRecord -> NewRecordFinancialRecordForm(
                            form = state.record,
                            options = options,
                            isSaving = state.isSaving,
                            onUpdate = viewModel::updateRecord,
                            onOpenCategory = { viewModel.openPicker(PickerDialog.Category) },
                            onOpenTags = { viewModel.openPicker(PickerDialog.Tags) },
                            onCancel = viewModel::closeSheet,
                            onSave = viewModel::saveRecord,
                        )
                        RegisterSheet.InstalmentPlan -> NewRecordInstalmentPlanForm(
                            form = state.plan,
                            options = options,
                            isSaving = state.isSaving,
                            onUpdate = viewModel::updatePlan,
                            onOpenCategory = { viewModel.openPicker(PickerDialog.Category) },
                            onOpenTags = { viewModel.openPicker(PickerDialog.Tags) },
                            onCancel = viewModel::closeSheet,
                            onSave = viewModel::savePlan,
                        )
                    }
                    state.optionsError != null -> ErrorContent(
                        message = stringResource(state.optionsError!!),
                        retryLabel = stringResource(R.string.action_retry),
                        onRetry = viewModel::loadOptions,
                        modifier = Modifier.height(320.dp),
                    )
                    else -> LoadingContent(Modifier.height(320.dp))
                }
            }
        }
    }

    // ── Blurred pickers (open on top of the sheet) ──
    val options = state.options
    if (options != null) {
        when (state.openPicker) {
            PickerDialog.Tags -> NewRecordTagPickerDialog(
                tags = options.tags,
                category = options.categories.firstOrNull { it.id == state.activeCategoryId },
                initialSelection = state.activeTagIds,
                isCreating = state.isCreatingOption,
                onCreateTag = viewModel::createTag,
                onApply = viewModel::applyTags,
                onDismiss = viewModel::closePicker,
            )
            PickerDialog.Category -> NewRecordCategoryPickerDialog(
                categories = options.categories,
                colors = options.colors,
                selectedId = state.activeCategoryId,
                type = state.activeType,
                isCreating = state.isCreatingOption,
                onSelect = viewModel::selectCategory,
                onCreate = viewModel::createCategory,
                onDismiss = viewModel::closePicker,
            )
            null -> Unit
        }
    }
}
