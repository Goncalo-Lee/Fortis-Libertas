package pt.fortislibertas.ui.transactions

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.calculateEndPadding
import androidx.compose.foundation.layout.calculateStartPadding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.FilterAlt
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedIconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.FortisTopBar
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.components.SearchField
import pt.fortislibertas.core.designsystem.components.SelectableChip
import pt.fortislibertas.core.designsystem.components.TransactionGroup
import pt.fortislibertas.core.designsystem.components.dayLabel
import pt.fortislibertas.data.model.RecordType
import pt.fortislibertas.data.model.TransactionItem

@Composable
fun TransactionsScreen(
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit = {},
    onTransactionClick: (TransactionItem) -> Unit = {},
    viewModel: TransactionsViewModel = viewModel(factory = TransactionsViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val layoutDirection = LocalLayoutDirection.current

    LaunchedEffect(Unit) { viewModel.onScreenShown() }

    // Cabeçalho fixo em cima; só a lista faz scroll (e passa por baixo da barra com blur)
    Column(
        Modifier
            .fillMaxSize()
            .padding(
                top = contentPadding.calculateTopPadding(),
                start = contentPadding.calculateStartPadding(layoutDirection),
                end = contentPadding.calculateEndPadding(layoutDirection),
            ),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            FortisTopBar(
                title = stringResource(R.string.transactions_title),
                avatarName = state.userName,
                avatarUrl = state.avatarUrl,
                notificationCount = 0,                   // TODO: ligar às notificações
                notificationsLabel = stringResource(R.string.notifications),
                onNotificationsClick = onOpenNotifications,
            )

            // Pesquisa + botão de filtros (com número de filtros ativos)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                SearchField(
                    query = state.filter.query,
                    onQueryChange = viewModel::onQueryChange,
                    placeholder = stringResource(R.string.search),
                    modifier = Modifier.weight(1f),
                )
                BadgedBox(
                    badge = {
                        val count = state.filter.activeCount
                        if (count > 0) Badge { Text(count.toString()) }
                    },
                ) {
                    OutlinedIconButton(
                        onClick = viewModel::openFilter,
                        shape = RoundedCornerShape(12.dp),
                    ) {
                        Icon(Icons.Outlined.FilterAlt, contentDescription = stringResource(R.string.filter_title))
                    }
                }
            }

            TypeChips(selected = state.filter.type, onSelect = viewModel::onTypeChange)
        }

        // Barra fina enquanto atualiza uma lista que já está no ecrã
        if (state.isLoading && state.hasLoaded) {
            LinearProgressIndicator(Modifier.fillMaxWidth())
        }

        val listModifier = Modifier.weight(1f).fillMaxWidth()
        when {
            !state.hasLoaded && state.isLoading -> LoadingContent(listModifier)

            state.errorMessage != null && state.items.isEmpty() -> ErrorContent(
                message = stringResource(state.errorMessage!!),
                retryLabel = stringResource(R.string.action_retry),
                onRetry = viewModel::retry,
                modifier = listModifier,
            )

            state.items.isEmpty() -> Box(listModifier.padding(32.dp), contentAlignment = Alignment.Center) {
                Text(
                    text = stringResource(R.string.transactions_empty),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }

            else -> {
                // Agrupa por dia (a lista já vem ordenada, mais recentes primeiro)
                val groups = state.items.groupBy { it.date }.entries.toList()
                LazyColumn(
                    modifier = listModifier,
                    contentPadding = PaddingValues(
                        start = 20.dp,
                        end = 20.dp,
                        top = 4.dp,
                        bottom = contentPadding.calculateBottomPadding() + 16.dp,
                    ),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    items(groups, key = { it.key.toString() }) { (date, dayItems) ->
                        TransactionGroup(
                            title = dayLabel(date),
                            items = dayItems,
                            onItemClick = onTransactionClick,
                        )
                    }
                }
            }
        }
    }

    if (state.showFilter) {
        FilterDialog(
            options = state.options,
            current = state.filter,
            currency = state.items.firstOrNull()?.currency ?: "EUR",
            onApply = viewModel::applyFilter,
            onDismiss = viewModel::closeFilter,
        )
    }
}

/** Todos · Receitas · Despesas · Investimentos (só um de cada vez). */
@Composable
private fun TypeChips(selected: RecordType?, onSelect: (RecordType?) -> Unit) {
    val options = listOf(
        null to R.string.filter_all,
        RecordType.INCOME to R.string.legend_income,
        RecordType.EXPENSE to R.string.legend_expense,
        RecordType.INVESTMENT to R.string.filter_investments,
    )
    Row(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        options.forEach { (type, labelRes) ->
            SelectableChip(
                label = stringResource(labelRes),
                selected = selected == type,
                onClick = { onSelect(type) },
            )
        }
    }
}
