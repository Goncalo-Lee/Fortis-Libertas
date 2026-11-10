package pt.fortislibertas.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * Body of PATCH /api/v1/me/profile. Null fields are not sent (encodeDefaults = false),
 * so the server only changes what is filled in.
 */
@Serializable
data class UpdateProfileRequestDto(
    val language: String? = null,
)
