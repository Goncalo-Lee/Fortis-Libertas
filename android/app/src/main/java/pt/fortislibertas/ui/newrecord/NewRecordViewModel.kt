package pt.fortislibertas.ui.newrecord

import androidx.annotation.StringRes
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pt.fortislibertas.FortisApplication
import pt.fortislibertas.R
import pt.fortislibertas.core.designsystem.util.MoneyParser
import pt.fortislibertas.data.local.AccountStore
import pt.fortislibertas.data.model.NewFinancialRecord
import pt.fortislibertas.data.model.NewInstalmentPlan
import pt.fortislibertas.data.model.RecordStatus
import pt.fortislibertas.data.model.Tag
import pt.fortislibertas.data.repository.NetworkException
import pt.fortislibertas.data.repository.RecordRepository
import pt.fortislibertas.data.repository.SessionExpiredException
import java.math.BigDecimal
import java.time.LocalDate

class NewRecordViewModel(
    private val repository: RecordRepository,
    accountStore: AccountStore,
) : ViewModel() {

    private val _state = MutableStateFlow(NewRecordUiState())
    val state: StateFlow<NewRecordUiState> = _state.asStateFlow()

    private val _events = Channel<NewRecordEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        loadOptions()
        // Name and photo of the active account for the header avatar
        viewModelScope.launch {
            combine(accountStore.accounts, accountStore.activeAccountId) { accounts, activeId ->
                accounts.firstOrNull { it.id == activeId }
            }.collect { account ->
                _state.update { it.copy(avatarName = account?.fullName, avatarUrl = account?.imageUrl) }
            }
        }
    }

    fun loadOptions() {
        viewModelScope.launch {
            _state.update { it.copy(isLoadingOptions = true, optionsError = null) }
            try {
                val options = repository.getFormOptions()
                _state.update { it.copy(isLoadingOptions = false, options = options) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _state.update { it.copy(isLoadingOptions = false, optionsError = e.toMessageRes()) }
            }
        }
    }

    // ── Form sheet ──────────────────────────────────────

    fun openSheet(sheet: RegisterSheet) {
        _state.update { it.copy(openSheet = sheet) }
        if (_state.value.options == null && !_state.value.isLoadingOptions) loadOptions()
    }

    fun closeSheet() {
        if (_state.value.isSaving) return
        _state.update {
            it.copy(
                openSheet = null,
                openPicker = null,
                record = RecordFormState(),
                plan = InstalmentFormState(),
            )
        }
    }

    /**
     * Updates the record form and clears the error of the changed field.
     * Automatic rules:
     * - changing the type clears the category if it belongs to another type
     * - changing the date sets the status: future = Pending, today/past = Paid
     */
    fun updateRecord(field: FormField?, transform: (RecordFormState) -> RecordFormState) {
        _state.update { s ->
            val old = s.record
            var new = transform(old)

            if (new.type != old.type && new.categoryId != null) {
                val category = s.options?.categories?.firstOrNull { it.id == new.categoryId }
                if (category != null && category.type != new.type) new = new.copy(categoryId = null)
            }

            val date = new.paymentDate
            if (date != null && date != old.paymentDate) {
                new = new.copy(
                    status = if (date.isAfter(LocalDate.now())) RecordStatus.PENDING else RecordStatus.PAID,
                )
            }

            s.copy(record = new.copy(errors = if (field != null) new.errors - field else new.errors))
        }
    }

    fun updatePlan(field: FormField?, transform: (InstalmentFormState) -> InstalmentFormState) {
        _state.update { s ->
            val new = transform(s.plan)
            s.copy(plan = new.copy(errors = if (field != null) new.errors - field else new.errors))
        }
    }

    // ── Pickers (Category / Tags) ───────────────────────

    fun openPicker(picker: PickerDialog) = _state.update { it.copy(openPicker = picker) }

    fun closePicker() {
        if (_state.value.isCreatingOption) return
        _state.update { it.copy(openPicker = null) }
    }

    fun applyTags(tagIds: Set<String>) {
        when (_state.value.openSheet) {
            RegisterSheet.FinancialRecord -> updateRecord(null) { it.copy(tagIds = tagIds) }
            RegisterSheet.InstalmentPlan -> updatePlan(null) { it.copy(tagIds = tagIds) }
            null -> Unit
        }
        _state.update { it.copy(openPicker = null) }
    }

    /** Choosing a category also sets the type, if none is chosen yet. */
    fun selectCategory(categoryId: String) {
        val category = _state.value.options?.categories?.firstOrNull { it.id == categoryId } ?: return
        when (_state.value.openSheet) {
            RegisterSheet.FinancialRecord -> updateRecord(FormField.Category) {
                it.copy(
                    categoryId = categoryId,
                    type = it.type ?: category.type,
                    errors = it.errors - FormField.Type,
                )
            }
            RegisterSheet.InstalmentPlan -> updatePlan(FormField.Category) { it.copy(categoryId = categoryId) }
            null -> Unit
        }
        _state.update { it.copy(openPicker = null) }
    }

    /** Creates the tag and returns it to the dialog, which selects it straight away. */
    fun createTag(name: String, onCreated: (Tag) -> Unit) {
        val clean = name.trim()
        if (clean.isEmpty() || _state.value.isCreatingOption) return
        viewModelScope.launch {
            _state.update { it.copy(isCreatingOption = true) }
            try {
                val tag = repository.createTag(clean, _state.value.activeCategoryId)
                _state.update { s -> s.copy(options = s.options?.let { it.copy(tags = it.tags + tag) }) }
                onCreated(tag)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _events.send(NewRecordEvent.ShowMessage(e.toMessageRes()))
            } finally {
                _state.update { it.copy(isCreatingOption = false) }
            }
        }
    }

    /** Creates the category with the type of the open form and selects it straight away. */
    fun createCategory(name: String, colorKey: String) {
        val clean = name.trim()
        val type = _state.value.activeType ?: return
        if (clean.isEmpty() || _state.value.isCreatingOption) return
        viewModelScope.launch {
            _state.update { it.copy(isCreatingOption = true) }
            try {
                val category = repository.createCategory(clean, type, colorKey)
                _state.update { s ->
                    s.copy(options = s.options?.let { it.copy(categories = it.categories + category) })
                }
                _state.update { it.copy(isCreatingOption = false) }
                selectCategory(category.id)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _events.send(NewRecordEvent.ShowMessage(e.toMessageRes()))
            } finally {
                _state.update { it.copy(isCreatingOption = false) }
            }
        }
    }

    // ── Save ────────────────────────────────────────────

    fun saveRecord() {
        val form = _state.value.record
        val price = MoneyParser.parse(form.price)

        val errors = buildMap {
            if (form.name.isBlank()) put(FormField.Name, R.string.error_required)
            if (form.type == null) put(FormField.Type, R.string.error_required)
            if (price == null || price <= BigDecimal.ZERO) put(FormField.Price, R.string.error_invalid_amount)
            if (form.paymentDate == null) put(FormField.PaymentDate, R.string.error_required)
            if (form.categoryId == null) put(FormField.Category, R.string.error_required)
        }
        if (errors.isNotEmpty()) {
            _state.update { it.copy(record = form.copy(errors = errors)) }
            return
        }

        val record = NewFinancialRecord(
            name = form.name.trim(),
            description = form.description.trim().ifEmpty { null },
            type = form.type!!,
            price = price!!,
            currency = form.currency,
            paymentMethodId = form.paymentMethodId,
            paymentDate = form.paymentDate!!,
            status = form.status,
            categoryId = form.categoryId!!,
            tagIds = form.tagIds,
            instalmentPlanId = form.instalmentPlanId,
        )
        save(R.string.msg_record_saved) { repository.createRecord(record) }
    }

    fun savePlan() {
        val form = _state.value.plan
        val total = MoneyParser.parse(form.totalAmount)
        val count = form.totalInstalments.trim().toIntOrNull()

        val errors = buildMap {
            if (form.name.isBlank()) put(FormField.Name, R.string.error_required)
            if (total == null || total <= BigDecimal.ZERO) put(FormField.TotalAmount, R.string.error_invalid_amount)
            if (count == null || count < 2) put(FormField.TotalInstalments, R.string.error_min_instalments)
            if (form.firstDueDate == null) put(FormField.FirstDueDate, R.string.error_required)
            if (form.categoryId == null) put(FormField.Category, R.string.error_required)
        }
        if (errors.isNotEmpty()) {
            _state.update { it.copy(plan = form.copy(errors = errors)) }
            return
        }

        val plan = NewInstalmentPlan(
            name = form.name.trim(),
            description = form.description.trim().ifEmpty { null },
            totalAmount = total!!,
            currency = form.currency,
            totalInstalments = count!!,
            firstDueDate = form.firstDueDate!!,
            paymentMethodId = form.paymentMethodId,
            categoryId = form.categoryId!!,
            tagIds = form.tagIds,
        )
        save(R.string.msg_plan_saved) {
            val created = repository.createInstalmentPlan(plan)
            // The new plan now shows up in the "Instalment plan" field of the record
            _state.update { s ->
                s.copy(options = s.options?.let { it.copy(instalmentPlans = it.instalmentPlans + created) })
            }
        }
    }

    private fun save(@StringRes successMessage: Int, block: suspend () -> Unit) {
        if (_state.value.isSaving) return
        viewModelScope.launch {
            _state.update { it.copy(isSaving = true) }
            try {
                block()
                _state.update { it.copy(isSaving = false) }
                closeSheet()
                _events.send(NewRecordEvent.ShowMessage(successMessage))
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                _events.send(NewRecordEvent.ShowMessage(e.toMessageRes()))
            } finally {
                _state.update { it.copy(isSaving = false) }
            }
        }
    }

    @StringRes
    private fun Exception.toMessageRes(): Int = when (this) {
        is SessionExpiredException -> R.string.error_session_expired
        is NetworkException -> R.string.error_network
        else -> R.string.error_generic
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as FortisApplication
                NewRecordViewModel(
                    repository = app.container.recordRepository,
                    accountStore = app.container.accountStore,
                )
            }
        }
    }
}
