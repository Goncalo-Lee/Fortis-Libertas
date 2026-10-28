package pt.fortislibertas.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BarGroup
import pt.fortislibertas.core.designsystem.components.CardStack
import pt.fortislibertas.core.designsystem.components.EmptyContent
import pt.fortislibertas.core.designsystem.components.ErrorContent
import pt.fortislibertas.core.designsystem.components.FortisTopBar
import pt.fortislibertas.core.designsystem.components.GroupedBarChart
import pt.fortislibertas.core.designsystem.components.LoadingContent
import pt.fortislibertas.core.designsystem.components.TransactionGroup
import pt.fortislibertas.core.designsystem.components.colorFromHex
import pt.fortislibertas.core.designsystem.theme.FortisLibertasTheme
import pt.fortislibertas.core.designsystem.theme.FortisTheme
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.local.FakeHomeData
import pt.fortislibertas.data.model.HomeSummary
import pt.fortislibertas.data.model.TransactionItem
import java.math.BigDecimal
import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Currency
import java.util.Locale

private const val MAX_RECENT = 5

@Composable
fun HomeScreen(
    contentPadding: PaddingValues,
    onOpenBanks: () -> Unit,
    onSeeAllTransactions: () -> Unit,
    onSignIn: () -> Unit,
    onOpenNotifications: () -> Unit = {},
    onTransactionClick: (TransactionItem) -> Unit = {},
    viewModel: HomeViewModel = viewModel(factory = HomeViewModel.Factory),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    // Ao voltar ao separador (ex.: depois de criar um registo), atualiza em silêncio
    LaunchedEffect(Unit) { viewModel.onScreenShown() }

    val summary = state.summary
    when {
        !state.isSignedIn -> EmptyContent(
            title = stringResource(R.string.empty_signed_out_title),
            message = stringResource(R.string.empty_signed_out_message),
            actionLabel = stringResource(R.string.action_sign_in),
            onAction = onSignIn,
            modifier = Modifier.padding(contentPadding),
        )
        summary != null -> HomeContent(
            summary = summary,
            userName = state.userName,
            avatarUrl = state.avatarUrl,
            contentPadding = contentPadding,
            onOpenNotifications = onOpenNotifications,
            onOpenBanks = onOpenBanks,
            onSeeAllTransactions = onSeeAllTransactions,
            onTransactionClick = onTransactionClick,
        )
        state.errorMessage != null -> ErrorContent(
            message = stringResource(state.errorMessage!!),
            retryLabel = stringResource(R.string.action_retry),
            onRetry = viewModel::refresh,
            modifier = Modifier.padding(contentPadding),
        )
        else -> LoadingContent(Modifier.padding(contentPadding))
    }
}

@Composable
private fun HomeContent(
    summary: HomeSummary,
    userName: String?,
    avatarUrl: String?,
    contentPadding: PaddingValues,
    onOpenNotifications: () -> Unit,
    onOpenBanks: () -> Unit,
    onSeeAllTransactions: () -> Unit,
    onTransactionClick: (TransactionItem) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(contentPadding)
            .padding(horizontal = 20.dp, vertical = 16.dp),
    ) {
        FortisTopBar(
            title = stringResource(R.string.home_title),
            avatarName = userName,
            avatarUrl = avatarUrl,
            notificationCount = 0,                      // TODO: ligar às notificações
            notificationsLabel = stringResource(R.string.notifications),
            onNotificationsClick = onOpenNotifications,
        )

        Spacer(Modifier.height(24.dp))

        // ── Saudação + saldo, com a pilha de cartões à direita ──
        Box(Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(end = 96.dp),               // espaço para os cartões
                verticalArrangement = Arrangement.spacedBy(24.dp),
            ) {
                GreetingHeader(fullName = userName)
                BalanceSummary(
                    balance = summary.totalBalance,
                    change = summary.balanceChange,
                    changePercent = summary.balanceChangePercent,
                    currency = summary.currency,
                )
            }
            CardStack(
                colors = summary.cards.map { colorFromHex(it.colorHex) },
                onClick = onOpenBanks,
                onClickLabel = stringResource(R.string.banks_and_cards),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    // empurra para fora do ecrã: 20 dp da margem + 36 dp cortados
                    .offset(x = 56.dp),
            )
        }

        HorizontalDivider(Modifier.padding(vertical = 24.dp))

        // ── Gráfico da semana ──
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = stringResource(R.string.overview_week),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            ChartLegend()
        }
        Spacer(Modifier.height(16.dp))
        WeekChart(summary)

        HorizontalDivider(Modifier.padding(vertical = 24.dp))

        // ── Movimentos recentes ──
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = stringResource(R.string.recent_transactions),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            TextButton(onClick = onSeeAllTransactions) {
                Text(stringResource(R.string.see_all))
            }
        }
        Spacer(Modifier.height(8.dp))

        val recent = summary.recent.take(MAX_RECENT)
        if (recent.isEmpty()) {
            Text(
                text = stringResource(R.string.home_no_transactions),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
            )
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // Agrupa por dia, mantendo a ordem (mais recentes primeiro)
                recent.groupBy { it.date }.forEach { (date, items) ->
                    TransactionGroup(
                        title = dayTitle(date),
                        items = items,
                        onItemClick = onTransactionClick,
                    )
                }
            }
        }
    }
}

@Composable
private fun WeekChart(summary: HomeSummary) {
    val locale = Locale.getDefault()
    val totalIncome = summary.week.fold(BigDecimal.ZERO) { acc, d -> acc + d.income }
    val totalExpense = summary.week.fold(BigDecimal.ZERO) { acc, d -> acc + d.expense }

    GroupedBarChart(
        groups = summary.week.map { day ->
            BarGroup(
                // "seg." → "Seg"
                label = day.date.dayOfWeek.getDisplayName(TextStyle.SHORT, locale)
                    .removeSuffix(".")
                    .replaceFirstChar { it.titlecase(locale) },
                income = day.income.toFloat(),
                expense = day.expense.toFloat(),
            )
        },
        incomeColor = FortisTheme.colors.income,
        expenseColor = FortisTheme.colors.expense,
        axisLabel = { value -> shortMoney(value, summary.currency, locale) },
        contentDescription = stringResource(
            R.string.chart_week_description,
            MoneyFormatter.format(totalIncome, summary.currency),
            MoneyFormatter.format(totalExpense, summary.currency),
        ),
    )
}

/** "Hoje", "Ontem" ou a data ("24 out"). */
@Composable
private fun dayTitle(date: LocalDate): String {
    val today = LocalDate.now()
    return when (date) {
        today -> stringResource(R.string.today)
        today.minusDays(1) -> stringResource(R.string.yesterday)
        else -> date.format(DateTimeFormatter.ofPattern("d MMM", Locale.getDefault()))
    }
}

/** Valores do eixo sem casas decimais: "100 €". */
private fun shortMoney(value: Float, currencyCode: String, locale: Locale): String {
    val nf = NumberFormat.getCurrencyInstance(locale).apply {
        currency = Currency.getInstance(currencyCode)
        maximumFractionDigits = 0
    }
    return nf.format(value)
}

// ── Pré-visualização ────────────────────────────────────

@Preview(showBackground = true, heightDp = 1300)
@Composable
private fun HomeContentPreview() {
    FortisLibertasTheme(darkTheme = false) {
        HomeContent(
            summary = FakeHomeData.build(),
            userName = "Ana Silva",
            avatarUrl = null,
            contentPadding = PaddingValues(),
            onOpenNotifications = {},
            onOpenBanks = {},
            onSeeAllTransactions = {},
            onTransactionClick = {},
        )
    }
}
