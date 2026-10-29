package pt.fortislibertas.ui.transactions

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RangeSlider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.components.BlurDialog
import pt.fortislibertas.core.designsystem.components.CollapsibleSection
import pt.fortislibertas.core.designsystem.components.SelectableChip
import pt.fortislibertas.core.designsystem.util.MoneyFormatter
import pt.fortislibertas.data.model.FilterOptions
import pt.fortislibertas.data.model.TransactionFilter
import java.math.BigDecimal
import java.math.RoundingMode
import kotlin.math.ceil

/**
 * Diálogo de filtros (imagem 2 do wireframe), com fundo desfocado.
 * Cada secção abre/fecha na seta e tem altura máxima com scroll.
 * As escolhas só valem ao carregar em "Aplicar"; tocar fora descarta.
 */
@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun FilterDialog(
    options: FilterOptions?,
    current: TransactionFilter,
    currency: String,
    onApply: (categoryIds: Set<String>, tagIds: Set<String>, min: BigDecimal?, max: BigDecimal?) -> Unit,
    onDismiss: () -> Unit,
) {
    BlurDialog(onDismissRequest = onDismiss) {
        Text(stringResource(R.string.filter_title), style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))

        if (options == null) {
            CircularProgressIndicator(Modifier.padding(32.dp).align(Alignment.CenterHorizontally))
        } else {
            FilterBody(options, current, currency, onApply)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
private fun FilterBody(
    options: FilterOptions,
    current: TransactionFilter,
    currency: String,
    onApply: (categoryIds: Set<String>, tagIds: Set<String>, min: BigDecimal?, max: BigDecimal?) -> Unit,
) {
    Column {
        // Fim do slider arredondado para cima (1 199,50 → 1 200)
        val sliderMax = ceil(options.maxAmount.toFloat()).coerceAtLeast(1f)

        // Rascunho local: só passa para o ecrã no "Aplicar"
        var categoryIds by remember { mutableStateOf(current.categoryIds) }
        var tagIds by remember { mutableStateOf(current.tagIds) }
        var range by remember {
            mutableStateOf(
                (current.minAmount?.toFloat() ?: 0f)..(current.maxAmount?.toFloat() ?: sliderMax),
            )
        }

        // Todo o conteúdo pode fazer scroll se o ecrã for baixo
        Column(
            modifier = Modifier
                .heightIn(max = 480.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // ── Categorias ──
            CollapsibleSection(
                title = stringResource(R.string.filter_categories),
                selectedCount = categoryIds.size,
            ) {
                TextButton(onClick = { categoryIds = options.categories.map { it.id }.toSet() }) {
                    Text(stringResource(R.string.action_select_all))
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    options.categories.forEach { category ->
                        SelectableChip(
                            label = category.name,
                            selected = category.id in categoryIds,
                            onClick = { categoryIds = categoryIds.toggle(category.id) },
                        )
                    }
                }
            }

            // ── Tags ──
            CollapsibleSection(
                title = stringResource(R.string.filter_tags),
                selectedCount = tagIds.size,
            ) {
                TextButton(onClick = { tagIds = options.tags.map { it.id }.toSet() }) {
                    Text(stringResource(R.string.action_select_all))
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    options.tags.forEach { tag ->
                        SelectableChip(
                            label = tag.name,
                            selected = tag.id in tagIds,
                            onClick = { tagIds = tagIds.toggle(tag.id) },
                        )
                    }
                }
            }

            // ── Valor ──
            val amountActive = range.start > 0f || range.endInclusive < sliderMax
            CollapsibleSection(
                title = stringResource(R.string.filter_amount),
                selectedCount = if (amountActive) 1 else 0,
            ) {
                RangeSlider(
                    value = range,
                    onValueChange = { range = it },
                    valueRange = 0f..sliderMax,
                )
                Row {
                    Text(
                        text = MoneyFormatter.format(range.start.toMoney(), currency),
                        style = MaterialTheme.typography.labelLarge,
                        modifier = Modifier.weight(1f),
                    )
                    Text(
                        text = MoneyFormatter.format(range.endInclusive.toMoney(), currency),
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Button(
                onClick = {
                    // Slider nos extremos = sem filtro de valor
                    val min = range.start.takeIf { it > 0f }?.toMoney()
                    val max = range.endInclusive.takeIf { it < sliderMax }?.toMoney()
                    onApply(categoryIds, tagIds, min, max)
                },
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.weight(1f),
            ) { Text(stringResource(R.string.action_apply)) }

            FilledTonalButton(
                onClick = {
                    categoryIds = emptySet()
                    tagIds = emptySet()
                    range = 0f..sliderMax
                },
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.weight(1f),
            ) { Text(stringResource(R.string.action_clear_all)) }
        }
    }
}

private fun Set<String>.toggle(id: String): Set<String> = if (id in this) this - id else this + id

/** Float do slider → valor com 2 casas (evita 12.999999). */
private fun Float.toMoney(): BigDecimal = BigDecimal(toDouble()).setScale(2, RoundingMode.HALF_UP)
