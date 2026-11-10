package pt.fortislibertas.ui.dashboard

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Category
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Sell
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ArcAction
import pt.fortislibertas.core.designsystem.components.ArcMenu
import pt.fortislibertas.ui.dashboard.components.DashboardAllCategoriesDialog
import pt.fortislibertas.ui.dashboard.components.DashboardCreateDialog
import pt.fortislibertas.ui.dashboard.components.DashboardManageDialog

/**
 * Stateful version of the Dashboard tab, used by the NavHost.
 * Connects [DashboardViewModel] to [DashboardContent] and shows its dialogs.
 */
@Composable
fun DashboardScreen(
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit = {},
    viewModel: DashboardViewModel = viewModel(factory = DashboardViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showCreate by rememberSaveable { mutableStateOf(false) }

    // When coming back to this tab, refresh (a record may have been added meanwhile)
    LaunchedEffect(Unit) { viewModel.onScreenShown() }

    Box(Modifier.fillMaxSize()) {
        DashboardContent(
            state = state,
            contentPadding = contentPadding,
            onOpenNotifications = onOpenNotifications,
            onRetry = viewModel::refresh,
            onViewAllCategories = { viewModel.showAllCategories(true) },
            onKindChange = viewModel::setBreakdownKind,
            onPeriodChange = viewModel::setPeriod,
            onTrendTypeChange = viewModel::setTrendType,
            onCreateDashboard = { showCreate = true },
        )

        // Management button: tap once → 4 buttons in an arc; tap again → back to normal
        if (state.dashboards.isNotEmpty()) {
            ArcMenu(
                actions = listOf(
                    ArcAction(Icons.Outlined.SwapHoriz, stringResource(R.string.dash_switch)) {
                        viewModel.openManage(ManageDialog.SwitchDashboard)
                    },
                    ArcAction(Icons.Outlined.Category, stringResource(R.string.dash_categories_title)) {
                        viewModel.openManage(ManageDialog.Categories)
                    },
                    ArcAction(Icons.Outlined.Sell, stringResource(R.string.dash_tags)) {
                        viewModel.openManage(ManageDialog.Tags)
                    },
                    ArcAction(Icons.Outlined.Payments, stringResource(R.string.dash_payment_methods)) {
                        viewModel.openManage(ManageDialog.PaymentMethods)
                    },
                ),
                triggerIcon = Icons.Outlined.GridView,
                triggerLabel = stringResource(R.string.dash_manage),
                modifier = Modifier.padding(bottom = contentPadding.calculateBottomPadding()),
            )
        }
    }

    // No dashboard yet: "+" → name → created and active (the ViewModel reloads by itself)
    if (showCreate) {
        DashboardCreateDialog(onDismiss = { showCreate = false }, onCreated = { showCreate = false })
    }

    state.manage?.let { manage ->
        DashboardManageDialog(
            state = manage,
            dashboards = state.dashboards,
            activeDashboardId = state.activeDashboardId,
            onSelectDashboard = viewModel::switchDashboard,
            onUpdate = viewModel::updateManage,
            onAdd = viewModel::saveManage,
            onDismiss = viewModel::closeManage,
        )
    }

    if (state.showAllCategories) {
        DashboardAllCategoriesDialog(
            categories = state.categoryTotals,
            currency = state.currency,
            onDismiss = { viewModel.showAllCategories(false) },
        )
    }
}
