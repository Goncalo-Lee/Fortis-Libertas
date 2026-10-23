package pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto

import kotlinx.serialization.Serializable
import pt.atec.goncalo.fortislibertas_appandroid.data.model.FinancialRecord

@Serializable
data class FinancialRecordDto(
    val id: Long,
    val title: String,
    val amount: Double,
    val categoryId: Long,
    val date: String,
    val isIncome: Boolean
)

fun FinancialRecordDto.toDomain(): FinancialRecord = FinancialRecord(
    id = id,
    title = title,
    amount = amount,
    categoryId = categoryId,
    date = date,
    isIncome = isIncome
)

fun FinancialRecord.toDto(): FinancialRecordDto = FinancialRecordDto(
    id = id,
    title = title,
    amount = amount,
    categoryId = categoryId,
    date = date,
    isIncome = isIncome
)
