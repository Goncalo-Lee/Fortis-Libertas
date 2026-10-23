package pt.atec.goncalo.fortislibertas_appandroid.data.remote.dto

import kotlinx.serialization.Serializable
import pt.atec.goncalo.fortislibertas_appandroid.data.model.Category

@Serializable
data class CategoryDto(
    val id: Long,
    val name: String,
    val colorHex: String
)

fun CategoryDto.toDomain(): Category = Category(
    id = id,
    name = name,
    colorHex = colorHex
)
