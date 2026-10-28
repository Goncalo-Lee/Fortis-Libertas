package pt.fortislibertas.ui.newrecord

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.PostAdd
import androidx.compose.material.icons.outlined.Savings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ActionTile
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.FortisTopBar
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme

/** Ecrã "Register": os três cartões + painéis dos formulários + seletores. */
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
    val scope = rememberCoroutineScope()
    val savingsSoon = stringResource(R.string.register_savings_soon)

    LaunchedEffect(viewModel) {
        viewModel.events.collect { event ->
            when (event) {
                is NewRecordEvent.ShowMessage ->
                    snackbarHostState.showSnackbar(resources.getString(event.messageRes))
            }
        }
    }

    Box(Modifier.fillMaxSize()) {
        NewRecordHub(
            avatarName = state.avatarName,
            avatarUrl = state.avatarUrl,
            contentPadding = contentPadding,
            onOpenNotifications = onOpenNotifications,
            onNewRecord = { viewModel.openSheet(RegisterSheet.FinancialRecord) },
            onNewPlan = { viewModel.openSheet(RegisterSheet.InstalmentPlan) },
            onNewSavings = { scope.launch { snackbarHostState.showSnackbar(savingsSoon) } },
        )
        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(contentPadding),
        )
    }

    // ── Painel do formulário (sobe de baixo, como o "Trocar de conta") ──
    val sheet = state.openSheet
    if (sheet != null) {
        ModalBottomSheet(
            onDismissRequest = viewModel::closeSheet,
            sheetState = rememberModalBottomSheetState(
                skipPartiallyExpanded = true,
                // Enquanto guarda, não deixa fechar o painel a arrastar
                confirmValueChange = { !state.isSaving },
            ),
        ) {
            val options = state.options
            Box(
                Modifier
                    .fillMaxWidth()
                    .imePadding()                                  // o teclado não tapa os campos
                    .verticalScroll(rememberScrollState())
                    .padding(start = 24.dp, end = 24.dp, bottom = 32.dp),
            ) {
                when {
                    options != null -> when (sheet) {
                        RegisterSheet.FinancialRecord -> FinancialRecordForm(
                            form = state.record,
                            options = options,
                            isSaving = state.isSaving,
                            onUpdate = viewModel::updateRecord,
                            onOpenCategory = { viewModel.openPicker(PickerDialog.Category) },
                            onOpenTags = { viewModel.openPicker(PickerDialog.Tags) },
                            onCancel = viewModel::closeSheet,
                            onSave = viewModel::saveRecord,
                        )
                        RegisterSheet.InstalmentPlan -> InstalmentPlanForm(
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

    // ── Seletores com blur (abrem por cima do painel) ──
    val options = state.options
    if (options != null) {
        when (state.openPicker) {
            PickerDialog.Tags -> TagPickerDialog(
                tags = options.tags,
                category = options.categories.firstOrNull { it.id == state.activeCategoryId },
                initialSelection = state.activeTagIds,
                isCreating = state.isCreatingOption,
                onCreateTag = viewModel::createTag,
                onApply = viewModel::applyTags,
                onDismiss = viewModel::closePicker,
            )
            PickerDialog.Category -> CategoryPickerDialog(
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

/** Parte fixa do ecrã: cabeçalho + cartões. Sem estado, fácil de pré-visualizar. */
@Composable
private fun NewRecordHub(
    avatarName: String?,
    avatarUrl: String?,
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit,
    onNewRecord: () -> Unit,
    onNewPlan: () -> Unit,
    onNewSavings: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(contentPadding)
            .padding(horizontal = 20.dp, vertical = 16.dp),
    ) {
        FortisTopBar(
            title = stringResource(R.string.register_title),
            avatarName = avatarName,
            avatarUrl = avatarUrl,
            notificationCount = 0,       // TODO: ligar às notificações
            notificationsLabel = stringResource(R.string.notifications),
            onNotificationsClick = onOpenNotifications,
        )

        Spacer(Modifier.height(32.dp))

        val tiles = listOf(
            Triple(Icons.Outlined.PostAdd, R.string.register_new_record, onNewRecord),
            Triple(Icons.Outlined.CalendarMonth, R.string.register_new_plan, onNewPlan),
            Triple(Icons.Outlined.Savings, R.string.register_new_savings, onNewSavings),
        )

        // Grelha de 2 colunas (feita à mão: são só 3 cartões)
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            tiles.chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    row.forEach { (icon, titleRes, onClick) ->
                        ActionTile(
                            icon = icon,
                            title = stringResource(titleRes),
                            onClick = onClick,
                            modifier = Modifier.weight(1f),
                        )
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Preview(showBackground = true, heightDp = 800)
@Composable
private fun NewRecordHubPreview() {
    FortisLibertasTheme(darkTheme = false) {
        NewRecordHub(
            avatarName = "Ana Silva",
            avatarUrl = null,
            contentPadding = PaddingValues(),
            onOpenNotifications = {},
            onNewRecord = {},
            onNewPlan = {},
            onNewSavings = {},
        )
    }
}