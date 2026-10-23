package pt.atec.goncalo.fortislibertas_appandroid.ui.newrecord

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun NewRecordScreen(
    modifier: Modifier = Modifier,
    viewModel: NewRecordViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    // TODO: substituir por UI real a partir de uiState
    Text(text = "NewRecord - $uiState", modifier = modifier)
}
